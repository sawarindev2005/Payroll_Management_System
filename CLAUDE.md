# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

Login + employee payroll CRUD app. `backend/` is an Express + MySQL API (auth, employee CRUD, user-account management, monthly salary history, advance/reimbursement claim requests). `frontend/` is a Vite + React SPA (5 routes: login, admin employee dashboard, admin per-employee salary history, admin claim-request approval queue, employee self-service salary view) — mobile-first design using card lists (no `<table>` anywhere) plus a bottom nav bar for admin pages on narrow screens.

Not yet done: a "change password" feature, and stronger delete confirmations/password validation. See `PROGRESS.md` for the current task list.

## Commands

Backend, run from `backend/`:
- `npm start` — run the server with plain node
- `npm run dev` — run the server with nodemon (auto-restart on file changes)
- `node seed.js` — create the first admin account (reads `ADMIN_USERNAME`/`ADMIN_PASSWORD` from `.env`, defaults to `admin`/`admin123`); run once after the schema is loaded

There is no test suite configured yet (`npm test` is a placeholder that exits with an error) and no lint script.

Frontend, run from `frontend/`:
- `npm install` — install React/Vite deps (first time only)
- `npm run dev` — Vite dev server on `http://localhost:5173`, calls the API at `VITE_API_URL` (`.env`, defaults to `http://localhost:5000/api`)
- `npm run build` — production build to `frontend/dist/` (not currently served by the backend — deploy/serve separately if needed)

Both dev servers must be running simultaneously for local development (backend on 5000, frontend on 5173); CORS is wide open on the backend (`cors()` with no options) so no proxy config is needed.

## Architecture

### Database
`database/schema.sql` defines four tables in MySQL:
- `employees` (name, position, base_salary, bonus, deduction) — the *current* pay rate, used to seed each new month's snapshot.
- `users` (login accounts, `role` enum `admin`/`employee`, `employee_id` FK back to `employees`, unique so each employee has at most one account).
- `salary_records` — one row per employee per calendar month (`period_year`/`period_month`, unique together), snapshotting `base_salary`/`bonus`/`deduction` for that month. Rows are created lazily (see below), not by a scheduler.
- `claim_requests` — advance/reimbursement requests (`type` enum `advance`/`reimbursement`), employee-created, `status` enum `pending`/`approved`/`rejected` (one-way transition from `pending` only), tracks `reviewed_by`/`reviewed_at`/`admin_note`.

