# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from app.api.v1.api import api_router
from app.websockets.connection_manager import socket_app
# from app.models.user import User, Role
# import app.models

app = FastAPI(
    title="RPi IoT Gateway",
    description="FastAPI + RF24 + React IoT System",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# 1. Setup CORS so your React app (usually on port 5173) can talk to your API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*", "https://nest.mostafaothman.com"],  # For production, replace with specific IP of your Pi
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Include REST API routes
app.include_router(api_router, prefix="/api/v1")

# 3. Mount Socket.IO
app.mount("/ws", socket_app)

# 4. Mount static files (React assets)
app.mount("/assets", StaticFiles(directory="app/static/assets"), name="assets")

@app.get("/{path_param:path}")
async def serve_react(path_param: str):
    """
    Serve the React app for all unmatched routes (SPA catch-all)
    React Router will handle the routing on the client side
    """
    return FileResponse("app/static/index.html")
