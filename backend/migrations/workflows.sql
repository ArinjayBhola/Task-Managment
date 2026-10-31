CREATE TABLE IF NOT EXISTS workflow_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL,
  created_by uuid NOT NULL REFERENCES admin_accounts(id),
  latest_version integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS workflow_versions (
  template_id uuid NOT NULL REFERENCES workflow_templates(id), version integer NOT NULL,
  definition jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(template_id,version)
);
CREATE TABLE IF NOT EXISTS workflow_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), template_id uuid NOT NULL, version integer NOT NULL,
  name text NOT NULL, created_by uuid NOT NULL REFERENCES admin_accounts(id), request_key uuid NOT NULL,
  state text NOT NULL DEFAULT 'running' CHECK (state IN ('running','completed','canceled')),
  last_error text, checked_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz,
  FOREIGN KEY(template_id,version) REFERENCES workflow_versions(template_id,version), UNIQUE(created_by,request_key)
);
CREATE TABLE IF NOT EXISTS workflow_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), run_id uuid NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
  node_key text NOT NULL, spec jsonb NOT NULL,
  state text NOT NULL DEFAULT 'blocked' CHECK (state IN ('blocked','ready','in_progress','in_review','completed','canceled','skipped')),
  task_id uuid UNIQUE REFERENCES tasks(id) ON DELETE RESTRICT, activated_at timestamptz, due_at timestamptz,
  completed_at timestamptz, feedback text NOT NULL DEFAULT '', reminded_at timestamptz, UNIQUE(run_id,node_key)
);
ALTER TABLE workflow_steps ADD COLUMN IF NOT EXISTS outcome boolean;
ALTER TABLE workflow_steps DROP CONSTRAINT IF EXISTS workflow_steps_state_check,
  ADD CONSTRAINT workflow_steps_state_check CHECK (state IN ('blocked','ready','in_progress','in_review','completed','canceled','skipped'));
CREATE TABLE IF NOT EXISTS workflow_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), run_id uuid NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
  node_key text, action text NOT NULL, actor_id uuid, actor_role text, message text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS workflow_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), run_id uuid NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
  account_id uuid NOT NULL, role text NOT NULL CHECK (role IN ('Admin','User')), message text NOT NULL,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE, read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS workflow_runs_pending ON workflow_runs(checked_at) WHERE state='running';
CREATE INDEX IF NOT EXISTS workflow_notice_inbox ON workflow_notices(account_id,role,created_at DESC);
CREATE INDEX IF NOT EXISTS workflow_events_run ON workflow_events(run_id,created_at);

