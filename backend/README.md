```
npm install
npm run dev
```

```
npm run deploy
```

Local admin signup requires `DATABASE_URL` and `JWT_SECRET` in `.dev.vars`.
Run `npm run db:auth` once to add the admin account table, then `npm run dev`.
Open the frontend's `/admin-signup` page and choose your own email and password
(at least 6 characters). There are no default admin credentials.
Signup and signin are public; the admin dashboard API requires an admin JWT.
Run `npm test` to check registration, login, and authentication boundaries.

Admins can create users from the dashboard. Each new user gets a workspace and
owner membership, and can sign in with the email and password set by the admin.
Passwords are stored as salted hashes. Duplicate emails return a form error.
`node scripts/check-admin.mjs` checks this flow against the configured database
using temporary accounts and removes those accounts and their workspace afterward.
