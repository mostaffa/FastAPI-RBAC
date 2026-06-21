# 🌱 Database Seeding & First-Run Bootstrap

This document explains how the FastAPI RBAC backend gets its database into a
ready-to-use state: how the **automatic bootstrap** works on startup, what data
is seeded, how the **`SEED_VERSION` reset** mechanism behaves, and how to run
seeding manually.

> **TL;DR** — On every backend start, `app/core/bootstrap.py` waits for the DB,
> runs migrations, and seeds the default permissions, the `superuser` role, and
> the default admin user. Seeding is **idempotent** (safe to run repeatedly).
> Bump **`SEED_VERSION`** in `.env` to force a full **drop → re-migrate →
> reseed** on the next start.

---

## 1. How seeding runs automatically

The Docker image's start command is:

```dockerfile
CMD ["sh", "-c", "python -m app.core.bootstrap && uvicorn app.main:app --host 0.0.0.0 --port 4000 --reload"]
```

So `python -m app.core.bootstrap` runs **before** the API server every time the
`api` container starts. Its responsibilities:

```
wait_for_db()        → retry until PostgreSQL accepts connections (up to ~60s)
ensure app_meta      → create the small bookkeeping table if missing
compare SEED_VERSION → stored (in DB) vs current (from .env)
  └─ if changed      → reset_schema()  (drop all tables + alembic_version)
run_migrations()     → alembic upgrade head  (creates schema + base seed)
seed()               → idempotent seed of the full permission set + admin
record SEED_VERSION  → store current version in app_meta
```

You don't need to run anything by hand — `docker compose up` is enough.

---

## 2. The three behaviors

Bootstrap decides what to do by comparing the `SEED_VERSION` value in your
environment against the one recorded in the database (`app_meta.seed_version`):

| Situation | `stored` vs `current` | What happens | Data loss? |
|-----------|-----------------------|--------------|:----------:|
| **Fresh database** | `stored = None` | migrate + seed, then record version | — |
| **Normal restart** | `stored == current` | migrate (no-op) + seed (idempotent) | **No** |
| **Version bumped** | `stored != current` | **drop everything** → migrate from scratch → reseed | **Yes** ⚠️ |

```
            ┌─────────────────────────┐
   start ──▶│  read app_meta.version  │
            └────────────┬────────────┘
                         │
        stored == current│        stored != current
          (or None)      │              │
                         ▼              ▼
              ┌──────────────┐   ┌───────────────────────┐
              │ migrate+seed │   │ DROP ALL → migrate →   │
              │ (idempotent) │   │ reseed (clean reset)   │
              └──────┬───────┘   └───────────┬───────────┘
                     └──────────┬────────────┘
                                ▼
                     record current version
```

---

## 3. `SEED_VERSION` — forcing a reset

`SEED_VERSION` lives in the project-root **`.env`** (the single source of truth
for all environments):

```env
# Bump SEED_VERSION to force a full DB reset (drop + re-migrate + reseed) on the
# next backend start. WARNING: changing this WIPES all data in the database.
SEED_VERSION=1
```

**When to bump it:** you changed seed data or the schema and want every
environment to start clean on next deploy — e.g. `1` → `2`.

> ⚠️ **Bumping `SEED_VERSION` destroys all data** (users, roles, custom
> permissions). It is intended for development and controlled redeploys, not for
> routine restarts. For production, take a backup first.

After a bump, the next `docker compose up` (or container restart) performs the
reset automatically; subsequent restarts at the same version are no-ops.

---

## 4. What gets seeded

### Permissions (16)

Permissions follow a `resource:action` convention. The authoritative list lives
in [`app/core/seed_db.py`](app/core/seed_db.py):

| Group | Permissions |
|-------|-------------|
| Users | `user:create`, `user:read`, `user:update`, `user:delete` |
| Roles | `role:create`, `role:read`, `role:update`, `role:delete` |
| Permissions | `permission:create`, `permission:read`, `permission:update`, `permission:delete` |
| Sensors / Terminal | `sensors:read`, `terminal:read` |
| Services | `services:read`, `services:update` |

### Role

- **`superuser`** — granted **all 16 permissions**. This is the only role
  created by default; create additional roles (e.g. `admin`, `viewer`) at
  runtime via the Roles API.

### Default admin user

Created from environment variables (root `.env`):

| Field | Env var | Default |
|-------|---------|---------|
| Username | `DEFAULT_USER` | `admin` |
| Password | `DEFAULT_PASSWORD` | `admin1234567` |
| Email | `ADMIN_EMAIL` | `admin@example.com` |

The user is assigned the `superuser` role, and the password is hashed with
**Argon2** before storage.

---

## 5. Where seeding lives

