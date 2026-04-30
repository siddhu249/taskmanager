TaskFlow — Team Task Manager
==============================

A full-stack web application for team collaboration: create projects, assign tasks, and track progress with role-based access control.

Live URL: [Your Railway URL here]
GitHub: [Your GitHub Repo URL here]

--------------------------------------------------
TECH STACK
--------------------------------------------------
Frontend : React 18, React Router v6, Axios, CSS Variables
Backend  : Node.js, Express.js
Database : PostgreSQL
Hosting  : Railway (both services)

--------------------------------------------------
FEATURES
--------------------------------------------------
Authentication
  - Signup / Login with JWT tokens (7-day expiry)
  - Passwords hashed with bcryptjs
  - Protected routes on frontend and backend

Role-Based Access Control
  - Global roles: Admin / Member
  - Project-level roles: Admin / Member
  - Admins can manage members, delete any task/user
  - Members can create and edit their own tasks

Projects
  - Create, view, edit, delete projects
  - Add/remove team members per project
  - View member list with roles

Tasks
  - Create tasks with title, description, status, priority, due date, assignee
  - Status: todo → in_progress → done
  - Priority: low / medium / high
  - Assign tasks to any project member
  - Edit and delete tasks

Dashboard
  - Summary stats (total, todo, in-progress, done, overdue)
  - My open tasks (assigned to me, not done)
  - Overdue tasks across all projects

Team View
  - See all registered users and their roles
  - Admins can delete users

--------------------------------------------------
API ENDPOINTS
--------------------------------------------------
Auth
  POST /api/auth/signup     Create account
  POST /api/auth/login      Login and receive JWT

Projects
  GET    /api/projects         List my projects
  POST   /api/projects         Create project
  GET    /api/projects/:id     Get project details + members
  PUT    /api/projects/:id     Update project
  DELETE /api/projects/:id     Delete project (owner/admin only)
  POST   /api/projects/:id/members          Add member
  DELETE /api/projects/:id/members/:userId  Remove member

Tasks
  GET    /api/tasks              List tasks (filterable: project_id, status, assignee_id)
  GET    /api/tasks/dashboard    Dashboard summary
  POST   /api/tasks              Create task
  PUT    /api/tasks/:id          Update task
  DELETE /api/tasks/:id          Delete task

Users
  GET    /api/users       List all users
  GET    /api/users/me    Get my profile
  PUT    /api/users/me    Update my name
  DELETE /api/users/:id   Delete user (admin only)

--------------------------------------------------
DATABASE SCHEMA
--------------------------------------------------
users          (id, name, email, password, role, created_at)
projects       (id, name, description, owner_id, created_at)
project_members (project_id, user_id, role)  [composite PK]
tasks          (id, title, description, status, priority, due_date,
                project_id, assignee_id, created_by, created_at, updated_at)

--------------------------------------------------
LOCAL SETUP
--------------------------------------------------
Prerequisites: Node.js 18+, PostgreSQL 14+

1. Clone the repository
   git clone <repo-url>
   cd taskmanager

2. Setup the Backend
   cd backend
   npm install
   cp .env.example .env
   # Edit .env: set DATABASE_URL and JWT_SECRET

   Create the database in PostgreSQL:
   createdb taskmanager

   Start the server (it auto-creates tables on first run):
   npm run dev
   # Server runs on http://localhost:5000

3. Setup the Frontend
   cd ../frontend
   npm install

   Create a .env file:
   REACT_APP_API_URL=http://localhost:5000/api

   Start the dev server:
   npm start
   # App runs on http://localhost:3000

--------------------------------------------------
DEPLOYMENT ON RAILWAY (Step-by-step)
--------------------------------------------------
Railway lets you deploy both services for free (with limits).

STEP 1 — Push to GitHub
  git init
  git add .
  git commit -m "Initial commit"
  # Create repo on GitHub, then:
  git remote add origin https://github.com/YOUR_USERNAME/taskmanager.git
  git push -u origin main

