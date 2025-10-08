"""
User Management Routes - MongoDB Version
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
import uuid
from database import users_collection
from models import User, UserCreate, UserUpdate
from auth import get_current_user, require_admin, get_password_hash

router = APIRouter()

@router.get("/", response_model=List[User])
async def get_users(current_user: User = Depends(require_admin)):
    """Get all users (Admin only)"""
    users = await users_collection.find().sort("created_at", -1).to_list(1000)
    return [User(**{k: v for k, v in user.items() if k != "_id"}) for user in users]

@router.post("/", response_model=User)
async def create_user(user_data: UserCreate, current_user: User = Depends(require_admin)):
    """Create new user (Admin only)"""
    # Check if user already exists
    existing = await users_collection.find_one({
        "$or": [
            {"username": user_data.username},
            {"email": user_data.email}
        ]
    })
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this username or email already exists"
        )
    
    # Hash password and create user
    hashed_password = get_password_hash(user_data.password)
    
    new_user = {
        "id": str(uuid.uuid4()),
        "username": user_data.username,
        "email": user_data.email,
        "hashed_password": hashed_password,
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "role": user_data.role,
        "language_preference": user_data.language_preference,
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await users_collection.insert_one(new_user)
    
    # Remove MongoDB _id and hashed_password
    user_response = {k: v for k, v in new_user.items() if k not in ["_id", "hashed_password"]}
    return User(**user_response)

@router.put("/{user_id}", response_model=User)
async def update_user(
    user_id: str, 
    user_data: UserUpdate, 
    current_user: User = Depends(require_admin)
):
    """Update user (Admin only)"""
    # Build update document
    update_data = user_data.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    update_data["updated_at"] = datetime.utcnow()
    
    result = await users_collection.find_one_and_update(
        {"id": user_id},
        {"$set": update_data},
        return_document=True
    )
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Remove MongoDB _id and hashed_password
    user_response = {k: v for k, v in result.items() if k not in ["_id", "hashed_password"]}
    return User(**user_response)

@router.delete("/{user_id}")
async def delete_user(user_id: str, current_user: User = Depends(require_admin)):
    """Delete user (Admin only)"""
    result = await users_collection.delete_one({"id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {"message": "User deleted successfully"}