### Backend (`backend/`)
- `index.js` — Express entrypoint; sets up `cors` + `express.json()`, mounts `routes/authRoutes.js` at `/api/auth`, `routes/employeeRoutes.js` at `/api/employees`, `routes/userRoutes.js` at `/api/users`, `routes/salaryRecordRoutes.js` at `/api/salary-records`, `routes/claimRequestRoutes.js` at `/api/claim-requests`, listens on `process.env.PORT` (default 5000).
- `db.js` — creates and exports a `mysql2/promise` connection pool from `.env` credentials (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).
- `middleware/authMiddleware.js` — `verifyToken` (checks the JWT from `Authorization: Bearer <token>`, populates `req.user`) and `requireAdmin` (checks `req.user.role === 'admin'`); routes chain both via `router.use(...)` where admin-only.
- `utils/salary.js` — shared `withNetSalary(row)` helper (`base_salary + bonus - deduction`, never stored) used by both `employeeRoutes.js` and `salaryRecordRoutes.js`.
- `routes/authRoutes.js` — `POST /api/auth/login`: verifies password with `bcryptjs`, issues a JWT (`jsonwebtoken`, 8h expiry) carrying `id`/`username`/`role`/`employee_id`.
- `routes/employeeRoutes.js` — `GET /me` (any logged-in user, own salary only) plus full CRUD (`GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`), all admin-only.
- `routes/userRoutes.js` — admin-only: `POST /` creates a login account for an employee (hashes password, enforces one account per employee), `DELETE /:id` revokes an employee's account (blocks deleting admin accounts this way).
- `routes/salaryRecordRoutes.js` — `GET /me` and `GET /employee/:employeeId` (admin) both call a local `ensureCurrentMonthRecord()` helper first, which lazily inserts a snapshot row for the current year/month from `employees.base_salary/bonus/deduction` if one doesn't exist yet (races on the `ER_DUP_ENTRY` unique constraint are swallowed, since the row is re-read regardless). `GET /:id` and `PUT /:id` (admin-only) fetch/edit a single month's record without touching `employees`.
- `routes/claimRequestRoutes.js` — `POST /` and `GET /me` (employee, scoped to `req.user.employee_id`); `GET /` (admin, optional `?status=` filter, joins employee name); `PUT /:id/approve` and `PUT /:id/reject` (admin) atomically transition `pending → approved/rejected` via `UPDATE ... WHERE status = 'pending'`, returning 400 if already reviewed.
- `seed.js` — one-off script to insert the first admin row into `users` (password hashed with bcrypt, since that can't be done in raw SQL).
- `.env` (not committed; see `.env.example`) holds `PORT`, DB credentials, `JWT_SECRET`, and optional `ADMIN_USERNAME`/`ADMIN_PASSWORD` for `seed.js`.

### Frontend (`frontend/`, Vite + React, plain CSS — no UI/icon/form library)
- `src/main.jsx` — mounts `<App/>` inside `<BrowserRouter>` + `<AuthProvider>`.
- `src/App.jsx` — routes: `/login`, `/` (admin), `/payroll/:employeeId` (admin), `/requests` (admin), `/salary` (employee), each admin/employee route wrapped in `<ProtectedRoute role="...">`.
- `src/context/AuthContext.jsx` — `user`/`token` state backed by `localStorage` (same keys as the old vanilla app: `salary_app_token`/`salary_app_user`), `login()`/`logout()`.
- `src/api/client.js` — `apiFetch(path, options)` attaches the JWT bearer header and hard-redirects to `/login` on a 401 (mirrors the old `authFetch`); `API_URL` comes from `import.meta.env.VITE_API_URL`.
- `src/components/` — `ProtectedRoute` (role gate + redirect, replaces old `requireRole`), `Topbar` (title + optional back-link + optional desktop nav links + username badge + logout), `BottomNav` (mobile-only, `<768px`, admin pages: พนักงาน/คำขอเบิก), `Modal` (generic overlay used by all 3 modals), `StatusBadge`, `Field` (label+input pair, used by every form).
- `src/pages/EmployeesPage.jsx` (+`EmployeeCard.jsx`) — admin dashboard: employee CRUD form + card list (not a table), create/remove login account via `Modal`.
- `src/pages/PayrollPage.jsx` (+`SalaryRecordCard.jsx`, shared with `SalaryPage`) — admin per-employee salary history card list, "add new month" form, edit-a-month via `Modal`.
- `src/pages/RequestsPage.jsx` (+`ClaimRequestCard.jsx`, shared with `SalaryPage`) — admin claim queue, client-side status filter chips, approve (`window.confirm`) / reject (`Modal` with a note) actions.
- `src/pages/SalaryPage.jsx` — employee-only: current salary summary, salary history card list, claim-request form, own-requests card list.
- `src/styles/index.css` — all styling: design tokens (colors/spacing/radius as CSS custom properties), `.card-list`/`.item-card` (the card-list pattern used everywhere lists used to be tables — `grid-template-columns: repeat(auto-fill, minmax(280px,1fr))`, naturally 1 column on mobile without a separate breakpoint-specific DOM), `.btn`/`.btn-group`, `.bottom-nav` (mobile-only nav, shown via `@media (max-width: 767px)`).
- No `<table>` elements anywhere — every list is a responsive card grid, per explicit user request (not a table that just shrinks/collapses at small widths).