-- Run row locks serialize all side effects. Retrying a transaction cannot duplicate tasks.
CREATE OR REPLACE FUNCTION workflow_advance(p_run uuid) RETURNS void LANGUAGE plpgsql AS $$
DECLARE r workflow_runs; s workflow_steps; new_task uuid; changed boolean; legacy boolean; should_skip boolean; matched boolean; submission text;
BEGIN
  -- Shared workflow mutations may run concurrently; member deletion takes the
  -- exclusive counterpart before locking accounts or runs.
  PERFORM pg_advisory_xact_lock_shared(742106);
  SELECT * INTO r FROM workflow_runs WHERE id=p_run FOR UPDATE;
  IF NOT FOUND OR r.state<>'running' THEN RETURN; END IF;
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tasks' AND column_name='organization_id') INTO legacy;
  LOOP
    changed := false;
    FOR s IN SELECT * FROM workflow_steps WHERE run_id=p_run AND state='blocked' ORDER BY node_key LOOP
      IF NOT EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(s.spec->'dependencies') d(key)
        LEFT JOIN workflow_steps parent ON parent.run_id=p_run AND parent.node_key=d.key
        WHERE parent.state IS NULL OR parent.state NOT IN ('completed','skipped')
      ) THEN
        should_skip := false;
        IF s.spec->>'type'='condition' THEN
          SELECT state<>'completed' INTO should_skip FROM workflow_steps
            WHERE run_id=p_run AND node_key=s.spec->>'sourceKey';
        END IF;
        IF s.spec ? 'when' THEN
          SELECT should_skip OR (outcome IS DISTINCT FROM (s.spec->'when'->>'outcome')::boolean) INTO should_skip
            FROM workflow_steps WHERE run_id=p_run AND node_key=s.spec->'when'->>'nodeKey';
        END IF;
        IF COALESCE(s.spec->>'join','all')='all' THEN
          should_skip := should_skip OR EXISTS(SELECT 1 FROM workflow_steps parent WHERE parent.run_id=p_run AND parent.node_key IN
            (SELECT jsonb_array_elements_text(s.spec->'dependencies')) AND parent.state='skipped');
        ELSIF jsonb_array_length(s.spec->'dependencies')>0 THEN
          should_skip := should_skip OR NOT EXISTS(SELECT 1 FROM workflow_steps parent WHERE parent.run_id=p_run AND parent.node_key IN
            (SELECT jsonb_array_elements_text(s.spec->'dependencies')) AND parent.state='completed');
        END IF;
        IF should_skip THEN
          UPDATE workflow_steps SET state='skipped',completed_at=now() WHERE id=s.id;
          INSERT INTO workflow_events(run_id,node_key,action,message) VALUES(p_run,s.node_key,'skipped','Branch was not selected');
          changed := true;
          CONTINUE;
        END IF;
        IF s.spec->>'type'='condition' THEN
          SELECT COALESCE(t.member_notes,'') INTO submission FROM workflow_steps source
            JOIN tasks t ON t.id=source.task_id WHERE source.run_id=p_run AND source.node_key=s.spec->>'sourceKey';
          matched := strpos(lower(COALESCE(submission,'')),lower(s.spec->>'keyword'))>0;
          IF s.spec->>'operator'='not_contains' THEN matched := NOT matched; END IF;
          UPDATE workflow_steps SET state='completed',outcome=matched,activated_at=now(),completed_at=now() WHERE id=s.id;
          INSERT INTO workflow_events(run_id,node_key,action,message) VALUES(p_run,s.node_key,'condition_evaluated',CASE WHEN matched THEN 'Matched' ELSE 'Did not match' END);
        ELSIF s.spec->>'type'='delay' THEN
          UPDATE workflow_steps SET state='in_progress',activated_at=now(),
            due_at=now()+make_interval(secs=>(s.spec->>'waitHours')::double precision*3600) WHERE id=s.id;
        ELSE
          new_task := gen_random_uuid();
          IF legacy THEN
            INSERT INTO tasks(id,title,description,status,due_date,admin_notes,assigned_admin_id)
            VALUES(new_task,s.spec->>'title',s.spec->>'description','todo',now()+make_interval(days=>(s.spec->>'dueDays')::int),s.spec->>'description',r.created_by);
            INSERT INTO task_assignees(task_id,user_id) VALUES(new_task,(s.spec->>'assigneeId')::uuid);
          ELSE
            INSERT INTO tasks(id,title,description,status,due_date,admin_notes,assigned_admin_id,assignee_id)
            VALUES(new_task,s.spec->>'title',s.spec->>'description','todo',now()+make_interval(days=>(s.spec->>'dueDays')::int),s.spec->>'description',r.created_by,(s.spec->>'assigneeId')::uuid);
          END IF;
          UPDATE workflow_steps SET state='ready',task_id=new_task,activated_at=now(),due_at=now()+make_interval(days=>(s.spec->>'dueDays')::int) WHERE id=s.id;
          INSERT INTO workflow_notices(run_id,account_id,role,message,task_id)
            VALUES(p_run,(s.spec->>'assigneeId')::uuid,'User','New assignment: '||(s.spec->>'title'),new_task);
        END IF;
        INSERT INTO workflow_events(run_id,node_key,action,message) VALUES(p_run,s.node_key,'activated',s.spec->>'title');
        changed := true;
      END IF;
    END LOOP;
    FOR s IN SELECT * FROM workflow_steps WHERE run_id=p_run AND state='in_progress' AND spec->>'type'='delay' AND due_at<=now() LOOP
      UPDATE workflow_steps SET state='completed',completed_at=now() WHERE id=s.id;
      INSERT INTO workflow_events(run_id,node_key,action,message) VALUES(p_run,s.node_key,'timer_completed',s.spec->>'title');
      changed := true;
    END LOOP;
    EXIT WHEN NOT changed;
  END LOOP;
  FOR s IN SELECT * FROM workflow_steps WHERE run_id=p_run AND spec->>'type'='task' AND state IN ('ready','in_progress','in_review') AND due_at<now() AND reminded_at IS NULL LOOP
    INSERT INTO workflow_notices(run_id,account_id,role,message,task_id) VALUES
      (p_run,(s.spec->>'assigneeId')::uuid,'User','Overdue: '||(s.spec->>'title'),s.task_id),
      (p_run,r.created_by,'Admin','Deadline escalation: '||(s.spec->>'title'),s.task_id);
    UPDATE workflow_steps SET reminded_at=now() WHERE id=s.id;
    INSERT INTO workflow_events(run_id,node_key,action,message) VALUES(p_run,s.node_key,'deadline_escalated',s.spec->>'title');
  END LOOP;
  IF NOT EXISTS(SELECT 1 FROM workflow_steps WHERE run_id=p_run AND state NOT IN ('completed','skipped')) THEN
    UPDATE workflow_runs SET state='completed',completed_at=now() WHERE id=p_run;
    INSERT INTO workflow_events(run_id,action) VALUES(p_run,'run_completed');
    INSERT INTO workflow_notices(run_id,account_id,role,message) VALUES(p_run,r.created_by,'Admin','Workflow completed: '||r.name);
  END IF;
  UPDATE workflow_runs SET last_error=NULL,checked_at=now() WHERE id=p_run;
