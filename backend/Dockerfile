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

# Bootstrap (wait for DB, migrate, seed, reset-on-version-change) then serve.
CMD ["sh", "-c", "python -m app.core.bootstrap && uvicorn app.main:app --host 0.0.0.0 --port 4000 --reload"]
