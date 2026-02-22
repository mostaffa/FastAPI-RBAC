from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.websockets.connection_manager import manager

router = APIRouter()

@router.websocket("/")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    print("\u001b[32mWebSocket connected\u001b[0m")
    try:
        while True:
            # Wait for any message from React (or just keep connection open)
            # data = await websocket.receive_text()
            pass
            # Echo back or handle logic
    except WebSocketDisconnect:
        await manager.disconnect(websocket)

@router.get("/join")
async def join_websocket():
    print("\u001b[32mWebSocket join endpoint called\u001b[0m")
    return {"message": "Use WebSocket connection to join."}

