# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

Early-stage login/CRUD app. Only `backend/` currently has code (a bare Express server); `frontend/` exists as an empty directory with no scaffolding yet.

## Commands

Run from `backend/`:
- `npm start` — run the server with plain node
- `npm run dev` — run the server with nodemon (auto-restart on file changes)

There is no test suite configured yet (`npm test` is a placeholder that exits with an error) and no lint script.

## Architecture

- `backend/index.js` is the entire server: an Express app with `cors` and `express.json()` middleware, a single sample route (`GET /api`), listening on `process.env.PORT` (default 5000).
- `mysql2` is a dependency but no database connection, models, or routes have been added yet — expect to build this out (DB connection setup, auth routes, CRUD routes) from scratch.
- `dotenv` is present but there is no `.env` file in the repo; create one locally for `PORT` and any DB credentials as they're introduced.
- No frontend framework has been chosen/scaffolded yet.