STEP 2 — Create Railway Account
  Go to https://railway.app and sign up (free)

STEP 3 — Deploy Backend
  a) Click "New Project" → "Deploy from GitHub repo"
  b) Select your repository
  c) Set Root Directory to: backend
  d) Add environment variables (Settings → Variables):
       DATABASE_URL  = (see Step 5)
       JWT_SECRET    = any_long_random_string_here
       NODE_ENV      = production
       FRONTEND_URL  = (your frontend URL, add after frontend deploy)
  e) Click Deploy

STEP 4 — Add PostgreSQL Database
  a) In your Railway project, click "+ New" → "Database" → "PostgreSQL"
  b) Once created, click the database → Variables tab
  c) Copy the DATABASE_URL value
  d) Go back to your backend service → Variables → paste as DATABASE_URL

STEP 5 — Deploy Frontend
  a) Click "+ New" → "GitHub Repo" → same repo
  b) Set Root Directory to: frontend
  c) Add environment variable:
       REACT_APP_API_URL = https://YOUR-BACKEND-URL.railway.app/api
     (get the backend URL from backend service → Settings → Domains)
  d) Click Deploy

STEP 6 — Update Backend CORS
  In backend service variables, set:
  FRONTEND_URL = https://YOUR-FRONTEND-URL.railway.app

STEP 7 — Test your live app
  Open the frontend URL, create an admin account, and start using the app!

--------------------------------------------------
ENVIRONMENT VARIABLES REFERENCE
--------------------------------------------------
Backend (.env):
  DATABASE_URL   PostgreSQL connection string
  JWT_SECRET     Secret key for signing JWT tokens (use a long random string)
  PORT           Server port (Railway sets this automatically)
  NODE_ENV       development | production
  FRONTEND_URL   Frontend origin for CORS

Frontend (.env):
  REACT_APP_API_URL   Backend API base URL (e.g. https://api.railway.app/api)

--------------------------------------------------
FOLDER STRUCTURE
--------------------------------------------------
taskmanager/
├── backend/
│   ├── src/
│   │   ├── index.js              Entry point
│   │   ├── models/db.js          DB connection + schema init
│   │   ├── middleware/auth.js    JWT authentication middleware
│   │   └── routes/
│   │       ├── auth.js           Signup / Login
│   │       ├── projects.js       Project CRUD + members
│   │       ├── tasks.js          Task CRUD + dashboard
│   │       └── users.js          User management
│   ├── .env.example
│   ├── railway.toml
│   └── package.json
└── frontend/
    ├── public/index.html
    ├── src/
    │   ├── App.js                Routing
    │   ├── index.js              Entry point
    │   ├── index.css             Global styles
    │   ├── api/axios.js          API client + interceptors
    │   ├── context/AuthContext.js   Auth state
    │   ├── components/Layout.js  Sidebar layout
    │   └── pages/
    │       ├── Login.js
    │       ├── Signup.js
    │       ├── Dashboard.js
    │       ├── Projects.js
    │       ├── ProjectDetail.js  Tasks + members per project
    │       ├── Tasks.js          All tasks with filters
    │       └── Users.js          Team directory
    ├── railway.toml
    └── package.json

--------------------------------------------------
DEMO VIDEO SCRIPT (2-5 min)
--------------------------------------------------
0:00 - Show the live URL and describe the app briefly
0:20 - Signup as Admin → show dashboard (empty)
0:40 - Create a project
1:00 - Add a member (signup as member in another tab first)
1:20 - Create tasks with different statuses / priorities / due dates
2:00 - Show task editing, status changes
2:30 - Show the dashboard stats updating
3:00 - Show overdue task highlighting
3:30 - Log in as the Member, show restricted access
4:00 - Show the Team page
4:20 - Show the GitHub repo + README
4:40 - Wrap up
