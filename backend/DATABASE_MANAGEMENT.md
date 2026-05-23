# Database Reset and Seed Guide

This guide explains how to use the database management scripts for the FastAPI RBAC application.

## Available Scripts

### 1. Shell Script: `reset_and_seed.sh` (Recommended for CLI users)

A user-friendly shell wrapper for database operations with colored output and progress indicators.

#### Usage Examples

```bash
# Reset and seed the database (complete reset)
bash reset_and_seed.sh --all

# Reset database only (destructive)
bash reset_and_seed.sh --reset

# Seed database only (assumes schema exists)
bash reset_and_seed.sh --seed

# Run migrations only (no data operations)
bash reset_and_seed.sh --migrate-only

# Show help
bash reset_and_seed.sh --help

# Verbose output
bash reset_and_seed.sh --all --verbose

# Skip cache clearing
bash reset_and_seed.sh --all --skip-cache
```

#### Options

- `-h, --help`: Show help message
- `-r, --reset`: Reset the database (drop all tables)
- `-s, --seed`: Seed the database with initial data
- `-a, --all`: Reset and seed (shorthand for `-rs`)
- `-m, --migrate-only`: Run only Alembic migrations
- `--skip-cache`: Skip clearing FastAPI caches
- `-v, --verbose`: Show detailed output

### 2. Python Script: `manage_db.py` (For programmatic use)

A Python script that can be imported as a module or used from the command line.

#### Command-line Usage

```bash
# Reset and seed the database
python manage_db.py --reset --seed

# Reset with force flag (skip confirmation)
python manage_db.py --reset --force --seed

# Only seed the database
python manage_db.py --seed

# Run migrations only
python manage_db.py --migrate

# Show database status
python manage_db.py --status

# Show help
python manage_db.py --help
```

#### Options

- `-r, --reset`: Reset the database
- `-s, --seed`: Seed the database
- `-m, --migrate`: Run migrations
- `--status`: Show database status
- `-f, --force`: Skip confirmation prompts

#### Programmatic Usage (in Python code)

```python
from manage_db import (
    reset_database,
    run_migrations,
    seed_database,
    show_status,
    load_env
)

# Load environment variables
load_env()

# Reset the database
reset_database(force=True)

# Run migrations
run_migrations()

# Seed the database
seed_database()

# Show status
show_status()
```

### 3. Original Python Script: `alembic/reset_db.py`

The original reset and seed script with minimal output.

#### Usage

```bash
# Full reset and seed
python alembic/reset_db.py

# Reset and seed, skipping cache clear
python alembic/reset_db.py --skip-cache

# Reset and seed, but skip seeding
python alembic/reset_db.py --no-seed

# Show help
python alembic/reset_db.py --help
```

## Complete Workflow

### Starting Fresh

```bash
cd backend

# Activate virtual environment
source venv/bin/activate

# Reset and seed the database
bash reset_and_seed.sh --all

# Start the application
bash start.sh
```

### After Code Changes

```bash
# If only the schema changed, run migrations:
bash reset_and_seed.sh --migrate-only

# If data models changed and you want to reset everything:
bash reset_and_seed.sh --all
```

### Checking Database State

```bash
# View current database status
python manage_db.py --status
```

## What Gets Seeded?

When you run a seed operation, the following is created:

### Permissions (13 total)
- `user:create`, `user:read`, `user:update`, `user:delete`
- `role:create`, `role:read`, `role:update`, `role:delete`
- `permission:create`, `permission:read`, `permission:update`, `permission:delete`

### Roles
- `superuser`: Role with all permissions

### Users
- Default admin user with credentials from `.env`:
  - Username: `admin` (or `DEFAULT_USER` env var)
  - Password: `admin1234567` (or `DEFAULT_PASSWORD` env var)
  - Email: `admin@example.com` (or `ADMIN_EMAIL` env var)

## Database Credentials

The database connection is configured in `.env`:

```
DATABASE_URL=postgresql://rbac:sudoAptUpdate@localhost/rbac
```

The PostgreSQL user `rbac` needs the following privileges:

```sql
-- Grant schema privileges (if not already done)
GRANT ALL PRIVILEGES ON SCHEMA public TO rbac;

-- Grant default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO rbac;
```

## Troubleshooting

### Permission Denied Error

If you get `permission denied for schema public`, run:

```bash
sudo -u postgres psql -d rbac
```

Then:

```sql
GRANT ALL PRIVILEGES ON SCHEMA public TO rbac;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO rbac;
```

### Virtual Environment Not Found

Ensure you're in the `backend` directory:

```bash
cd backend
ls -la venv/bin/activate  # Should exist
```

If not, create it:

```bash
python -m venv venv
pip install -r requirements.txt
```

### Alembic Migrations Not Running

```bash
# Check migration status
python -m alembic current

# View migration history
python -m alembic history

# Manually upgrade
python -m alembic upgrade head
```

### Database Connection Failed

1. Check PostgreSQL is running:
   ```bash
   sudo systemctl status postgresql
   ```

2. Check the DATABASE_URL in `.env`

3. Verify the database exists:
   ```bash
   sudo -u postgres psql -l | grep rbac
   ```

4. If the database doesn't exist, create it:
   ```bash
   sudo -u postgres createdb rbac
   ```

## Integration with CI/CD

For automated deployment, use:

```bash
#!/bin/bash
set -e

cd backend
source venv/bin/activate

# Reset and seed (can also add --force to skip prompts)
python manage_db.py --reset --seed --force

# Start the application
bash start.sh
```

## Environment Variables

The scripts use the following environment variables from `.env`:

- `DATABASE_URL`: PostgreSQL connection string
- `DEFAULT_USER`: Default admin username (default: "superuser")
- `DEFAULT_PASSWORD`: Default admin password
- `ADMIN_EMAIL`: Default admin email address
- `FASTAPI_CACHE_CLEAR_TARGETS`: Comma-separated list of cache targets to clear

Example `.env`:

```env
DATABASE_URL=postgresql://rbac:sudoAptUpdate@localhost/rbac
SQLALCHEMY_TRACK_MODIFICATIONS=False
ACCESS_TOKEN_EXPIRE_MINUTES=60
ALGORITHM=HS256
SECRET_KEY=Access_KeyForPROJECT
DEFAULT_USER=admin
DEFAULT_PASSWORD=admin1234567
ADMIN_EMAIL=admin@example.com
```

## Performance Considerations

- **Full reset**: ~5-10 seconds depending on database size
- **Seed only**: ~2-3 seconds
- **Migrations only**: ~1-2 seconds

For large datasets, you may want to:
1. Create custom seed scripts for additional data
2. Extend `app/core/seed_db.py` with more seed functions
3. Create separate migration files for data population

## Best Practices

1. **Always backup production databases** before running reset scripts
2. **Use `--force` flag carefully** - it skips confirmation prompts
3. **Check `--status`** before and after operations to verify
4. **Use `--verbose`** if operations fail to see detailed logs
5. **Keep `.env` secure** - it contains sensitive credentials
6. **Review migration files** before running `--migrate` in production

## Further Reading

- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [SQLModel Documentation](https://sqlmodel.tiangolo.com/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
