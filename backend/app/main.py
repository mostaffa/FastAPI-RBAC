"""FastAPI application entry point with Socket.IO, REST API, and lifecycle management."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import api_router
from app.core.config import CORS_ORIGINS
from app.db.session import shutdown_db
from app.websockets.connection_manager import socket_app


# ---------------------------------------------------------------------------
# Lifespan — dispose the DB connection pool on shutdown.
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    shutdown_db()


# ---------------------------------------------------------------------------
# Application factory
# ---------------------------------------------------------------------------

app = FastAPI(
    title="RPi IoT Gateway",
    description="FastAPI + RF24 + React IoT System",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS middleware — restrict to known origins in production
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS if CORS_ORIGINS else [
        "http://rbac.localhost",
        "https://nest.mostafaothman.com",
        "https://ubuntu26:4000",
        "http://ubuntu26:3000",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Mount routes
# ---------------------------------------------------------------------------

app.include_router(api_router, prefix="/api/v1")
app.mount("/ws", socket_app)
