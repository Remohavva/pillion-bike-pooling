from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Ride, User, RideStatus
from app.schemas import RideCreate, RideResponse, LocationQuery
from app.auth import get_current_user
from typing import List
import math

router = APIRouter()

def calculate_distance(lat1, lng1, lat2, lng2):
    """Calculate distance between two points using Haversine formula"""
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)
    
    a = (math.sin(delta_lat / 2) ** 2 + 
         math.cos(lat1_rad) * math.cos(lat2_rad) * 
         math.sin(delta_lng / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

@router.post("/create", response_model=RideResponse)
async def create_ride(
    ride_data: RideCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new ride"""
    
    # Check if user can host rides
    if current_user.role not in ["bike_host", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only bike hosts can create rides"
        )
    
    # Create new ride
    db_ride = Ride(
        host_id=current_user.id,
        title=ride_data.title,
        description=ride_data.description,
        start_lat=ride_data.start_lat,
        start_lng=ride_data.start_lng,
        end_lat=ride_data.end_lat,
        end_lng=ride_data.end_lng,
        start_address=ride_data.start_address,
        end_address=ride_data.end_address,
        departure_time=ride_data.departure_time,
        max_passengers=ride_data.max_passengers,
        status=RideStatus.CREATED
    )
    
    db.add(db_ride)
    db.commit()
    db.refresh(db_ride)
    
    # Convert to response format
    return RideResponse(
        id=db_ride.id,
        host_id=db_ride.host_id,
        title=db_ride.title,
        description=db_ride.description,
        start_address=db_ride.start_address,
        end_address=db_ride.end_address,
        departure_time=db_ride.departure_time,
        max_passengers=db_ride.max_passengers,
        status=db_ride.status,
        start_lat=db_ride.start_lat,
        start_lng=db_ride.start_lng,
        end_lat=db_ride.end_lat,
        end_lng=db_ride.end_lng,
        created_at=db_ride.created_at
    )

@router.post("/nearby", response_model=List[RideResponse])
async def get_nearby_rides(
    location: LocationQuery,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get rides near a specific location"""
    
    # Get all available rides
    rides = db.query(Ride).filter(
        Ride.status.in_([RideStatus.CREATED, RideStatus.REQUESTED])
    ).all()
    
    # Filter by distance
    nearby_rides = []
    for ride in rides:
        distance = calculate_distance(
            location.lat, location.lng,
            ride.start_lat, ride.start_lng
        )
        
        if distance <= location.radius_km:
            nearby_rides.append(RideResponse(
                id=ride.id,
                host_id=ride.host_id,
                title=ride.title,
                description=ride.description,
                start_address=ride.start_address,
                end_address=ride.end_address,
                departure_time=ride.departure_time,
                max_passengers=ride.max_passengers,
                status=ride.status,
                start_lat=ride.start_lat,
                start_lng=ride.start_lng,
                end_lat=ride.end_lat,
                end_lng=ride.end_lng,
                created_at=ride.created_at
            ))
    
    return nearby_rides