END $$;

CREATE OR REPLACE FUNCTION workflow_start(p_template uuid,p_version int,p_name text,p_actor uuid,p_key uuid) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE run_id uuid; def jsonb; existing workflow_runs;
BEGIN
  PERFORM pg_advisory_xact_lock_shared(742106);
  PERFORM pg_advisory_xact_lock(hashtextextended(p_actor::text||p_key::text,0));
  SELECT * INTO existing FROM workflow_runs WHERE created_by=p_actor AND request_key=p_key;
  IF FOUND THEN
    IF existing.template_id<>p_template OR existing.version<>p_version OR existing.name<>p_name THEN
      RAISE EXCEPTION 'Request key already used with different run details' USING ERRCODE='P0001';
    END IF;
    RETURN existing.id;
  END IF;
  SELECT definition INTO def FROM workflow_versions WHERE template_id=p_template AND version=p_version;
  IF NOT FOUND THEN RAISE EXCEPTION 'Workflow version not found' USING ERRCODE='P0002'; END IF;
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(def->'nodes') n WHERE n->>'type'='task' AND NOT EXISTS(SELECT 1 FROM users WHERE id=(n->>'assigneeId')::uuid)) THEN
    RAISE EXCEPTION 'An assigned member no longer exists' USING ERRCODE='P0001';
  END IF;
  INSERT INTO workflow_runs(template_id,version,name,created_by,request_key) VALUES(p_template,p_version,p_name,p_actor,p_key) RETURNING id INTO run_id;
  INSERT INTO workflow_steps(run_id,node_key,spec) SELECT run_id,n->>'key',n FROM jsonb_array_elements(def->'nodes') n;
  INSERT INTO workflow_events(run_id,action,actor_id,actor_role) VALUES(run_id,'run_started',p_actor,'Admin');
  PERFORM workflow_advance(run_id);
  RETURN run_id;
END $$;

