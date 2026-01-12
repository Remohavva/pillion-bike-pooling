from sqlalchemy.orm import Session
from app.models import User, Ride
from app.schemas import UserCreate

def create_user(db: Session, user_data: UserCreate) -> User:
    """Create a new user in the database"""
    db_user = User(
        supabase_id=user_data.supabase_id,
        email=user_data.email,
        phone=user_data.phone,
        full_name=user_data.full_name,
        role=user_data.role
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_by_supabase_id(db: Session, supabase_id: str) -> User:
    """Get user by Supabase ID"""
    return db.query(User).filter(User.supabase_id == supabase_id).first()

def get_user_by_email(db: Session, email: str) -> User:
    """Get user by email"""
    return db.query(User).filter(User.email == email).first()