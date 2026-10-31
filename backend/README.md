```
npm install
npm run dev
```

```
npm run deploy
```

Local authentication requires `DATABASE_URL` in `.dev.vars`.
Run `npm run db:auth` once to add the admin account table, then `npm run dev`.
Run `npm run db:tasks` once before saving tasks. This adds admin/member note
storage and makes the old organization, project, and creator fields optional.
Existing records and relationships are preserved.
Open the frontend's `/admin-signup` page and choose your own email and password
(15–128 characters). There are no default admin credentials. Public admin
registration closes after the first admin exists; additional admins require an
authenticated admin request. Existing shorter passwords can still sign in and
can be changed from the account menu.
Run `npm run db:security` after the other setup commands. It transactionally
converts existing integer IDs and foreign keys to UUIDs and adds authentication
storage. Records are preserved; prior ID mappings remain in `id_uuid_migration`.
Old numeric links and JWT logins are no longer valid.
Authentication uses random, hashed server sessions in HttpOnly cookies with a
30-day absolute expiry and no inactivity cutoff. Logout revokes the session. Password
changes require the current password and revoke other sessions. Login attempts
are rate limited in the database. Set `APP_ORIGIN` to the exact production frontend
origin; other origins cannot send authenticated mutations. HTTPS cookies use Secure.
Run `npm test` to check registration, login, and authentication boundaries.

Admins can open a member profile and choose **Delete user**. The MUI confirmation
requires the member's email address; the API also verifies it. Run
`npm run db:members` after `npm run db:workflows` to install the transactional
cleanup function and the session-insert guard. No accounts are deleted by setup.
Deleting a member removes their account, exclusive task assignments and their
children, authored comments/activity, notifications, memberships, authentication
sessions, account throttle entry, and UUID mapping. A shared task remains assigned
to its other members, with its shared progress notes cleared and the removed
member's assignment/creator reference removed.

Running workflows involving the member are canceled; other members' assignments
and notes remain, with canceled status where appropriate. The removed member's
workflow task, submission, feedback, events, and notifications are erased. A
generic placeholder retains only the shared graph's structure. Assignment IDs
are removed from all published versions, which must be reassigned and republished
before starting another run. This privacy cleanup is an intentional exception to
ordinary version immutability. All deletion work commits in one transaction, and
concurrent workflow transitions cannot create new assignments during cleanup.
`npm run test:members:live` verifies this against temporary accounts and removes
its fixtures afterward.

Admins create standalone member accounts from the dashboard. Members sign in
with the email and password set by the admin; no workspace or membership is required.
Passwords are stored as salted hashes. Duplicate emails return a form error.
`node scripts/check-task-flow.mjs` checks account creation, task creation and
persistence, admin edits, member progress, notes, permissions, and deletion against
the configured database. It removes its temporary tasks and accounts afterward.
Set `BACKEND_TEST_URL=http://127.0.0.1:8787` to check the running HTTP backend
instead of the in-process app. `node scripts/check-admin.mjs` runs the same checks.
Use `BACKEND_TEST_URL=http://localhost:5173` to include the frontend API proxy.
Deploy the updated Worker when publishing the cookie-auth frontend. Vercel and
Vite proxy `/api` to keep cookies on the frontend origin. Update the Vercel rewrite
and `APP_ORIGIN` if the deployment domains change.

## Workflow automation

Run `npm run db:workflows` after the existing database setup commands, before
running the updated backend. This additive, repeatable migration creates workflow
storage and transactional Postgres functions; existing tasks are preserved.
Use this migration command to install/update the functions, including when using
Drizzle for other schema changes. No additional secrets or Cloudflare bindings
are needed.

Admins open **Workflows** in the sidebar to build reusable processes. Add task
timer, or condition nodes, drag to arrange them, and connect steps (or select dependencies
in the settings panel). All incoming dependencies must finish before a step
unlocks; independent branches run in parallel. A condition checks whether a
completed task's submission contains (or does not contain) specified text,
ignoring letter case. Downstream steps can run on the matched or unmatched path.
Unused paths are marked skipped without creating assignments. To merge branches,
choose **Continue after selected paths finish** as the join behavior: it waits
for all incoming paths to finish or skip and requires at least one completed path.
The default join requires every prerequisite to complete and propagates skips.
Circular dependencies, duplicate
keys, missing prerequisites, invalid assignments, and graphs over 40 nodes are
rejected before publishing.

Publishing an edit creates an immutable version. Start a named run from any
published version. Each run keeps its original definition and the admin who
started it becomes its reviewer. Ready task nodes automatically create real
assignments with deadlines measured from activation. Blocked steps do not create
tasks or expose other people's work to members.

Members use **Start work** and **Submit for review** on their own assignments.
Approval completes a step and unlocks downstream work; rejection requires feedback
and returns the task for revision. Tasks without approval gates complete on
submission. Ordinary task endpoints cannot bypass workflow state, edit workflow
assignments, or delete them. The owning admin can cancel the run while preserving
completed work and its audit trail.

The run view polls every 15 seconds and shows state, review submissions, feedback,
and execution history. The header inbox polls every 30 seconds for personal
in-app assignment, review, approval, cancellation, and deadline notifications.
Members cannot access templates, run graphs, other members' submissions, or the
admin audit trail.

Deploying the updated backend enables a Cloudflare Cron Trigger every five
minutes. It advances due timers, sends one overdue reminder/escalation per step,
and retries failed advances. Timer/escalation delivery can be up to five minutes
after the scheduled time. **Check timers** on an owned running workflow performs
the same sweep manually, including during local development. No email delivery or external
integrations are included in this release; nodes support assignments, approval
gates, submission-based conditions, and timed waits.

Run locks serialize transitions. Task creation, assignment, notifications, and
audit events commit atomically. Run creation uses a per-admin request UUID so
repeated HTTP requests with the same parameters return the same run. A failed
transaction leaves no partial tasks; cron retries it and the execution view
provides a manual retry when an error has been recorded.

`npm test` covers graph validation and authorization. `npm run test:workflow:live`
uses temporary fixtures against the configured database to verify parallel joins,
approvals/rejection, conditional branches/joins, concurrent requests, timer recovery, immutable versions,
deadline escalation, inbox isolation, cancellation, and completion. It cleans up
its temporary records. Run `npm run test:ui` in frontend for browser coverage.
