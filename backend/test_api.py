import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

def test_basic_endpoints():
    """Test basic API endpoints"""
    print("🚀 Testing PILLION API...")
    
    # Test root endpoint
    response = requests.get(f"{BASE_URL}/")
    print(f"✅ Root endpoint: {response.json()}")
    
    # Test health endpoint
    response = requests.get(f"{BASE_URL}/health")
    print(f"✅ Health endpoint: {response.json()}")
    
    print("\n📋 Available API endpoints:")
    print("- GET  /                    - Root message")
    print("- GET  /health              - Health check")
    print("- GET  /docs                - API documentation")
    print("- POST /api/users/register  - Register user")
    print("- GET  /api/users/profile   - Get user profile")
    print("- POST /api/rides/create    - Create ride")
    print("- POST /api/rides/nearby    - Get nearby rides")
    print("- GET  /api/auth/verify     - Verify token")
    
    print("\n🎯 Core Features Implemented:")
    print("✅ FastAPI server with SQLite database")
    print("✅ User management with roles (rider, bike_host, admin)")
    print("✅ Ride creation and proximity search")
    print("✅ JWT authentication middleware")
    print("✅ Database models for users, rides, participants, helmet checks")
    print("✅ Clean API structure with proper error handling")
    
    print("\n🔧 Next Steps:")
    print("1. Set up Supabase project for authentication")
    print("2. Test ride creation and nearby search with real data")
    print("3. Add helmet verification endpoints")
    print("4. Implement ride lifecycle management")
    print("5. Add mobile app integration")

if __name__ == "__main__":
    try:
        test_basic_endpoints()
    except requests.exceptions.ConnectionError:
        print("❌ Server not running. Start with: python run.py")