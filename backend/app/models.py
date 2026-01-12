from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from app.database import Base
from datetime import datetime
import enum

class UserRole(enum.Enum):
    RIDER = "rider"
    BIKE_HOST = "bike_host"
    ADMIN = "admin"

class RideStatus(enum.Enum):
    CREATED = "created"
    REQUESTED = "requested"
    CONFIRMED = "confirmed"
    ONGOING = "ongoing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    supabase_id = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.RIDER)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    hosted_rides = relationship("Ride", foreign_keys="Ride.host_id", back_populates="host")
    joined_rides = relationship("RideParticipant", back_populates="rider")
    helmet_checks = relationship("HelmetCheck", back_populates="user")

class Ride(Base):
    __tablename__ = "rides"
    
    id = Column(Integer, primary_key=True, index=True)
    host_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    
    # Location data using PostGIS
    start_location = Column(Geometry('POINT'), nullable=False)
    end_location = Column(Geometry('POINT'), nullable=False)
    start_address = Column(String, nullable=False)
    end_address = Column(String, nullable=False)
    
    # Ride details
    departure_time = Column(DateTime, nullable=False)
    max_passengers = Column(Integer, default=1)
    status = Column(SQLEnum(RideStatus), default=RideStatus.CREATED)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    host = relationship("User", foreign_keys=[host_id], back_populates="hosted_rides")
    participants = relationship("RideParticipant", back_populates="ride")
    helmet_checks = relationship("HelmetCheck", back_populates="ride")

class RideParticipant(Base):
    __tablename__ = "ride_participants"
    
    id = Column(Integer, primary_key=True, index=True)
    ride_id = Column(Integer, ForeignKey("rides.id"), nullable=False)
    rider_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="requested")  # requested, confirmed, cancelled
    joined_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    ride = relationship("Ride", back_populates="participants")
    rider = relationship("User", back_populates="joined_rides")

class HelmetCheck(Base):
    __tablename__ = "helmet_checks"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    ride_id = Column(Integer, ForeignKey("rides.id"), nullable=False)
    image_url = Column(String, nullable=False)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="helmet_checks")
    ride = relationship("Ride", back_populates="helmet_checks")