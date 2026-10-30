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
Authentication uses random, hashed server sessions in HttpOnly cookies: 8-hour
absolute expiry and 30-minute idle expiry. Logout revokes the session. Password
changes require the current password and revoke other sessions. Login attempts
are rate limited in the database. Set `APP_ORIGIN` to the exact production frontend
origin; other origins cannot send authenticated mutations. HTTPS cookies use Secure.
Run `npm test` to check registration, login, and authentication boundaries.

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
