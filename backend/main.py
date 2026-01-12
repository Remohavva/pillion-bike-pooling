from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, rides, users
from app.database import engine, Base
import os
from dotenv import load_dotenv

load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PILLION API",
    description="Bike pooling platform for Indian students and professionals",
    version="1.0.0"
)

# CORS middleware for mobile app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(rides.router, prefix="/api/rides", tags=["Rides"])

@app.get("/")
async def root():
    return {"message": "PILLION API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}