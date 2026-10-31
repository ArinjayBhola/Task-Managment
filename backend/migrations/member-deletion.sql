-- Session creation obtains the same account-row protection as a foreign key.
-- A login cannot recreate an orphan session while its account is being removed.
CREATE OR REPLACE FUNCTION validate_session_account() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.role='User' THEN
    PERFORM 1 FROM users WHERE id=NEW.account_id FOR KEY SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Account no longer exists' USING ERRCODE='23503'; END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS auth_session_account_guard ON auth_sessions;
CREATE TRIGGER auth_session_account_guard BEFORE INSERT ON auth_sessions
  FOR EACH ROW EXECUTE FUNCTION validate_session_account();

CREATE OR REPLACE FUNCTION delete_managed_user(p_user uuid,p_actor uuid,p_confirmation text)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE account_email text; task_ids uuid[]; related_tasks uuid[]; legacy boolean;
  relation record; run record; deleted_tasks integer:=0; canceled_runs integer:=0;
BEGIN
  -- Wait for in-flight workflow changes, and prevent a new run from being
  -- assigned to this account while its related records are being removed.
  PERFORM pg_advisory_xact_lock(742106);
  IF NOT EXISTS(SELECT 1 FROM admin_accounts WHERE id=p_actor) THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE='42501';
  END IF;
  SELECT email INTO account_email FROM users WHERE id=p_user FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF lower(trim(p_confirmation))<>lower(account_email) THEN
    RAISE EXCEPTION 'Type the member email address to confirm deletion' USING ERRCODE='P0001';
  END IF;
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tasks' AND column_name='organization_id') INTO legacy;
  IF legacy THEN
    SELECT COALESCE(array_agg(t.id),'{}'::uuid[]) INTO related_tasks
      FROM tasks t WHERE EXISTS(SELECT 1 FROM task_assignees a WHERE a.task_id=t.id AND a.user_id=p_user);
    SELECT COALESCE(array_agg(t.id),'{}'::uuid[]) INTO task_ids FROM tasks t
      WHERE t.id=ANY(related_tasks) AND NOT EXISTS(SELECT 1 FROM task_assignees a WHERE a.task_id=t.id AND a.user_id<>p_user);
    -- Shared assignments survive; remove the deleted member's progress notes.
    UPDATE tasks SET member_notes='' WHERE id=ANY(related_tasks) AND NOT (id=ANY(task_ids));
  ELSE
    SELECT COALESCE(array_agg(id),'{}'::uuid[]) INTO task_ids FROM tasks WHERE assignee_id=p_user;
    related_tasks:=task_ids;
  END IF;
  FOR run IN SELECT r.* FROM workflow_runs r WHERE EXISTS(
    SELECT 1 FROM workflow_steps s WHERE s.run_id=r.id AND
      (s.spec->>'assigneeId'=p_user::text OR s.task_id=ANY(task_ids))
  ) ORDER BY r.id FOR UPDATE LOOP
    IF run.state='running' THEN
      PERFORM workflow_act(run.id,'','cancel',run.created_by,'Admin','A member account was deleted.');
      canceled_runs:=canceled_runs+1;
    END IF;
    DELETE FROM workflow_events e WHERE e.run_id=run.id AND EXISTS(
      SELECT 1 FROM workflow_steps s WHERE s.run_id=e.run_id AND s.node_key=e.node_key
        AND (s.spec->>'assigneeId'=p_user::text OR s.task_id=ANY(task_ids))
    );
    INSERT INTO workflow_events(run_id,action,actor_id,actor_role,message)
      VALUES(run.id,'member_deleted',p_actor,'Admin','A member assignment and its personal data were permanently removed.');
  END LOOP;
  DELETE FROM workflow_events WHERE actor_id=p_user AND actor_role='User';
  DELETE FROM workflow_notices WHERE (account_id=p_user AND role='User') OR task_id=ANY(task_ids);
  -- Preserve the graph structure of shared runs, without retaining the removed
  -- assignment's task, personal notes, identity, feedback, or timestamps.
  UPDATE workflow_steps SET task_id=NULL,feedback='',activated_at=NULL,due_at=NULL,completed_at=NULL,reminded_at=NULL,
    state=CASE WHEN state='completed' THEN 'completed' ELSE 'canceled' END,
    spec=jsonb_build_object('key',node_key,'type','task','title','Deleted member assignment','description','',
      'assigneeId',NULL,'dependencies',COALESCE(spec->'dependencies','[]'::jsonb),'dueDays',3,'requiresApproval',false)
    WHERE spec->>'assigneeId'=p_user::text OR task_id=ANY(task_ids);
  -- Ordinary publishing keeps versions immutable. Account deletion is the
  -- deliberate exception: remove its identifier from every retained version.
  UPDATE workflow_versions v SET definition=jsonb_set(v.definition,'{nodes}',(
    SELECT jsonb_agg(CASE WHEN n.value->>'assigneeId'=p_user::text THEN n.value||'{"assigneeId":null}'::jsonb ELSE n.value END ORDER BY n.ordinality)
      FROM jsonb_array_elements(v.definition->'nodes') WITH ORDINALITY n(value,ordinality)
  )) WHERE EXISTS(SELECT 1 FROM jsonb_array_elements(v.definition->'nodes') n WHERE n->>'assigneeId'=p_user::text);
  DELETE FROM auth_sessions WHERE account_id=p_user AND role='User';
  DELETE FROM auth_rate_limits WHERE bucket_hash=encode(sha256(convert_to('account:'||lower(account_email),'UTF8')),'hex');
  -- Clean task children explicitly for both the legacy cascade schema and the
  -- newer restrictive schema. All table/column names come from the catalog.
  FOR relation IN SELECT child.relname AS table_name,a.attname AS column_name
    FROM pg_constraint c JOIN pg_class child ON child.oid=c.conrelid
    JOIN pg_namespace ns ON ns.oid=child.relnamespace
    JOIN pg_attribute a ON a.attrelid=child.oid AND a.attnum=c.conkey[1]
    WHERE c.contype='f' AND c.confrelid='public.tasks'::regclass AND ns.nspname='public' AND cardinality(c.conkey)=1
  LOOP
    IF relation.table_name<>'workflow_steps' THEN
      EXECUTE format('DELETE FROM public.%I WHERE %I=ANY($1)',relation.table_name,relation.column_name) USING task_ids;
    END IF;
  END LOOP;
  DELETE FROM tasks WHERE id=ANY(task_ids);
  GET DIAGNOSTICS deleted_tasks=ROW_COUNT;
  FOR relation IN SELECT child.relname AS table_name,a.attname AS column_name
    FROM pg_constraint c JOIN pg_class child ON child.oid=c.conrelid
    JOIN pg_namespace ns ON ns.oid=child.relnamespace
    JOIN pg_attribute a ON a.attrelid=child.oid AND a.attnum=c.conkey[1]
    WHERE c.contype='f' AND c.confrelid='public.users'::regclass AND ns.nspname='public' AND cardinality(c.conkey)=1
  LOOP
    IF relation.table_name='tasks' THEN
      -- Historic creator references do not own another member's assignment.
      EXECUTE format('UPDATE public.tasks SET %I=NULL WHERE %I=$1',relation.column_name,relation.column_name) USING p_user;
    ELSE
      EXECUTE format('DELETE FROM public.%I WHERE %I=$1',relation.table_name,relation.column_name) USING p_user;
    END IF;
  END LOOP;
  IF to_regclass('public.id_uuid_migration') IS NOT NULL THEN
    DELETE FROM id_uuid_migration WHERE (table_name='users' AND new_id=p_user) OR (table_name='tasks' AND new_id=ANY(task_ids));
  END IF;
  DELETE FROM users WHERE id=p_user;
  RETURN jsonb_build_object('deleted',true,'tasksDeleted',deleted_tasks,'workflowsCanceled',canceled_runs);
END $$;
