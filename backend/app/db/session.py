import os
from dotenv import load_dotenv
from pathlib import Path
from sqlmodel import Session, create_engine

# Load environment variables from .env file
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://rf24:password@localhost/rf24")
print(f"Using database URL: {DATABASE_URL}")

"""Create the database engine and session generator."""
engine = create_engine(DATABASE_URL, echo=True)

def get_session():
    with Session(engine) as session:
        yield session