from fastapi import APIRouter

router = APIRouter()

@router.get("/profile")
async def get_user_profile():
    """Get user profile - to be implemented"""
    return {"message": "User profile endpoint"}