# FastAPI RBAC — Project Guide

## 1. Project Overview

**FastAPI RBAC** is a production-ready Role-Based Access Control (RBAC) system built with FastAPI, SQLModel, and PostgreSQL. It serves as the backend for an IoT Network Management System (RF24), designed to run on Raspberry Pi with support for distributed sensor networks.

### Key Technologies
| Layer | Technology |
|-------|-----------|
| **Backend** | FastAPI 0.128, SQLModel, Alembic, Python 3.10+ |
| **Database** | PostgreSQL 16 (via Docker) |
| **Frontend** | React 19, TypeScript, Redux Toolkit, Material UI v7 |
| **Real-time** | Socket.IO (python-socketio + socket.io-client) |
| **Auth** | JWT (python-jose), Argon2 password hashing |
| **Deployment** | Docker Compose, Nginx (UI), Uvicorn/Gunicorn |

### High-Level Architecture
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Browser    │ ◄──► │  Nginx (UI)  │ ◄──► │   FastAPI   │
│  React SPA   │     │  :8088       │     │   :4000     │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                  │
                                            ┌────▼──────┐
                                            │ PostgreSQL│
                                            │   :5432   │
                                            └───────────┘

Real-time: WebSocket (Socket.IO) at /ws
REST API:  HTTP at /api/v1/...
```

---

## 2. Getting Started

### Prerequisites
- **Docker & Docker Compose** (recommended) — or Python 3.10+, PostgreSQL 12+
- Git

### Quick Start (Docker)
```bash
# 1. Clone and configure environment
git clone <repo-url> && cd FastAPI-RBAC
cp .env.example .env

# 2. Start all services (DB, API, UI)
docker compose up --build -d

# 3. Access the application
#    UI:      http://localhost:8088
#    API docs: http://localhost:4000/api/docs
```

Default login: **`admin` / `admin1234567`** (configurable via `.env`)

### Local Development Setup
```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Ensure .env exists at project root, then bootstrap DB:
python -m app.core.bootstrap

# Start API server (hot reload):
fastapi dev app/main.py --host 0.0.0.0 --port 4000
# or: uvicorn app.main:app --host 0.0.0.0 --port 4000 --reload

# Frontend (separate terminal)
cd client
npm install
npm run dev          # http://localhost:3000
```

### Running Tests
```bash
# Backend (if test files exist)
pytest backend/tests/

