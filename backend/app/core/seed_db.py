import os
from app.models.user import Role, User
from dotenv import load_dotenv
from sqlmodel import Session, select
from app.models.permission import Permission
from app.db.session import engine
from app.core.security import hash_password

# Load environment variables from .env file
env_path = os.path.join(os.path.dirname(__file__), "../../.env")
load_dotenv(dotenv_path=env_path)

PERMISSIONS = [
    # Users
    "user:create",
    "user:read",
    "user:update",
    "user:delete",
    # Roles
    "role:create",
    "role:read",
    "role:update",
    "role:delete",
    # Permissions
    "permission:create",
    "permission:read",
    "permission:update",
    "permission:delete",
]

def seed_permissions():
    with Session(engine) as db:
        for perm_name in PERMISSIONS:
            exists = db.exec(
                select(Permission).where(Permission.name == perm_name)
            ).first()

            if not exists:
                db.add(Permission(name=perm_name))

        db.commit()

# Create superuser role with all permissions (if not exists)
def seed_superuser_role():
    from app.models.user import Role
    from app.models.permission import RolePermission

    with Session(engine) as db:
        superuser_role = db.exec(
            select(Role).where(Role.name == "superuser")
        ).first()

        if not superuser_role:
            superuser_role = Role(name="superuser")
            db.add(superuser_role)
            db.commit()
            db.refresh(superuser_role)

        # Assign all permissions to superuser role
        for perm_name in PERMISSIONS:
            permission = db.exec(
                select(Permission).where(Permission.name == perm_name)
            ).first()

            if permission:
                link_exists = db.exec(
                    select(RolePermission).where(
                        (RolePermission.role_id == superuser_role.id) &
                        (RolePermission.permission_id == permission.id)
                    )
                ).first()

                if not link_exists:
                    db.add(RolePermission(role_id=superuser_role.id, permission_id=permission.id))

        db.commit()

# insert default superuser (if not exists)
def seed_default_superuser():
    default_username = os.getenv("DEFAULT_USER", "superuser")
    default_password = os.getenv("DEFAULT_PASSWORD", "superuser1234")
    default_email = os.getenv("ADMIN_EMAIL", "admin@example.com")
    print(f"\u001b[32mSeeding default superuser: {default_username} / {default_password}\u001b[0m")
    with Session(engine) as db:
        existing_user = db.exec(
            select(User).where(User.username == default_username)
        ).first()

        if not existing_user:
            admin_role = db.exec(
                select(Role).where(Role.name == "superuser")
            ).first()

            hashed_password = hash_password(default_password)

            admin_user = User(
                username=default_username,
                email=default_email,
                hashed_password=hashed_password,
                role_id=admin_role.id if admin_role else None
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
