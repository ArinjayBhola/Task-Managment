# React + Vite

TaskMaster includes admin and member dashboards, with solid-color light and dark
themes. Use the sun/moon control in the header to switch; the preference is saved
on this browser. A new browser defaults to its system appearance.

Admins use the indigo Admin console for team management and task assignments.
Members use the emerald My dashboard for personal tasks and read-only team
activity. Client route guards keep the two navigation flows separate; API
authorization continues to enforce access on the backend.

Dropdowns use MUI Select. Task due dates use MUI X DatePicker with Day.js and
are sent to the API as `YYYY-MM-DD` calendar dates. Both controls follow the
selected light/dark mode and role accent. There is no workspace selector or
workspace setup; accounts and assignments belong directly to the team.

Run `npm install` and `npm run dev`, with the backend running on port 8787.
Run `npm run build` and `npm run lint` before committing.
Authentication uses HttpOnly cookies; credentials and tokens are not stored in
localStorage. `/api` is proxied to the backend by Vite locally and Vercel in
production. Account security includes password changes and server-side sign-out.
New account passwords require at least 15 characters. Members and tasks use UUIDs.
Notifications use MUI Snackbar/Alert, and destructive actions use MUI Dialog.

Browser checks: run `npx playwright install chromium --only-shell` once, then
`npm run test:ui`. Tests use mocked API responses to exercise both roles, both
themes, search, filters, dialogs, password controls, and mobile navigation.
They start a dedicated Vite server on port 4179 and save screenshots under
`test-results/` (ignored by Git).

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
