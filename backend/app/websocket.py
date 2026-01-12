from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List
import json
import asyncio
from datetime import datetime

class ConnectionManager:
    def __init__(self):
        # Store active connections by user_id
        self.active_connections: Dict[int, WebSocket] = {}
        # Store ride subscriptions (user_id -> list of ride_ids)
        self.ride_subscriptions: Dict[int, List[int]] = {}
        
    async def connect(self, websocket: WebSocket, user_id: int):
        """Accept websocket connection and store it"""
        await websocket.accept()
        self.active_connections[user_id] = websocket
        self.ride_subscriptions[user_id] = []
        
        # Send welcome message
        await self.send_personal_message({
            "type": "connection_established",
            "message": "Connected to PILLION real-time updates",
            "timestamp": datetime.utcnow().isoformat()
        }, user_id)
        
    def disconnect(self, user_id: int):
        """Remove connection when user disconnects"""
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        if user_id in self.ride_subscriptions:
            del self.ride_subscriptions[user_id]
            
    async def send_personal_message(self, message: dict, user_id: int):
        """Send message to specific user"""
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_text(json.dumps(message))
            except:
                # Connection might be closed, remove it
                self.disconnect(user_id)
                
    async def broadcast_to_ride(self, message: dict, ride_id: int):
        """Send message to all users subscribed to a ride"""
        for user_id, ride_ids in self.ride_subscriptions.items():
            if ride_id in ride_ids:
                await self.send_personal_message(message, user_id)
                
    async def subscribe_to_ride(self, user_id: int, ride_id: int):
        """Subscribe user to ride updates"""
        if user_id in self.ride_subscriptions:
            if ride_id not in self.ride_subscriptions[user_id]:
                self.ride_subscriptions[user_id].append(ride_id)
                
        await self.send_personal_message({
            "type": "ride_subscription",
            "ride_id": ride_id,
            "message": f"Subscribed to ride {ride_id} updates",
            "timestamp": datetime.utcnow().isoformat()
        }, user_id)
        
    async def unsubscribe_from_ride(self, user_id: int, ride_id: int):
        """Unsubscribe user from ride updates"""
        if user_id in self.ride_subscriptions:
            if ride_id in self.ride_subscriptions[user_id]:
                self.ride_subscriptions[user_id].remove(ride_id)
                
        await self.send_personal_message({
            "type": "ride_unsubscription",
            "ride_id": ride_id,
            "message": f"Unsubscribed from ride {ride_id} updates",
            "timestamp": datetime.utcnow().isoformat()
        }, user_id)

# Global connection manager instance
manager = ConnectionManager()

# Real-time event functions
async def notify_ride_status_change(ride_id: int, new_status: str, ride_data: dict):
    """Notify all subscribed users about ride status change"""
    message = {
        "type": "ride_status_update",
        "ride_id": ride_id,
        "new_status": new_status,
        "ride_data": ride_data,
        "timestamp": datetime.utcnow().isoformat()
    }
    await manager.broadcast_to_ride(message, ride_id)

async def notify_new_ride_request(ride_id: int, requester_data: dict):
    """Notify ride host about new join request"""
    message = {
        "type": "new_ride_request",
        "ride_id": ride_id,
        "requester": requester_data,
        "timestamp": datetime.utcnow().isoformat()
    }
    await manager.broadcast_to_ride(message, ride_id)

async def notify_ride_confirmation(ride_id: int, confirmed_riders: list):
    """Notify all participants about ride confirmation"""
    message = {
        "type": "ride_confirmed",
        "ride_id": ride_id,
        "confirmed_riders": confirmed_riders,
        "timestamp": datetime.utcnow().isoformat()
    }
    await manager.broadcast_to_ride(message, ride_id)

async def notify_location_update(ride_id: int, user_id: int, location_data: dict):
    """Notify ride participants about location updates during ongoing ride"""
    message = {
        "type": "location_update",
        "ride_id": ride_id,
        "user_id": user_id,
        "location": location_data,
        "timestamp": datetime.utcnow().isoformat()
    }
    await manager.broadcast_to_ride(message, ride_id)

async def notify_emergency_alert(ride_id: int, user_id: int, location_data: dict):
    """Notify all participants and emergency contacts about SOS"""
    message = {
        "type": "emergency_alert",
        "ride_id": ride_id,
        "user_id": user_id,
        "location": location_data,
        "message": "EMERGENCY: SOS alert triggered",
        "timestamp": datetime.utcnow().isoformat()
    }
    await manager.broadcast_to_ride(message, ride_id)
    
    # Also notify emergency services (in production, integrate with actual services)
    print(f"🚨 EMERGENCY ALERT: User {user_id} in ride {ride_id} at {location_data}")

async def handle_websocket_message(websocket: WebSocket, user_id: int, message: dict):
    """Handle incoming websocket messages from clients"""
    message_type = message.get("type")
    
    if message_type == "subscribe_ride":
        ride_id = message.get("ride_id")
        if ride_id:
            await manager.subscribe_to_ride(user_id, ride_id)
            
    elif message_type == "unsubscribe_ride":
        ride_id = message.get("ride_id")
        if ride_id:
            await manager.unsubscribe_from_ride(user_id, ride_id)
            
    elif message_type == "location_update":
        ride_id = message.get("ride_id")
        location = message.get("location")
        if ride_id and location:
            await notify_location_update(ride_id, user_id, location)
            
    elif message_type == "emergency_alert":
        ride_id = message.get("ride_id")
        location = message.get("location")
        if ride_id and location:
            await notify_emergency_alert(ride_id, user_id, location)
            
    else:
        await manager.send_personal_message({
            "type": "error",
            "message": f"Unknown message type: {message_type}",
            "timestamp": datetime.utcnow().isoformat()
        }, user_id)