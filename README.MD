# 🔐 FastAPI RBAC

A modern, production-ready **Role-Based Access Control (RBAC)** system built with **FastAPI**, **SQLModel**, and **PostgreSQL**. This backend powers a complete IoT management platform with real-time WebSocket support, JWT authentication, and granular permission management.

> **Backend for RF24 IoT Network Management System** - Built for Raspberry Pi and compatible with distributed sensor networks.

---

## ✨ Key Features

- 🔑 **JWT-based Authentication** - Secure token generation and verification
- 👥 **Role-Based Access Control** - Flexible permission system with granular control
- 🔌 **Real-time WebSockets** - Live updates via Socket.IO integration
- 🗄️ **SQLModel ORM** - Type-safe database operations with Pydantic validation
- 📊 **Database Migrations** - Alembic for version control and schema management
- 🛡️ **Password Hashing** - Argon2 for secure password storage
- 📝 **Interactive API Docs** - Auto-generated Swagger UI and ReDoc documentation
- ⚡ **Hot Reload Development** - FastAPI CLI for rapid development iteration
- 🔄 **CORS Enabled** - Pre-configured for frontend integration

---

## 📋 System Architecture

### User → Role → Permission Flow

```
User (id, username, email, role_id)
  ↓
Role (id, name) [e.g., "admin", "user", "viewer"]
  ↓
Permissions (id, name) [e.g., "user:read", "role:create", "role:delete"]
```

### Seeded Role

Only one role is created by default — additional roles (e.g. `admin`, `viewer`)
are created at runtime via the Roles API.

| Role | Permissions | Use Case |
|------|-------------|----------|
| **`superuser`** | All 16 permissions | System administrator |

The default admin user (`admin` / `admin1234567`, configurable via `.env`) is
assigned the `superuser` role on first run.

### Permission Model

Permissions follow a `resource:action` naming convention. The 16 seeded
permissions are:

- `user:create`, `user:read`, `user:update`, `user:delete`
- `role:create`, `role:read`, `role:update`, `role:delete`
- `permission:create`, `permission:read`, `permission:update`, `permission:delete`
- `sensors:read`, `terminal:read`, `services:read`, `services:update`

> See **[backend/SEEDING.md](backend/SEEDING.md)** for how seeding works, what
> gets created, and how to reset/extend it.

---

## 🚀 Quick Start

## 🐳 Docker Compose (API + Postgres + Nginx UI)

This project includes a full Docker Compose setup with three services:

- **`postgres`** — PostgreSQL 16 with a healthcheck (the `api` waits for it).
- **`api`** — FastAPI service. On startup it runs **`app/core/bootstrap.py`**,
  which waits for the DB, applies migrations, **seeds** the default data, and
  performs a full reset if `SEED_VERSION` changed (see
  [backend/SEEDING.md](backend/SEEDING.md)).
- **`ui`** — React build served by **Nginx** (Brotli/Gzip pre-compressed
  assets) that reverse-proxies `/api` and `/ws` to the API.

Configuration comes from a **single `.env` at the project root** — copy the
template first:

```bash
cp .env.example .env
```

### Start All Services

```bash
docker compose up --build -d
```

The database is migrated and seeded automatically on first start — no manual
steps required. Default login: **`admin` / `admin1234567`**.

### Access Services

- **UI**: `http://localhost:8088` (override with `NGINX_PORT` in `.env`)
- **API docs (Swagger)**: `http://localhost:4000/api/docs`
- **API via UI proxy**: `http://localhost:8088/api/...`

### Stop Services

```bash
docker compose down
```

### Reset Database (wipe all data)

```bash
docker compose down -v        # drops the Postgres volume, full fresh start
# — or — bump SEED_VERSION in .env to reset on the next start (see SEEDING.md)
```

The Compose file is at `docker-compose.yml` in the project root.

### Prerequisites

- Python 3.10+
- PostgreSQL 12+
- pip or poetry

### 1️⃣ Installation

