#!/usr/bin/env python3
"""
Database Reset, Migration, and Seed Management Script

This script provides utilities to reset, migrate, and seed the FastAPI RBAC database.
It can be used standalone or imported as a module.

Usage:
    # Reset and seed the database
    python manage_db.py --reset --seed

    # Only run migrations
    python manage_db.py --migrate

    # Show database status
    python manage_db.py --status

    # Show help
    python manage_db.py --help
"""

from __future__ import annotations

import argparse
import sys
import subprocess
from pathlib import Path
from typing import Optional

# Ensure the backend package is importable when running as a script.
BACKEND_ROOT = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_ROOT.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


class Colors:
    """ANSI color codes for terminal output."""

    BLUE = "\033[0;34m"
    GREEN = "\033[0;32m"
    YELLOW = "\033[1;33m"
    RED = "\033[0;31m"
    END = "\033[0m"


def print_info(message: str) -> None:
    """Print info message."""
    print(f"{Colors.BLUE}[INFO]{Colors.END} {message}")


def print_success(message: str) -> None:
    """Print success message."""
    print(f"{Colors.GREEN}[SUCCESS]{Colors.END} {message}")


def print_warning(message: str) -> None:
    """Print warning message."""
    print(f"{Colors.YELLOW}[WARNING]{Colors.END} {message}")


def print_error(message: str) -> None:
    """Print error message."""
    print(f"{Colors.RED}[ERROR]{Colors.END} {message}")


def ensure_models_imported() -> None:
    """Import all models to ensure they're registered with SQLModel."""
    try:
        import app.models  # noqa: F401
        print_info("Models imported successfully")
    except ImportError as e:
        print_error(f"Failed to import models: {e}")
        raise


def get_engine():
    """Get the SQLAlchemy engine instance."""
    from app.db.session import engine

    return engine


def load_env() -> None:
    """Load environment variables from .env file."""
    from dotenv import load_dotenv

    env_path = PROJECT_ROOT / ".env"
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
        print_info(f"Loaded environment from {env_path}")
    else:
        print_warning(f"No .env file found at {env_path}")


def reset_database(force: bool = False) -> bool:
    """Drop all tables and the Alembic version table to start fresh.

    Args:
        force: If True, skip confirmation prompt

    Returns:
        True if successful, False otherwise
    """
    if not force:
        response = input(
            f"{Colors.YELLOW}WARNING: This will delete ALL data in the database. "
            f"Continue? (yes/no): {Colors.END}"
        )
        if response.lower() != "yes":
            print_info("Reset cancelled")
            return False

    try:
        from sqlalchemy import text

        print_info("Dropping all tables...")
        ensure_models_imported()
        engine = get_engine()

        # Drop all application tables
        from sqlmodel import SQLModel

        SQLModel.metadata.drop_all(engine)

        # Also drop the alembic_version table so migrations run fresh
        with engine.connect() as conn:
            conn.execute(text("DROP TABLE IF EXISTS alembic_version"))
            conn.commit()

        print_success("Database reset complete")
        return True

    except Exception as e:
        print_error(f"Failed to reset database: {e}")
        return False


def run_migrations() -> bool:
    """Run Alembic migrations to create the schema.

    Returns:
        True if successful, False otherwise
    """
    try:
        print_info("Running Alembic migrations...")
        result = subprocess.run(
            [sys.executable, "-m", "alembic", "upgrade", "head"],
            cwd=BACKEND_ROOT,
            capture_output=True,
            text=True,
        )

        if result.returncode != 0:
            print_error("Alembic migration failed!")
            print_error(result.stderr)
            return False

        # Print output for user visibility
        if result.stdout:
            for line in result.stdout.strip().split("\n"):
                if "upgrade" in line.lower() or "running" in line.lower():
                    print_info(line)

        print_success("Alembic migrations applied successfully")
        return True

    except Exception as e:
        print_error(f"Failed to run migrations: {e}")
        return False


def seed_database() -> bool:
    """Seed the database with initial permissions, roles, and admin user.

    Returns:
        True if successful, False otherwise
    """
    try:
        from app.core.seed_db import (
            seed_default_superuser,
            seed_permissions,
            seed_superuser_role,
        )

        print_info("Seeding database...")

        print_info("  - Creating permissions...")
        seed_permissions()

        print_info("  - Creating superuser role...")
        seed_superuser_role()

        print_info("  - Creating default admin user...")
        seed_default_superuser()

        # Verify seeding
        permission_count = verify_permissions_seeded()
        print_success(f"Database seeded successfully ({permission_count} permissions)")

        return True

    except Exception as e:
        print_error(f"Failed to seed database: {e}")
        return False


def verify_permissions_seeded() -> int:
    """Check the number of permissions in the database.

    Returns:
        Number of permissions found
    """
    try:
        from sqlmodel import Session, select
        from app.models.permission import Permission

        engine = get_engine()
        with Session(engine) as db:
            permissions = db.exec(select(Permission)).all()
            return len(permissions)

    except Exception as e:
        print_warning(f"Could not verify permissions: {e}")
        return 0


def show_status() -> None:
    """Show the current database status."""
    try:
        from sqlmodel import Session, select
        from app.models.permission import Permission
        from app.models.user import Role, User

        engine = get_engine()

        print_info("Database Status:")

        with Session(engine) as db:
            perm_count = len(db.exec(select(Permission)).all())
            role_count = len(db.exec(select(Role)).all())
            user_count = len(db.exec(select(User)).all())

            print(f"  - Permissions: {perm_count}")
            print(f"  - Roles: {role_count}")
            print(f"  - Users: {user_count}")

    except Exception as e:
        print_warning(f"Could not retrieve database status: {e}")


def parse_args() -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description="Manage FastAPI RBAC Database - Reset, Migrate, and Seed",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Reset and seed the database
  python manage_db.py --reset --seed

  # Only seed the database (assumes schema exists)
  python manage_db.py --seed

  # Run only migrations
  python manage_db.py --migrate

  # Show database status
  python manage_db.py --status

  # Reset without confirmation prompt
  python manage_db.py --reset --force
        """,
    )

    parser.add_argument(
        "-r",
        "--reset",
        action="store_true",
        help="Reset the database (drop all tables)",
    )

    parser.add_argument(
        "-s",
        "--seed",
        action="store_true",
        help="Seed the database with initial data",
    )

    parser.add_argument(
        "-m",
        "--migrate",
        action="store_true",
        help="Run Alembic migrations only",
    )

    parser.add_argument(
        "--status",
        action="store_true",
        help="Show current database status",
    )

    parser.add_argument(
        "-f",
        "--force",
        action="store_true",
        help="Skip confirmation prompts",
    )

    return parser.parse_args()


def main() -> int:
    """Main entry point."""
    args = parse_args()
    load_env()

    # Show status if requested
    if args.status:
        show_status()
        return 0

    # If no action specified, show error
    if not args.reset and not args.seed and not args.migrate:
        print_warning("No action specified. Use --help for usage information.")
        return 1

    # Reset database if requested
    if args.reset:
        if not reset_database(force=args.force):
            return 1

    # Run migrations
    if args.reset or args.migrate or args.seed:
        if not run_migrations():
            return 1

    # Seed database if requested
    if args.seed:
        if not seed_database():
            return 1

    print()
    print_success("Database operation completed successfully!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
