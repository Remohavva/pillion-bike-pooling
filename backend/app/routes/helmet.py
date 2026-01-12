from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import HelmetCheck, User, Ride
from app.schemas import HelmetCheckCreate, HelmetCheckResponse
from app.auth import get_current_user
from typing import List
import os
import uuid
from datetime import datetime

router = APIRouter()

# Simple file upload directory (in production, use cloud storage)
UPLOAD_DIR = "uploads/helmets"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=dict)
async def upload_helmet_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload helmet verification image"""
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files are allowed"
        )
    
    # Generate unique filename
    file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Return file URL (in production, return cloud storage URL)
        image_url = f"/uploads/helmets/{unique_filename}"
        
        return {
            "success": True,
            "image_url": image_url,
            "message": "Image uploaded successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload image"
        )

@router.post("/verify", response_model=HelmetCheckResponse)
async def verify_helmet(
    helmet_data: HelmetCheckCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create helmet verification record"""
    
    # Check if ride exists
    ride = db.query(Ride).filter(Ride.id == helmet_data.ride_id).first()
    if not ride:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ride not found"
        )
    
    # Check if user already has helmet verification for this ride
    existing_check = db.query(HelmetCheck).filter(
        HelmetCheck.user_id == current_user.id,
        HelmetCheck.ride_id == helmet_data.ride_id
    ).first()
    
    if existing_check:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Helmet verification already exists for this ride"
        )
    
    # Create helmet check record
    helmet_check = HelmetCheck(
        user_id=current_user.id,
        ride_id=helmet_data.ride_id,
        image_url=helmet_data.image_url,
        is_verified=True,  # In production, implement actual verification logic
        created_at=datetime.utcnow()
    )
    
    db.add(helmet_check)
    db.commit()
    db.refresh(helmet_check)
    
    return helmet_check

@router.get("/check/{ride_id}", response_model=HelmetCheckResponse)
async def get_helmet_check(
    ride_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get helmet verification status for a ride"""
    
    helmet_check = db.query(HelmetCheck).filter(
        HelmetCheck.user_id == current_user.id,
        HelmetCheck.ride_id == ride_id
    ).first()
    
    if not helmet_check:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No helmet verification found for this ride"
        )
    
    return helmet_check

@router.get("/user-checks", response_model=List[HelmetCheckResponse])
async def get_user_helmet_checks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all helmet checks for current user"""
    
    helmet_checks = db.query(HelmetCheck).filter(
        HelmetCheck.user_id == current_user.id
    ).order_by(HelmetCheck.created_at.desc()).all()
    
    return helmet_checks

@router.delete("/check/{check_id}")
async def delete_helmet_check(
    check_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a helmet check (admin or owner only)"""
    
    helmet_check = db.query(HelmetCheck).filter(HelmetCheck.id == check_id).first()
    
    if not helmet_check:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Helmet check not found"
        )
    
    # Check permissions
    if helmet_check.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this helmet check"
        )
    
    db.delete(helmet_check)
    db.commit()
    
    return {"message": "Helmet check deleted successfully"}