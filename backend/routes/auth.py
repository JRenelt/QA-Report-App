"""
Authentication Routes - MongoDB Version
"""

from fastapi import APIRouter, Depends, HTTPException, status
from models import LoginForm, Token, User
from auth import authenticate_user, create_access_token

router = APIRouter()

@router.post("/login", response_model=Token)
async def login(form_data: LoginForm):
    """User login endpoint"""
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": str(user["id"])})
    user_obj = User(**user)
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_obj
    )

@router.post("/logout")
async def logout():
    """User logout endpoint (client-side token removal)"""
    return {"message": "Successfully logged out"}