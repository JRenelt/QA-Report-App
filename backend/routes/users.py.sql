"""
User Management Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from typing import List
from database import database
from models import User, UserCreate, UserUpdate
from auth import get_current_user, require_admin, get_password_hash

router = APIRouter()

@router.get("/", response_model=List[User])
async def get_users(current_user: User = Depends(require_admin)):
    """Get all users (Admin only)"""
    query = text("""
        SELECT id, username, email, first_name, last_name, role, 
               is_active, created_at, updated_at, language_preference
        FROM users 
        ORDER BY created_at DESC
    """)
    result = await database.fetch_all(query)
    return [User(**dict(row)) for row in result]

@router.post("/", response_model=User)
async def create_user(user_data: UserCreate, current_user: User = Depends(require_admin)):
    """Create new user (Admin only)"""
    # Check if user already exists
    existing_user = text("""
        SELECT id FROM users WHERE username = :username OR email = :email
    """)
    existing = await database.fetch_one(existing_user, {
        "username": user_data.username, 
        "email": user_data.email
    })
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this username or email already exists"
        )
    
    # Hash password and create user
    hashed_password = get_password_hash(user_data.password)
    
    query = text("""
        INSERT INTO users (username, email, password_hash, first_name, last_name, role, language_preference)
        VALUES (:username, :email, :password_hash, :first_name, :last_name, :role, :language_preference)
        RETURNING id, username, email, first_name, last_name, role, is_active, created_at, updated_at, language_preference
    """)
    
    result = await database.fetch_one(query, {
        "username": user_data.username,
        "email": user_data.email,
        "password_hash": hashed_password,
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "role": user_data.role,
        "language_preference": user_data.language_preference
    })
    
    return User(**dict(result))

@router.put("/{user_id}", response_model=User)
async def update_user(
    user_id: int, 
    user_data: UserUpdate, 
    current_user: User = Depends(require_admin)
):
    """Update user (Admin only)"""
    # Build dynamic update query
    update_fields = []
    values = {"user_id": user_id}
    
    for field, value in user_data.dict(exclude_unset=True).items():
        if value is not None:
            update_fields.append(f"{field} = :{field}")
            values[field] = value
    
    if not update_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    update_fields.append("updated_at = CURRENT_TIMESTAMP")
    
    query = text(f"""
        UPDATE users SET {', '.join(update_fields)}
        WHERE id = :user_id
        RETURNING id, username, email, first_name, last_name, role, is_active, created_at, updated_at, language_preference
    """)
    
    result = await database.fetch_one(query, values)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return User(**dict(result))