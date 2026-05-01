# Team Task Manager

A full-stack team task manager built with Node.js, Express, MongoDB, React, JWT authentication, and role-based access control.

## Project Structure

```text
backend/
frontend/
README.md
```

## Backend Features

- JWT signup and login
- Password hashing with `bcryptjs`
- Role-based access for `Admin` and `Member`
- Project creation and member management
- Task creation, filtering, and updates
- Dashboard statistics endpoint
- Centralized error handling

## Frontend Features

- Login and signup flows
- Protected routes using React Router
- Persistent auth with `localStorage`
- Dashboard with stats and assigned tasks
- Project management page
- Task creation, filtering, and status updates
- Responsive minimal UI with loading states and notifications

## Environment Variables

Create or update [backend/.env](./backend/.env) with:

```env
MONGO_URI=mongodb://127.0.0.1:27017/team-task-manager
JWT_SECRET=replace_with_a_secure_secret
PORT=5000
```

## Run Backend

```bash
cd backend
npm install
npm run dev
```

The backend runs on `http://localhost:5000`.

## Run Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on Vite's default local URL, usually `http://localhost:5173`.

## API Overview

### Auth

- `POST /api/auth/signup`
- `POST /api/auth/login`

### Projects

- `POST /api/projects`
- `GET /api/projects`
- `POST /api/projects/:id/add-member`

### Tasks

- `POST /api/tasks`
- `GET /api/tasks`
- `PUT /api/tasks/:id`

### Dashboard

- `GET /api/dashboard`

## Roles

- `Admin`: create projects, add members, create tasks, update task details
- `Member`: view assigned projects and update their own task status

## Notes

- `frontend/src/services/api.js` points to `http://localhost:5000/api`
- Signup currently allows choosing either `Admin` or `Member` for demo purposes
- For persistent local data, make sure MongoDB is running and `MONGO_URI` points to it
- If the configured MongoDB connection is unavailable in local development, the backend falls back to an in-memory MongoDB instance automatically
