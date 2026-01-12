from fastapi import APIRouter

router = APIRouter()

@router.get("/verify")
async def verify_token():
    """Verify Supabase JWT token - to be implemented"""
    return {"message": "Auth verification endpoint"}