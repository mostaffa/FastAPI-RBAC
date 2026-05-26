import os
from dotenv import load_dotenv
from pathlib import Path
from sqlmodel import Session, create_engine

# Load environment variables from .env file
env_path = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(dotenv_path=env_path)
default_database_url = "postgresql://rbac:123456789@localhost/rbac"

database_url_from_env = os.getenv("DATABASE_URL")
postgres_user = os.getenv("POSTGRES_USER")
postgres_password = os.getenv("POSTGRES_PASSWORD")
postgres_db = os.getenv("POSTGRES_DB")
postgres_host = os.getenv("POSTGRES_HOST")
postgres_port = os.getenv("POSTGRES_PORT", "5432")

# In containers, prefer explicit POSTGRES_* values when host is provided.
if postgres_host and postgres_user and postgres_password and postgres_db:
    DATABASE_URL = f"postgresql://{postgres_user}:{postgres_password}@{postgres_host}:{postgres_port}/{postgres_db}"
elif database_url_from_env and "${" not in database_url_from_env:
    DATABASE_URL = database_url_from_env
elif postgres_user and postgres_password and postgres_db:
    DATABASE_URL = f"postgresql://{postgres_user}:{postgres_password}@localhost:{postgres_port}/{postgres_db}"
else:
    DATABASE_URL = default_database_url

print(f"Using database URL: {DATABASE_URL}")

"""Create the database engine and session generator."""
engine = create_engine(DATABASE_URL, echo=True)

def get_session():
    with Session(engine) as session:
        yield session