```bash
# Clone the repository
git clone git@github.com:mostaffa/FastAPI-RBAC.git
cd FastAPI-RBAC

# Create the single .env at the project root (used by backend + compose + Vite)
cp .env.example .env

# Set up the backend virtual environment
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2️⃣ Environment Configuration

There is a **single `.env` at the project root** that configures the backend,
Docker Compose, and the Vite dev server. Copy the template and adjust values:

```bash
cp .env.example .env
```

Key variables (`POSTGRES_*` are the source of truth for the DB connection —
under Docker the `api` service overrides `POSTGRES_HOST` to the `postgres`
service name):

```env
# Database
POSTGRES_HOST=localhost          # compose overrides to "postgres"
POSTGRES_PORT=5432
POSTGRES_USER=rbac
POSTGRES_PASSWORD=123456789
POSTGRES_DB=rbac
# DATABASE_URL=...               # optional explicit override (external DB)

# Security / JWT
SECRET_KEY=change-me-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Default seeded admin (see backend/SEEDING.md)
DEFAULT_USER=admin
DEFAULT_PASSWORD=admin1234567
ADMIN_EMAIL=admin@example.com

# Bump to force a full DB reset (drop + re-migrate + reseed) on next start
SEED_VERSION=1
```

See [`.env.example`](.env.example) for the complete annotated list (CORS,
connection pool, Socket.IO, monitoring intervals, frontend/nginx).

### 3️⃣ Database Setup

The backend **bootstraps the database automatically on startup** (waits for the
DB, migrates, seeds, and resets if `SEED_VERSION` changed). To prepare it
explicitly before running the server:

```bash
# Full bootstrap: wait-for-db → migrate → seed (idempotent)
python -m app.core.bootstrap
```

This creates all tables (User, Role, Permission, RolePermission), seeds the
**16 permissions**, the **`superuser` role**, and the **default admin user**
from `.env`. It is safe to re-run.

For manual/granular control (`--reset`, `--seed`, `--status`, …) and the full
reset workflow, see **[backend/SEEDING.md](backend/SEEDING.md)** and
[backend/DATABASE_MANAGEMENT.md](backend/DATABASE_MANAGEMENT.md).

### 4️⃣ Run the Server

```bash
# Using the provided start script
./start.sh

# Or manually with FastAPI CLI
fastapi dev app/main.py --host 0.0.0.0 --port 4000

# Or with Uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 4000 --reload
```

**Server starts at:** `http://localhost:4000`

---

## 📚 API Documentation

Interactive API docs available at:
- **Swagger UI**: `http://localhost:4000/api/docs`
- **ReDoc**: `http://localhost:4000/api/redoc`

### Core Endpoints

#### 🔐 Authentication
```
POST   /api/v1/auth/login      Login with username and password
GET    /api/v1/auth/me         Get current user info and permissions
```

#### 👥 Users
```
GET    /api/v1/users           List all users (requires: user:read)
POST   /api/v1/users           Create new user (requires: user:create)
GET    /api/v1/users/{user_id} Get user details (requires: user:read)
PUT    /api/v1/users/{user_id} Update user (requires: user:update)
DELETE /api/v1/users/{user_id} Delete user (requires: user:delete)
```

#### 🔑 Roles
```
GET    /api/v1/roles           List all roles (requires: role:read)
POST   /api/v1/roles           Create new role (requires: role:create)
GET    /api/v1/roles/{role_id} Get role details (requires: role:read)
PUT    /api/v1/roles/{role_id} Update role (requires: role:update)
DELETE /api/v1/roles/{role_id} Delete role (requires: role:delete)
```

#### 🛡️ Permissions
```
GET    /api/v1/permissions                    List all permissions (requires: permission:read)
POST   /api/v1/roles/{role_id}/permissions/{permission_id}     Assign permission to role
DELETE /api/v1/roles/{role_id}/permissions/{permission_id}     Remove permission from role
```

#### 🖥️ System & Services (IoT monitoring)
```
GET    /api/v1/system/...      System metrics (requires: sensors:read / terminal:read)
GET    /api/v1/services/...    Service status (requires: services:read)
POST   /api/v1/services/...    Service control  (requires: services:update)
```
> Real-time sensor/service streams are delivered over Socket.IO at `/ws`
> (see the WebSocket section below).

