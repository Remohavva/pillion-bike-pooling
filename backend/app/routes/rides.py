from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from geoalchemy2.functions import ST_DWithin, ST_GeogFromText, ST_X, ST_Y
from app.database import get_db
from app.models import Ride, User, RideStatus
from app.schemas import RideCreate, RideResponse, LocationQuery
from app.auth import get_current_user
from typing import List

router = APIRouter()

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
    
    # Create PostGIS POINT geometries
    start_point = f"POINT({ride_data.start_lng} {ride_data.start_lat})"
    end_point = f"POINT({ride_data.end_lng} {ride_data.end_lat})"
    
    # Create new ride
    db_ride = Ride(
        host_id=current_user.id,
        title=ride_data.title,
        description=ride_data.description,
        start_location=func.ST_GeogFromText(start_point),
        end_location=func.ST_GeogFromText(end_point),
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
        start_lat=ride_data.start_lat,
        start_lng=ride_data.start_lng,
        end_lat=ride_data.end_lat,
        end_lng=ride_data.end_lng,
        created_at=db_ride.created_at
    )

@router.post("/nearby", response_model=List[RideResponse])
async def get_nearby_rides(
    location: LocationQuery,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get rides near a specific location using PostGIS"""
    
    # Create user location point
    user_point = f"POINT({location.lng} {location.lat})"
    
    # Query rides within radius using PostGIS
    # ST_DWithin with geography type uses meters
    radius_meters = location.radius_km * 1000
    
    rides = db.query(Ride).filter(
        Ride.status.in_([RideStatus.CREATED, RideStatus.REQUESTED]),
        ST_DWithin(
            Ride.start_location,
            func.ST_GeogFromText(user_point),
            radius_meters
        )
    ).all()
    
    # Convert to response format
    ride_responses = []
    for ride in rides:
        # Extract coordinates from PostGIS geometry
        start_coords = db.query(
            ST_X(ride.start_location).label('lng'),
            ST_Y(ride.start_location).label('lat')
        ).first()
        
        end_coords = db.query(
            ST_X(ride.end_location).label('lng'),
            ST_Y(ride.end_location).label('lat')
        ).first()
        
        ride_responses.append(RideResponse(
            id=ride.id,
            host_id=ride.host_id,
            title=ride.title,
            description=ride.description,
            start_address=ride.start_address,
            end_address=ride.end_address,
            departure_time=ride.departure_time,
            max_passengers=ride.max_passengers,
            status=ride.status,
            start_lat=start_coords.lat,
            start_lng=start_coords.lng,
            end_lat=end_coords.lat,
            end_lng=end_coords.lng,
            created_at=ride.created_at
        ))
    
    return ride_responses