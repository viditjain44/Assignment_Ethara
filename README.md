# Assignment Ethara — Team Task Manager

A full-stack web app to manage projects, assign tasks, and track progress with your team.



## What does it do?

- **Sign up / Log in** — create an account and access your workspace
- **Create projects** — organize your work into projects with deadlines
- **Add teammates** — invite people to your project by email
- **Create tasks** — add tasks with priority, due date, and assignee
- **Track progress** — move tasks through Todo → In Progress → Review → Done
- **Dashboard** — see all your tasks, overdue items, and overall progress at a glance
- **Role-based access** — Admins can manage everything, Members can work on their tasks



## Tech Stack

| Part | Technology |
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Database | MongoDB (Atlas) |
| Auth | JWT (JSON Web Tokens) |
| Hosting | Railway |


## Project Structure

Assignment Ethara/
├── client/          # React frontend
│   └── src/
│       ├── pages/       # Login, Dashboard, Projects, Tasks, Users
│       ├── components/  # Navbar, Modal, Button, Badge etc.
│       ├── context/     # Auth state (login/logout)
│       └── api/         # Axios setup
├── server/          # Express backend
│   ├── models/      # User, Project, Task (MongoDB schemas)
│   ├── routes/      # auth, projects, tasks, users, dashboard
│   └── middleware/  # JWT auth, role checks, validation
├── package.json
└── nixpacks.toml    # Railway deployment config


## How to run locally

**1. Clone the repo**
```bash
git clone https://github.com/viditjain44/Assignment_Ethara.git
cd Assignment Ethara


**2. Install backend dependencies**
```bash
npm install


**3. Set up environment variables**

Create a `.env` file inside the `server/` folder:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=any_long_random_string
JWT_EXPIRES_IN=7d
NODE_ENV=development


**4. Start the backend**
```bash
cd server
npm run dev


**5. Install and start the frontend**
```bash
cd client
npm install
npm run dev


**6. Open the app**

Go to `http://localhost:5173` in your browser.



## API Routes

| Method | Route | What it does |
|---|---|---|
| POST | /api/auth/signup | Create a new account |
| POST | /api/auth/login | Login and get token |
| GET | /api/auth/me | Get current user |
| GET | /api/projects | List all your projects |
| POST | /api/projects | Create a new project |
| POST | /api/projects/:id/members | Add a member to project |
| GET | /api/tasks | List all tasks |
| POST | /api/tasks | Create a new task |
| PATCH | /api/tasks/:id | Update task status |
| GET | /api/dashboard | Get dashboard stats |


## Roles

| Role | What they can do |
|---|---|
| **Admin** | Create projects, add/remove members, delete tasks, manage users |
| **Member** | View projects they belong to, create and update tasks |

---

## Live Demo



---

## Author

Made by **Vidit Jain**