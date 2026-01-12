from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.websocket import manager, handle_websocket_message
from jose import JWTError, jwt
import json
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

SUPABASE_JWT_SECRET = os.getenv("JWT_SECRET")

async def get_user_from_token(token: str, db: Session):
    """Extract user from JWT token for websocket authentication"""
    try:
        payload = jwt.decode(
            token, 
            SUPABASE_JWT_SECRET, 
            algorithms=["HS256"],
            audience="authenticated"
        )
        
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
            
        user = db.query(User).filter(User.supabase_id == user_id).first()
        return user
        
    except JWTError:
        return None

@router.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str, db: Session = Depends(get_db)):
    """WebSocket endpoint for real-time updates"""
    
    # Authenticate user from token
    user = await get_user_from_token(token, db)
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    # Connect user to websocket
    await manager.connect(websocket, user.id)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
                await handle_websocket_message(websocket, user.id, message)
            except json.JSONDecodeError:
                await manager.send_personal_message({
                    "type": "error",
                    "message": "Invalid JSON format"
                }, user.id)
                
    except WebSocketDisconnect:
        manager.disconnect(user.id)
        print(f"User {user.id} disconnected from WebSocket")

@router.get("/ws/status")
async def websocket_status():
    """Get WebSocket connection status"""
    return {
        "active_connections": len(manager.active_connections),
        "total_subscriptions": sum(len(subs) for subs in manager.ride_subscriptions.values()),
        "status": "WebSocket server running"
    }