from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routes import auth, rides, users, helmet, websocket
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

# Serve uploaded files
if os.path.exists("uploads"):
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(rides.router, prefix="/api/rides", tags=["Rides"])
app.include_router(helmet.router, prefix="/api/helmet", tags=["Helmet Verification"])
app.include_router(websocket.router, prefix="/api", tags=["WebSocket"])

@app.get("/")
async def root():
    return {"message": "PILLION API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/api/status")
async def api_status():
    return {
        "status": "running",
        "version": "1.0.0",
        "features": [
            "Authentication with Supabase",
            "Ride management with real-time updates",
            "Helmet verification",
            "WebSocket real-time notifications",
            "GPS proximity matching"
        ]
    }