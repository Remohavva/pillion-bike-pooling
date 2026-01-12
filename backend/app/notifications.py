from typing import List, Dict, Optional
import json
import asyncio
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# In production, use services like Firebase Cloud Messaging (FCM) or OneSignal
# For now, we'll create a notification system that can be easily integrated

class NotificationService:
    def __init__(self):
        self.notification_queue = []
        self.user_tokens: Dict[int, str] = {}  # user_id -> FCM token
        
    def register_device_token(self, user_id: int, token: str):
        """Register FCM token for push notifications"""
        self.user_tokens[user_id] = token
        
    def unregister_device_token(self, user_id: int):
        """Remove FCM token when user logs out"""
        if user_id in self.user_tokens:
            del self.user_tokens[user_id]
    
    async def send_push_notification(
        self, 
        user_ids: List[int], 
        title: str, 
        body: str, 
        data: Optional[Dict] = None
    ):
        """Send push notification to specific users"""
        
        notification = {
            "title": title,
            "body": body,
            "data": data or {},
            "timestamp": datetime.utcnow().isoformat(),
            "user_ids": user_ids
        }
        
        # Add to queue for processing
        self.notification_queue.append(notification)
        
        # In production, integrate with FCM:
        # for user_id in user_ids:
        #     if user_id in self.user_tokens:
        #         token = self.user_tokens[user_id]
        #         await self._send_fcm_notification(token, title, body, data)
        
        print(f"📱 Push notification queued: {title} -> {len(user_ids)} users")
        return {"success": True, "queued": len(user_ids)}
    
    async def send_ride_notification(self, ride_id: int, user_ids: List[int], notification_type: str, ride_data: Dict):
        """Send ride-specific notifications"""
        
        notifications = {
            "ride_created": {
                "title": "New Ride Available",
                "body": f"A new ride '{ride_data.get('title', 'Untitled')}' is available near you!"
            },
            "ride_request": {
                "title": "New Ride Request",
                "body": f"Someone wants to join your ride '{ride_data.get('title', 'Untitled')}'"
            },
            "ride_confirmed": {
                "title": "Ride Confirmed!",
                "body": f"Your ride '{ride_data.get('title', 'Untitled')}' has been confirmed"
            },
            "ride_started": {
                "title": "Ride Started",
                "body": f"Your ride '{ride_data.get('title', 'Untitled')}' has started. Safe journey!"
            },
            "ride_completed": {
                "title": "Ride Completed",
                "body": f"Your ride '{ride_data.get('title', 'Untitled')}' is complete. Please rate your experience."
            },
            "helmet_required": {
                "title": "Helmet Verification Required",
                "body": "Please complete helmet verification before starting your ride"
            },
            "emergency_alert": {
                "title": "🚨 EMERGENCY ALERT",
                "body": "An emergency SOS has been triggered in your ride"
            }
        }
        
        if notification_type in notifications:
            notif = notifications[notification_type]
            await self.send_push_notification(
                user_ids,
                notif["title"],
                notif["body"],
                {
                    "ride_id": ride_id,
                    "type": notification_type,
                    **ride_data
                }
            )
    
    async def send_safety_alert(self, user_ids: List[int], location: Dict, message: str):
        """Send emergency/safety notifications"""
        await self.send_push_notification(
            user_ids,
            "🚨 SAFETY ALERT",
            message,
            {
                "type": "emergency",
                "location": location,
                "priority": "high"
            }
        )
    
    def get_notification_stats(self):
        """Get notification service statistics"""
        return {
            "registered_devices": len(self.user_tokens),
            "queued_notifications": len(self.notification_queue),
            "service_status": "active"
        }

# Global notification service instance
notification_service = NotificationService()

# Convenience functions for common notifications
async def notify_ride_created(ride_id: int, nearby_user_ids: List[int], ride_data: Dict):
    """Notify nearby users about new ride"""
    await notification_service.send_ride_notification(
        ride_id, nearby_user_ids, "ride_created", ride_data
    )

async def notify_ride_request(ride_id: int, host_user_id: int, ride_data: Dict):
    """Notify host about new ride request"""
    await notification_service.send_ride_notification(
        ride_id, [host_user_id], "ride_request", ride_data
    )

async def notify_ride_confirmed(ride_id: int, participant_user_ids: List[int], ride_data: Dict):
    """Notify participants about ride confirmation"""
    await notification_service.send_ride_notification(
        ride_id, participant_user_ids, "ride_confirmed", ride_data
    )

async def notify_ride_started(ride_id: int, all_user_ids: List[int], ride_data: Dict):
    """Notify all participants that ride has started"""
    await notification_service.send_ride_notification(
        ride_id, all_user_ids, "ride_started", ride_data
    )

async def notify_ride_completed(ride_id: int, all_user_ids: List[int], ride_data: Dict):
    """Notify all participants that ride is completed"""
    await notification_service.send_ride_notification(
        ride_id, all_user_ids, "ride_completed", ride_data
    )

async def notify_helmet_required(ride_id: int, user_ids: List[int], ride_data: Dict):
    """Notify users to complete helmet verification"""
    await notification_service.send_ride_notification(
        ride_id, user_ids, "helmet_required", ride_data
    )

async def notify_emergency_alert(ride_id: int, all_user_ids: List[int], location: Dict):
    """Send emergency alert to all ride participants"""
    await notification_service.send_safety_alert(
        all_user_ids,
        location,
        "Emergency SOS triggered in your ride. Please check on all participants."
    )