---

## 🔑 Authentication & Authorization

### Login Flow

```bash
# 1. Login
curl -X POST "http://localhost:4000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=password"

# Response includes JWT token and user info
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "Admin",
    "permissions": ["user:read", "user:create", "role:read", ...]
  }
}

# 2. Use token in Authorization header
curl -X GET "http://localhost:4000/api/v1/users" \
  -H "Authorization: Bearer eyJhbGc..."
```

### Permission Decorators

Protect endpoints with built-in decorators:

```python
from app.core.rbac import (
    require_permission,
    require_superuser,
    require_permission_or_superuser
)

@router.get("/users", dependencies=[
    Depends(require_permission("user:read"))
])
def list_users(db: Session = Depends(get_session)):
    return db.exec(select(User)).all()

@router.post("/roles", dependencies=[
    Depends(require_superuser())
])
async def create_role(role: RoleCreate, db: Session = Depends(get_session)):
    # Only superusers can access
    pass
```

---

## 🗄️ Database Schema

### Users Table
```
id (PK)          : Integer
username         : String (unique, indexed)
email            : String (unique)
first_name       : String (nullable)
last_name        : String (nullable)
hashed_password  : String (Argon2)
active           : Boolean (default: true)
role_id (FK)     : Integer → roles.id
```

### Roles Table
```
id (PK)  : Integer
name     : String (unique, indexed)
```

### Permissions Table
```
id (PK)  : Integer
name     : String (unique, indexed)
```

### RolePermission (Junction Table)
```
role_id (FK)       : Integer → roles.id
permission_id (FK) : Integer → permissions.id
```

---

## 🔄 Real-time Updates & WebSocket

### WebSocket Connection

```javascript
// Connect to WebSocket
const socket = io('http://localhost:4000/ws', {
  auth: { token: jwt_token }
});

// Listen for role updates
socket.on('msg', (data) => {
  if (data.type === 'role_created') {
    console.log('New role:', data.payload);
  }
  if (data.type === 'role_permission_added') {
    console.log('Permission assigned:', data.payload);
  }
});
```

### WebSocket Events

The backend emits real-time updates for resource changes:

| Event Type | Payload | Use Case |
|-----------|---------|----------|
| `role_created` | Role object | Notify all users of new role |
| `role_updated` | Updated role | Update role details across sessions |
| `role_deleted` | Role ID | Remove role from all connected clients |
| `role_permission_added` | Role + Permission | Update permissions in real-time |
| `role_permission_removed` | Role + Permission | Revoke permissions immediately |
| `user_created` | User object | Broadcast new user registration |
| `user_updated` | Updated user | Sync user profile changes |
| `user_deleted` | User ID | Remove user from system |

---

## 🎨 Frontend: React + Redux + Material UI

The frontend source code lives in `../client` and is built with **React + TypeScript**, **Redux Toolkit**, **Material UI**, and **Socket.IO**.

This backend repository only serves the compiled frontend assets from `app/static`.

### Frontend Features

- Type-safe SPA built with React 19 + TypeScript
- Centralized state with Redux Toolkit + React Redux
- Material UI v7 component system with theme customization
- Real-time synchronization via `socket.io-client`
- Generated API client (`openapi-typescript-codegen`) in `client/src/api`

### Frontend Source Structure (`client/`)

```bash
client/
├── src/
│   ├── api/                # Generated OpenAPI client (models/services/core)
│   ├── app/                # Store, app slice helpers, typed hooks
│   ├── components/         # dashboard/, signin/, signup/, ui/
│   ├── context/            # Dashboard sidebar context
│   ├── features/           # Feature slices (user, counter, quotes)
│   ├── hooks/              # useDialogs/, useNotifications/, useSocket/
│   ├── pages/              # dashboard/, signin/, signup/
│   ├── routers/            # AppRouter.tsx, DashboardRouter.tsx
│   ├── theme/              # AppTheme, primitives, customizations
│   └── utils/              # Test utilities and shared helpers
├── scripts/
│   └── generate-api.mjs    # OpenAPI client generation
├── vite.config.ts
└── package.json
```

