# Task Management

Built a **Task Management** webpage with React, Hono (Cloudflare Workers),
PostgreSQL, Prisma ORM, Redux, and Tailwind CSS. Enabled user/admin sign-in, task creation,
editing, and task viewing across users.

---

## Features

### Admin

- **Create User**: Add new users to the system.
- **Assign Task**: Assign tasks to any user.
- **Edit Task**: Modify details of an assigned task.
- **Delete Task**: Remove tasks as required.

### User

- **View All Users**: Access a list of all users in the system.
- **View Own Tasks**: See the list of tasks assigned to them.
- **Edit Own Tasks**: Update details of their own tasks.

---

## Production Link

Visit the live application: **[Task Management](https://task-managment-8ihr.vercel.app/)**

---

## Routes

### Admin Routes

- **Admin Signup**: `/admin-signup`  
  Allows admin to create a new admin account.
- **Admin Signin**: `/admin-signin`  
  Enables admin to log in to their account.

### User Routes

- **User Signin**: `/user-signin`  
  Enables users to log in to their account.

---

## Tech Stack

- **Frontend**: React, HTML5, CSS3, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
