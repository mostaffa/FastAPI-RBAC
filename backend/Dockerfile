FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libpq-dev procps htop \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt --upgrade

COPY . .

EXPOSE 4000

# Bootstrap (wait for DB, migrate, seed, reset-on-version-change) ONCE, then serve
# under gunicorn with multiple Uvicorn workers — matching the production systemd
# unit. bootstrap runs in this shell BEFORE gunicorn forks, so migrations/seed run
# exactly once, not per worker. Socket.IO room state is per-worker, so cross-worker
# fan-out relies on the shared Redis message queue (REDIS_URL -> AsyncRedisManager);
# without it, notifications would reach only ~1/N of connected clients. Override the
# worker count with GUNICORN_WORKERS.
CMD ["sh", "-c", "python -m app.core.bootstrap && gunicorn app.main:app --workers ${GUNICORN_WORKERS:-3} --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:4000 --access-logfile -"]