# Frontend
cd client && npm run test    # Vitest
```

---

## 3. Project Structure

```
FastAPI-RBAC/
├── .env.example                  # Environment variable template
├── docker-compose.yml            # 3-service compose (postgres, api, ui)
│
├── backend/                      # FastAPI application
│   ├── app/
│   │   ├── main.py               # App factory, CORS, router mount, lifecycle
│   │   ├── api/v1/
│   │   │   ├── api.py            # Route aggregation (users, roles, auth, …)
│   │   │   └── endpoints/
│   │   │       ├── auth.py       # Login, logout, current user
│   │   │       ├── users.py      # CRUD for users
│   │   │       ├── rols.py       # CRUD for roles (note: typo in filename)
│   │   │       ├── permission.py # Permission assignment/removal
│   │   │       ├── system.py     # System metrics endpoints
│   │   │       └── services.py   # Service status & control
│   │   ├── core/
│   │   │   ├── config.py         # Single source of truth for settings (.env)
│   │   │   ├── security.py       # JWT, password hashing, auth deps
│   │   │   ├── rbac.py           # Permission decorators (require_permission, etc.)
│   │   │   ├── bootstrap.py      # Startup: wait-for-db → migrate → seed → reset
│   │   │   └── seed_db.py        # Seed data (16 perms, superuser role, admin)
│   │   ├── db/
│   │   │   └── session.py        # Engine, session factory
│   │   ├── models/
│   │   │   ├── user.py           # User, Role SQLModel tables
│   │   │   └── permission.py     # Permission, RolePermission junction table
│   │   ├── schemas/              # Pydantic request/response models
│   │   ├── websockets/           # Socket.IO handlers, connection manager
│   │   └── static/               # Compiled React assets (production)
│   ├── alembic/                  # Database migrations
│   ├── alembic.ini               # Alembic config
│   ├── requirements.txt          # Python dependencies
│   ├── start.sh                  # Startup script
│   └── manage_db.py              # CLI for DB management (seed, reset, status)
│
├── client/                       # React frontend
│   ├── src/
│   │   ├── api/                  # Generated OpenAPI client (openapi-typescript-codegen)
│   │   ├── app/                  # Redux store, typed hooks
│   │   ├── components/           # dashboard/, signin/, signup/, ui/
│   │   ├── features/             # Feature slices (user, counter, quotes)
│   │   ├── hooks/                # useDialogs, useNotifications, useSocket
│   │   ├── pages/                # dashboard/, signin/, signup/
│   │   ├── routers/              # AppRouter, DashboardRouter
│   │   ├── theme/                # MUI theme customization
│   │   └── utils/                # Shared helpers, test utilities
│   ├── scripts/generate-api.mjs  # OpenAPI client generation script
│   ├── vite.config.ts            # Vite build config
│   └── package.json              # Frontend dependencies & scripts
│
└── .continue/rules/              # Continue AI rules (this file)
```

### Important Configuration Files
| File | Purpose |
|------|---------|
| `.env` (root) | Single source of truth for DB, JWT, CORS, Socket.IO settings |
| `docker-compose.yml` | Service definitions, port mappings, healthchecks |
| `backend/alembic.ini` | Alembic migration configuration |
| `client/vite.config.ts` | Vite dev server & build config |
| `backend/requirements.txt` | Python package dependencies |

---

## 4. Development Workflow

### Coding Standards
- **Python**: Follow PEP 8; type hints required on all functions
- **TypeScript**: Strict mode enabled (`tsconfig.json`); use ESLint + Prettier
- **Naming**: `snake_case` for Python, `camelCase` for JS/TS
- **Imports**: Grouped standard library → third-party → local; sorted within groups

### Testing Approach
- Frontend tests use **Vitest** with React Testing Library (`client/src/`)
- Backend tests (if added) should use **pytest** with `backend/tests/`

### Build & Deployment
```bash
# Frontend build → backend/app/static (for production serving)
cd client && npm run build

# Full Docker deployment
docker compose up --build -d

# Frontend dev (hot reload)
cd client && npm run dev        # http://localhost:3000

# API dev (hot reload)
cd backend && fastapi dev app/main.py --port 4000
```

### Database Migrations
```bash
# Create a new migration after model changes
cd backend && alembic revision --autogenerate -m "describe change"

# Apply migrations
alembic upgrade head

# Rollback one revision
alembic downgrade -1

# Full reset (deletes all data!)
python -m alembic.reset_db && alembic upgrade head
```

### Contribution Guidelines
1. Fork the repository and create a feature branch (`feature/description`)
2. Make changes; ensure both backend and frontend type-check/lint cleanly
3. Run tests: `npm run test` (client) and `pytest` (backend if applicable)
4. Submit a pull request with a clear description of changes

---

## 5. Key Concepts

### RBAC Permission Model
Permissions follow a `resource:action` naming convention (16 seeded):

| Resource | Actions |
|----------|---------|
| `user` | create, read, update, delete |
| `role` | create, read, update, delete |
| `permission` | create, read, update, delete |
| `sensors` | read |
| `terminal` | read |
| `services` | read, update |

### Role Hierarchy
- **`superuser`** (role id = 1): Has all 16 permissions. The default admin user is assigned this role on first run.
- Additional roles are created at runtime via the Roles API and can be assigned any subset of permissions.

### Authentication Flow
1. Client sends credentials to `POST /api/v1/auth/login`
2. Server validates against Argon2-hashed password, returns JWT token
3. Token is stored (cookie or header) and sent with subsequent requests
4. `get_current_user` dependency extracts & validates the token on each request

### Real-time Communication
- Socket.IO mounted at `/ws`
- Clients authenticate via `auth: { token }` option in `io()` constructor
- Server emits events like `role_created`, `user_updated`, etc.
- Sensor and service data is streamed in real-time to subscribed clients

### Bootstrap System (`app/core/bootstrap.py`)
On every server start:
1. Waits for PostgreSQL to be ready (up to 30 attempts)
2. Checks `SEED_VERSION` from `.env` against stored version in DB
3. If versions differ → drops all tables, re-migrates, re-seeds (full reset)
4. Runs Alembic migrations (idempotent)
5. Seeds permissions, superuser role, and default admin (idempotent)

> **Warning**: Bumping `SEED_VERSION` in `.env` wipes ALL database data on next start.

---

## 6. Common Tasks

### Adding a New Endpoint
1. Create endpoint file in `backend/app/api/v1/endpoints/`
2. Define Pydantic schemas in `backend/app/schemas/`
3. Add SQLModel model if needed in `backend/app/models/`
4. Register the router in `backend/app/api/v1/api.py`
5. Create a migration: `alembic revision --autogenerate -m "add X"`
6. Test via Swagger UI at `http://localhost:4000/api/docs`

