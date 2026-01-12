from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Ride, User, RideStatus, RideParticipant
from app.schemas import RideCreate, RideResponse, LocationQuery
from app.auth import get_current_user
from app.websocket import notify_ride_status_change, notify_new_ride_request, notify_ride_confirmation
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
    
    # Notify about new ride creation
    ride_response = RideResponse(
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
    
    # Real-time notification
    await notify_ride_status_change(
        db_ride.id, 
        db_ride.status.value, 
        ride_response.dict()
    )
    
    return ride_response

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

@router.post("/join/{ride_id}")
async def join_ride(
    ride_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Request to join a ride"""
    
    # Check if ride exists
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if not ride:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ride not found"
        )
    
    # Check if ride is available for joining
    if ride.status not in [RideStatus.CREATED, RideStatus.REQUESTED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ride is not available for joining"
        )
    
    # Check if user is not the host
    if ride.host_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot join your own ride"
        )
    
    # Check if user already requested to join
    existing_request = db.query(RideParticipant).filter(
        RideParticipant.ride_id == ride_id,
        RideParticipant.rider_id == current_user.id
    ).first()
    
    if existing_request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already requested to join this ride"
        )
    
    # Check if ride has space
    current_participants = db.query(RideParticipant).filter(
        RideParticipant.ride_id == ride_id,
        RideParticipant.status == "confirmed"
    ).count()
    
    if current_participants >= ride.max_passengers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ride is full"
        )
    
    # Create join request
    participant = RideParticipant(
        ride_id=ride_id,
        rider_id=current_user.id,
        status="requested"
    )
    
    db.add(participant)
    
    # Update ride status to REQUESTED if it was CREATED
    if ride.status == RideStatus.CREATED:
        ride.status = RideStatus.REQUESTED
    
    db.commit()
    db.refresh(participant)
    
    # Real-time notifications
    await notify_new_ride_request(ride_id, {
        "user_id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email
    })
    
    return {
        "message": "Join request sent successfully",
        "participant_id": participant.id,
        "status": participant.status
    }

@router.post("/confirm/{ride_id}")
async def confirm_ride(
    ride_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Confirm ride and all participants (host only)"""
    
    # Check if ride exists and user is host
    ride = db.query(Ride).filter(
        Ride.id == ride_id,
        Ride.host_id == current_user.id
    ).first()
    
    if not ride:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ride not found or you are not the host"
        )
    
    if ride.status != RideStatus.REQUESTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ride cannot be confirmed in current status"
        )
    
    # Confirm all requested participants
    participants = db.query(RideParticipant).filter(
        RideParticipant.ride_id == ride_id,
        RideParticipant.status == "requested"
    ).all()
    
    confirmed_riders = []
    for participant in participants:
        participant.status = "confirmed"
        confirmed_riders.append({
            "user_id": participant.rider_id,
            "full_name": participant.rider.full_name
        })
    
    # Update ride status
    ride.status = RideStatus.CONFIRMED
    
    db.commit()
    
    # Real-time notification
    await notify_ride_confirmation(ride_id, confirmed_riders)
    
    return {
        "message": "Ride confirmed successfully",
        "confirmed_participants": len(confirmed_riders),
        "ride_status": ride.status.value
    }

@router.post("/start/{ride_id}")
async def start_ride(
    ride_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start the ride (host only)"""
    
    # Check if ride exists and user is host
    ride = db.query(Ride).filter(
        Ride.id == ride_id,
        Ride.host_id == current_user.id
    ).first()
    
    if not ride:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ride not found or you are not the host"
        )
    
    if ride.status != RideStatus.CONFIRMED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ride must be confirmed before starting"
        )
    
    # Update ride status
    ride.status = RideStatus.ONGOING
    db.commit()
    
    # Real-time notification
    await notify_ride_status_change(
        ride_id,
        ride.status.value,
        {"message": "Ride has started! Safe journey!"}
    )
    
    return {
        "message": "Ride started successfully",
        "ride_status": ride.status.value
    }

@router.post("/complete/{ride_id}")
async def complete_ride(
    ride_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Complete the ride (host only)"""
    
    # Check if ride exists and user is host
    ride = db.query(Ride).filter(
        Ride.id == ride_id,
        Ride.host_id == current_user.id
    ).first()
    
    if not ride:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ride not found or you are not the host"
        )
    
    if ride.status != RideStatus.ONGOING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only ongoing rides can be completed"
        )
    
    # Update ride status
    ride.status = RideStatus.COMPLETED
    db.commit()
    
    # Real-time notification
    await notify_ride_status_change(
        ride_id,
        ride.status.value,
        {"message": "Ride completed successfully! Thank you for using PILLION."}
    )
    
    return {
        "message": "Ride completed successfully",
        "ride_status": ride.status.value
    }