source venv/bin/activate
# Apply database migrations before starting the app
python -m alembic upgrade head
#uvicorn app.main:app --host 0.0.0.0 --port 4000 --reload
# dev
fastapi dev app/main.py --app app --reload --host 0.0.0.0 --port 4000