### Adding a New Permission
1. Edit `backend/app/core/seed_db.py` to include the new permission name
2. Bump `SEED_VERSION` in `.env` to trigger a full reset and reseed
3. Protect endpoints using `@Depends(require_permission("resource:action"))`

### Adding a New Role
```bash
curl -X POST "http://localhost:4000/api/v1/roles" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "editor"}'
```

### Generating the Frontend API Client
```bash
cd client && npm run api:generate
```
This reads the OpenAPI spec from the running backend and generates TypeScript models/services in `client/src/api/`.

### Resetting the Database
```bash
# Option 1: Full wipe via Docker
docker compose down -v

# Option 2: Bump SEED_VERSION in .env (triggers reset on next start)
# Option 3: CLI tool
cd backend && python manage_db.py --reset
```

### Monitoring WebSocket Connections
The `state` module in `backend/app/websockets/` tracks connected users by `user_id → set of socket sids`. Use the `disconnect_user(user_id)` helper to force-disconnect all connections for a user.

---

## 7. Troubleshooting

| Issue | Likely Cause | Fix |
|-------|-------------|-----|
| "Could not validate credentials" | Expired or invalid JWT token | Re-login; check `ACCESS_TOKEN_EXPIRE_MINUTES` |
| "Permission denied" (403) | User's role lacks required permission | Assign permission to user's role via API or seed |
| "Role not found" | Role ID doesn't exist in DB | Check role was created; verify `role_id` on user |
| Database connection failed | PostgreSQL not running or wrong credentials | Check `docker compose ps`; verify `.env` DB vars |
| Frontend can't reach API | CORS misconfiguration or wrong proxy URL | Check `CORS_ORIGINS` in `.env`; ensure `/api` routes to backend |
| WebSocket not connecting | Socket.IO CORS or token issue | Check `SOCKETIO_CORS_ORIGINS`; verify token passed in `auth` option |
| Migrations fail after model change | Autogenerate missed a relationship | Review diff; manually edit migration file if needed |
| `alembic revision --autogenerate` misses tables | Models not imported in env.py | Ensure `import app.models` is present in `alembic/env.py` |

### Debugging Tips
- Enable SQL echo: set `DB_ECHO=true` in `.env` to see generated queries
- Check bootstrap logs: look for `[bootstrap]` prefixed messages on server start
- Swagger UI at `/api/docs` is the fastest way to test endpoints interactively
- Frontend dev server (`npm run dev`) proxies `/api` and `/ws` to the backend automatically

---

## 8. References

### Documentation
- [FastAPI Docs](https://fastapi.tiangolo.com/) — Framework reference
- [SQLModel Guide](https://sqlmodel.tiangolo.com/) — ORM + Pydantic
- [Alembic Docs](https://alembic.sqlalchemy.org/) — Database migrations
- [Socket.IO Docs](https://socket.io/docs/v4/) — Real-time communication
- [Material UI v7](https://mui.com/material-ui/) — Frontend component library

### Project-Specific Docs
- `backend/SEEDING.md` — How seeding works, reset workflow, extending permissions
- `backend/DATABASE_MANAGEMENT.md` — CLI tools for DB management
- `backend/IMPROVEMENTS.md` — Planned enhancements and technical debt

### External Resources
- [JWT RFC 7519](https://tools.ietf.org/html/rfc7519) — JWT specification
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Argon2 Password Hashing](https://argon2.online/) — Password security

---

*This guide was auto-generated from the codebase. Review and update as the project evolves.*
