from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
from app.models import UserRole, RideStatus

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    phone: str
    full_name: str
    role: UserRole = UserRole.RIDER

class UserCreate(UserBase):
    supabase_id: str

class UserResponse(UserBase):
    id: int
    supabase_id: str
    is_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Ride schemas
class RideBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_address: str
    end_address: str
    departure_time: datetime
    max_passengers: int = 1

class RideCreate(RideBase):
    start_lat: float
    start_lng: float
    end_lat: float
    end_lng: float

class RideResponse(RideBase):
    id: int
    host_id: int
    status: RideStatus
    start_lat: float
    start_lng: float
    end_lat: float
    end_lng: float
    created_at: datetime
    
    class Config:
        from_attributes = True

# Location schema for nearby rides
class LocationQuery(BaseModel):
    lat: float
    lng: float
    radius_km: float = 5.0

# Helmet check schemas
class HelmetCheckCreate(BaseModel):
    ride_id: int
    image_url: str

class HelmetCheckResponse(BaseModel):
    id: int
    user_id: int
    ride_id: int
    image_url: str
    is_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True