### Frontend-Backend Integration

- REST API requests use `/api/...` routes exposed by FastAPI
- WebSocket communication uses `/ws` and listens for `msg` events
- Backend emits events like `role_created`, `role_updated`, `role_permission_added`, and `user_updated`
- Frontend updates Redux/RTK Query caches to reflect changes across connected clients

### Build and Serving Model

- Development runs from `client/` with Vite on port `3000`
- `npm run build` writes compiled assets directly to `../backend/app/static`
- FastAPI serves those static files in production/deployment mode

---

## 📦 Frontend Dependencies

Key packages used:

```json
{
  "react": "^19.x",
  "react-dom": "^19.x",
  "@reduxjs/toolkit": "^2.x",
  "react-redux": "^9.x",
  "@mui/material": "^7.x",
  "@mui/icons-material": "^7.x",
  "socket.io-client": "^4.x",
  "react-hook-form": "^7.x"
}
```

---

## 🎯 Frontend Development Workflow

```bash
# from repository root
cd client

# install dependencies
npm install

# start development server (http://localhost:3000)
npm run dev

# generate/update OpenAPI client
npm run api:generate

# quality checks
npm run type-check
npm run lint
npm run test

# build to backend/app/static
npm run build
```

---

## 📁 Project Structure

```
backend/
├── alembic/
│   ├── env.py
│   ├── versions/              # Migration files
│   └── reset_db.py
├── app/
│   ├── main.py               # FastAPI app initialization
│   ├── api/
│   │   └── v1/
│   │       ├── api.py        # Route aggregation
│   │       └── endpoints/
│   │           ├── auth.py   # Authentication routes
│   │           ├── users.py  # User management
│   │           ├── roles.py  # Role management
│   │           └── permission.py
│   ├── core/
│   │   ├── config.py         # Settings (single source of truth)
│   │   ├── security.py       # JWT and password utilities
│   │   ├── rbac.py           # Permission decorators
│   │   ├── bootstrap.py      # Startup: wait-for-db, migrate, seed, reset
│   │   └── seed_db.py        # Seed data (permissions, role, admin)
│   ├── db/
│   │   └── session.py        # Database connection
│   ├── models/
│   │   ├── user.py           # User & Role models
│   │   └── permission.py     # Permission models
│   ├── schemas/              # Pydantic schemas for validation
│   ├── websockets/
│   │   ├── connection_manager.py
│   │   └── endpoints.py
│   └── static/               # React app
│       ├── index.html
│       └── assets/           # React bundles
├── alembic.ini
├── requirements.txt
├── .env
├── start.sh
└── README.MD
```

---

## 🛠️ Development

### 🧪 Testing

Both the backend and the frontend ship with a unit-test setup and one worked
example each — copy the examples to add more tests.

#### Backend (pytest + httpx)

Tests live in **`backend/tests/`** and run against a throwaway **in-memory
SQLite** database, so they never touch your real Postgres. The app's
`get_session` dependency is overridden per-test in
[`backend/tests/conftest.py`](backend/tests/conftest.py), which exposes three
fixtures: `engine`, `session`, and an async `client` (an `httpx.AsyncClient`
talking to the app in-process via ASGI — no network, no running server).

Two example test files show the two patterns you'll reuse:

| File | Pattern |
|------|---------|
| [`tests/test_security.py`](backend/tests/test_security.py) | **Pure unit test** — call a function, assert the result (password hashing, JWT). No DB. Use for `core/`, `services/`, schemas. |
| [`tests/test_users_api.py`](backend/tests/test_users_api.py) | **API test** — seed the DB, mint a JWT, hit an endpoint and assert on the HTTP response. Exercises the full **auth → RBAC → DB** stack. Use for any route. |

Run them from the `backend/` directory:

```bash
cd backend
source venv/bin/activate

# Install test dependencies (pytest, pytest-asyncio, httpx) once
pip install -r requirements-dev.txt

# Run the whole suite
pytest
```

Configuration lives in [`backend/pyproject.toml`](backend/pyproject.toml)
(`asyncio_mode = "auto"` lets `async def` tests run without a marker).