CREATE OR REPLACE FUNCTION workflow_act(p_run uuid,p_node text,p_action text,p_actor uuid,p_role text,p_message text) RETURNS void LANGUAGE plpgsql AS $$
DECLARE r workflow_runs; s workflow_steps; approved boolean;
BEGIN
  PERFORM pg_advisory_xact_lock_shared(742106);
  SELECT * INTO r FROM workflow_runs WHERE id=p_run FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Workflow not found' USING ERRCODE='P0002'; END IF;
  IF r.state<>'running' THEN RAISE EXCEPTION 'Workflow is no longer running' USING ERRCODE='P0001'; END IF;
  IF p_action='cancel' THEN
    IF p_role<>'Admin' OR p_actor<>r.created_by THEN RAISE EXCEPTION 'Only the run owner can cancel' USING ERRCODE='42501'; END IF;
    UPDATE workflow_runs SET state='canceled',completed_at=now() WHERE id=p_run;
    UPDATE tasks SET status='canceled',updated_at=now() WHERE id IN (SELECT task_id FROM workflow_steps WHERE run_id=p_run AND state NOT IN ('completed','canceled'));
    INSERT INTO workflow_notices(run_id,account_id,role,message,task_id)
      SELECT p_run,(spec->>'assigneeId')::uuid,'User','Assignment canceled: '||(spec->>'title'),task_id FROM workflow_steps WHERE run_id=p_run AND task_id IS NOT NULL AND state NOT IN ('completed','canceled');
    UPDATE workflow_steps SET state='canceled' WHERE run_id=p_run AND state NOT IN ('completed','skipped');
    INSERT INTO workflow_events(run_id,action,actor_id,actor_role,message) VALUES(p_run,'run_canceled',p_actor,p_role,p_message);
    RETURN;
  END IF;
  SELECT * INTO s FROM workflow_steps WHERE run_id=p_run AND node_key=p_node;
  IF NOT FOUND THEN RAISE EXCEPTION 'Step not found' USING ERRCODE='P0002'; END IF;
  IF s.spec->>'type'<>'task' THEN RAISE EXCEPTION 'This step advances automatically' USING ERRCODE='P0001'; END IF;
  IF p_action IN ('start','submit') THEN
    IF p_role<>'User' OR p_actor<>(s.spec->>'assigneeId')::uuid THEN RAISE EXCEPTION 'This assignment is not yours' USING ERRCODE='42501'; END IF;
    IF s.state NOT IN ('ready','in_progress') THEN RAISE EXCEPTION 'This step is not ready for this action' USING ERRCODE='P0001'; END IF;
    IF p_action='start' AND s.state='in_progress' THEN RETURN; END IF;
    IF p_action='start' THEN
      UPDATE workflow_steps SET state='in_progress' WHERE id=s.id;
      UPDATE tasks SET status='in-progress',member_notes=p_message,updated_at=now() WHERE id=s.task_id;
    ELSE
      approved := NOT (s.spec->>'requiresApproval')::boolean;
      UPDATE workflow_steps SET state=CASE WHEN approved THEN 'completed' ELSE 'in_review' END,completed_at=CASE WHEN approved THEN now() END WHERE id=s.id;
      UPDATE tasks SET status=CASE WHEN approved THEN 'done' ELSE 'in-progress' END,member_notes=p_message,updated_at=now() WHERE id=s.task_id;
      INSERT INTO workflow_notices(run_id,account_id,role,message,task_id) VALUES(p_run,r.created_by,'Admin',CASE WHEN approved THEN 'Completed: ' ELSE 'Review requested: ' END||(s.spec->>'title'),s.task_id);
    END IF;
  ELSIF p_action IN ('approve','reject') THEN
    IF p_role<>'Admin' OR p_actor<>r.created_by THEN RAISE EXCEPTION 'Only the run owner can review' USING ERRCODE='42501'; END IF;
    IF s.state<>'in_review' THEN RAISE EXCEPTION 'This step is not awaiting review' USING ERRCODE='P0001'; END IF;
    IF p_action='reject' AND length(trim(p_message))=0 THEN RAISE EXCEPTION 'Explain what needs to change' USING ERRCODE='P0001'; END IF;
    UPDATE workflow_steps SET state=CASE WHEN p_action='approve' THEN 'completed' ELSE 'in_progress' END,completed_at=CASE WHEN p_action='approve' THEN now() END,feedback=p_message WHERE id=s.id;
    UPDATE tasks SET status=CASE WHEN p_action='approve' THEN 'done' ELSE 'in-progress' END,updated_at=now() WHERE id=s.task_id;
    INSERT INTO workflow_notices(run_id,account_id,role,message,task_id) VALUES(p_run,(s.spec->>'assigneeId')::uuid,'User',CASE WHEN p_action='approve' THEN 'Approved: ' ELSE 'Changes requested: ' END||(s.spec->>'title'),s.task_id);
  ELSE RAISE EXCEPTION 'Unknown workflow action' USING ERRCODE='P0001'; END IF;
  INSERT INTO workflow_events(run_id,node_key,action,actor_id,actor_role,message) VALUES(p_run,p_node,p_action,p_actor,p_role,p_message);
  PERFORM workflow_advance(p_run);
END $$;