| File / object | Role |
|---------------|------|
| `app/core/bootstrap.py` | Startup orchestrator: wait-for-DB, version check, migrate, seed, reset |
| `app/core/seed_db.py` | Authoritative seed functions + the `PERMISSIONS` list (idempotent) |
| `alembic/versions/*` | Schema migrations; `…_0002_seed_data.py` also seeds a base set, `…_0003/0004` add the `services:*` permissions |
| `app_meta` table | Tiny `(key, value)` bookkeeping table holding `seed_version`; lives **outside** the SQLModel metadata so a reset never erases it |

### Migrations vs. `seed_db.py`

- **Alembic migrations** create the schema and seed a base permission set.
- **`seed_db.py`** runs *after* migrations and guarantees the **full** set
  (including `terminal:read`, which no migration adds) plus all role→permission
  links and the admin user.
- Both are **idempotent** — every insert is guarded by an existence check, so
  re-running never duplicates rows.

---

## 6. Running seeding manually

### Inside Docker (recommended)

```bash
# Normal path — seeding happens automatically on container start:
docker compose up -d --build

# Re-run the bootstrap by hand (e.g. after editing seed_db.py):
docker compose exec api python -m app.core.bootstrap

# Force a one-off reset without bumping .env (temporary env override):
docker compose exec -e SEED_VERSION=2 api python -m app.core.bootstrap

# Nuke everything including the Postgres volume, then rebuild fresh:
docker compose down -v && docker compose up -d --build
```

### Local (no Docker)

With a virtualenv active and PostgreSQL reachable per your `.env`:

```bash
cd backend

# Full bootstrap (wait-for-db → migrate → seed → version check):
python -m app.core.bootstrap

# Or use the management CLI for granular control:
python manage_db.py --migrate          # migrations only
python manage_db.py --seed             # seed only (schema must exist)
python manage_db.py --reset --seed     # drop + migrate + seed (prompts)
python manage_db.py --reset --force --seed   # same, no prompt
python manage_db.py --status           # show counts

# Or the lower-level reset script:
python alembic/reset_db.py             # reset + migrate + seed
python alembic/reset_db.py --no-seed   # reset + migrate only
```

> See [DATABASE_MANAGEMENT.md](DATABASE_MANAGEMENT.md) for the full reference on
> the manual `manage_db.py` / `reset_db.py` / `reset_and_seed.sh` tools.

---

## 7. Customizing the seed data

1. **Add a permission** — append it to `PERMISSIONS` in
   [`app/core/seed_db.py`](app/core/seed_db.py). `seed_superuser_role()` links
   any new permission to the `superuser` role automatically on next seed.
2. **Add seed entities** (extra roles, demo users, …) — add an idempotent
   `seed_*()` function in `seed_db.py` and call it from `bootstrap.seed()`.
3. **Apply everywhere** — bump `SEED_VERSION` so existing environments reset and
   pick up the change, *or* just re-run `python -m app.core.bootstrap` (new rows
   are added without a reset, since seeding is idempotent).

> For schema changes, generate a migration instead:
> `alembic revision --autogenerate -m "describe change"`.

---

## 8. Troubleshooting

| Symptom | Likely cause & fix |
|---------|--------------------|
| `database not reachable after N attempts` | Postgres isn't up/healthy. In Docker, `api` waits for the `postgres` healthcheck; check `docker compose logs postgres`. |
| App connects but **auth fails** after changing `POSTGRES_PASSWORD` | Postgres only initializes credentials on an **empty** volume. Run `docker compose down -v` once to re-init. |
| Seeding seems to do nothing | Expected when `stored == current` and data already exists — seeding is idempotent. Check counts with `python manage_db.py --status`. |
| Want a clean DB but data persists | Bump `SEED_VERSION`, or `docker compose down -v`. |
| Permissions count is 15, not 16 | `terminal:read` is added by `seed_db.py`, not by migrations — ensure bootstrap's `seed()` step ran (it does automatically). |
| Migrations and app disagree on DB host/creds | Both resolve the URL from `app/core/config.py` (single source); verify your `.env` / compose `POSTGRES_*`. |

### Verify what was seeded

```bash
# Via the management CLI
docker compose exec api python manage_db.py --status

# Or query Postgres directly
docker compose exec postgres psql -U rbac -d rbac -c \
  "SELECT (SELECT count(*) FROM permission) AS permissions,
          (SELECT count(*) FROM role)       AS roles,
          (SELECT count(*) FROM \"user\")     AS users,
          (SELECT value FROM app_meta WHERE key='seed_version') AS seed_version;"
```

Expected on a fresh seed: **16 permissions, 1 role (`superuser`), 1 user
(`admin`), seed_version = 1**.

---

## 9. Related docs

- [README.MD](../README.MD) — project overview, Docker, API reference
- [DATABASE_MANAGEMENT.md](DATABASE_MANAGEMENT.md) — manual reset/seed tooling
- [Alembic docs](https://alembic.sqlalchemy.org/) · [SQLModel docs](https://sqlmodel.tiangolo.com/)