> **Note:** the API tests use an async `httpx` client rather than the sync
> `TestClient` on purpose — `TestClient`'s blocking portal segfaults on Python
> 3.14. CI runs on Python 3.12 (matching the Dockerfile).

#### Frontend (Vitest + Testing Library)

Vitest is already configured in
[`client/vite.config.ts`](client/vite.config.ts) (jsdom environment, globals,
`src/setupTests.ts`). Test files live next to the code they cover as
`*.test.ts(x)`. The example
[`src/features/user/userSlice.test.ts`](client/src/features/user/userSlice.test.ts)
covers the Redux slice's reducers and selectors.

```bash
cd client
npm install

npm run test          # vitest --run (one-off, used by CI)
npx vitest            # watch mode while developing
```

### Continuous Integration (GitHub Actions)

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push to
`main`/`feature/**` and on pull requests, with the following jobs:

| Job | What it does |
|-----|--------------|
| **build backend** | install deps, `compileall`, import smoke test |
| **test backend** | `pytest` (needs *build backend*) |
| **build frontend** | `tsc -b && vite build` |
| **lint frontend** | `npm run lint` (ESLint) |
| **format:check frontend** | `npm run format:check` (Prettier) |
| **test frontend** | `npm run test` (Vitest) |
| **build backend image** | builds `backend/Dockerfile` (build-only, needs *test backend*) |
| **build frontend image** | builds `client/Dockerfile` (build-only, needs *test frontend*) |

The Docker jobs are **build-only** (no push) and cache layers via
`type=gha`; they verify the images still build without publishing anything.

### Database Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback migrations
alembic downgrade -1
```

### Reset Database

```bash
# Reset and reseed (caution: deletes all data)
python -m alembic.reset_db
python -m alembic upgrade head
```

---

## 🔐 Security Considerations

✅ **Implemented Best Practices:**
- JWT tokens for stateless authentication
- Argon2 password hashing (resistant to GPU attacks)
- Role-based access control on all sensitive endpoints
- CORS configured for specific domains
- Environment variables for secrets
- SQL injection prevention via SQLModel ORM
- HTTPS ready (configure in production)

⚠️ **Production Checklist:**
- [ ] Change `SECRET_KEY` in `.env`
- [ ] Set `allow_origins` to specific domains (not `*`)
- [ ] Enable HTTPS/SSL
- [ ] Set `ACCESS_TOKEN_EXPIRE_MINUTES` appropriately
- [ ] Configure PostgreSQL with strong password
- [ ] Enable database backups
- [ ] Monitor and log authentication failures
- [ ] Rate limit authentication endpoints

---

## 📦 Dependencies

### Core
- **FastAPI** 0.128.0 - Modern async web framework
- **SQLModel** 0.0.31 - SQLAlchemy + Pydantic integration
- **Pydantic** 2.12.5 - Data validation and serialization
- **PostgreSQL** (auto-managed) - Relational database

### Security
- **python-jose** 3.5.0 - JWT tokens
- **passlib** 1.7.4 - Password hashing
- **argon2-cffi** 25.1.0 - Argon2 algorithm
- **python-multipart** 0.0.22 - Form data parsing

### Real-time
- **python-socketio** 5.14.3 - WebSocket support

### Utilities
- **Alembic** 1.16.5 - Database migrations
- **python-dotenv** 1.2.1 - Environment management

See [requirements.txt](requirements.txt) for full list.

---

## 🐛 Troubleshooting

### "Could not validate credentials"
- Ensure JWT token is valid and not expired
- Check `SECRET_KEY` matches between login and other operations
- Verify user `active` status is `true`

### "Permission denied"
- Check user has assigned role
- Verify role has required permission
- Inspect endpoint's permission requirements

### "Role not found"
- Ensure role exists in database
- Check role ID in request matches database

### Database connection failed
- Verify PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Confirm database user has sufficient permissions

---

## 📖 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLModel Guide](https://sqlmodel.tiangolo.com/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📧 Support

For issues, questions, or suggestions, please open an issue on GitHub or contact the development team.

---

**Built with ❤️ for IoT management and accessibility**
