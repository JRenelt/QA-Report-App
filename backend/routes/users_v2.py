"""
User Management V2 - Komplett überarbeitet
- SysOp: CRUD über alle User
- Admin: CRUD nur eigene Firma
- QA-Tester: Nur eigenes Profil
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List
from auth import get_current_user, get_password_hash
from database import get_database
from models_v2 import (
    UserV2, UserCreateV2, UserUpdateV2, UserInDBV2, UserRoleV2
)
import uuid
from datetime import datetime

router = APIRouter(prefix="/users-v2", tags=["users-v2"])

@router.get("/", response_model=List[UserV2])
async def get_users(current_user: dict = Depends(get_current_user)):
    """
    Get users based on role:
    - SysOp: Alle User
    - Admin: Nur User seiner Firma
    - QA-Tester: Nur eigenes Profil
    """
    db = await get_database()
    users_collection = db["users_v2"]
    
    if current_user.role == "sysop":
        # SysOp sieht ALLE User
        users = await users_collection.find().to_list(length=None)
    elif current_user.role == "admin":
        # Admin sieht nur User seiner Firma
        users = await users_collection.find({
            "company_id": current_user.company_id
        }).to_list(length=None)
    else:
        # QA-Tester sieht nur sich selbst
        users = await users_collection.find({
            "id": current_user.id
        }).to_list(length=None)
    
    # Entferne hashed_password aus Response
    for user in users:
        user.pop("hashed_password", None)
        user.pop("_id", None)
    
    return users

@router.get("/{user_id}", response_model=UserV2)
async def get_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """Get single user"""
    db = await get_database()
    users_collection = db["users_v2"]
    
    user = await users_collection.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User nicht gefunden")
    
    # Permission Check
    if current_user.role == "qa_tester" and user["id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Keine Berechtigung")
    
    if current_user.role == "admin" and user["company_id"] != current_user.company_id:
        raise HTTPException(status_code=403, detail="Keine Berechtigung")
    
    user.pop("hashed_password", None)
    user.pop("_id", None)
    return user

@router.post("/", response_model=UserV2)
async def create_user(user_data: UserCreateV2, current_user: dict = Depends(get_current_user)):
    """
    Create new user:
    - SysOp: Kann alle Rollen erstellen
    - Admin: Kann nur Admin + QA-Tester seiner Firma erstellen
    - QA-Tester: Keine Berechtigung
    """
    db = await get_database()
    users_collection = db["users_v2"]
    
    # Permission Check
    if current_user.role == "qa_tester":
        raise HTTPException(status_code=403, detail="QA-Tester können keine User anlegen")
    
    if current_user.role == "admin":
        # Admin kann nur User seiner Firma erstellen
        if user_data.company_id != current_user.company_id:
            raise HTTPException(status_code=403, detail="Keine Berechtigung für diese Firma")
        # Admin kann keine SysOps erstellen
        if user_data.role == UserRoleV2.sysop:
            raise HTTPException(status_code=403, detail="Admin kann keine SysOps erstellen")
    
    # Check if username already exists
    existing_user = await users_collection.find_one({"username": user_data.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username bereits vergeben")
    
    # Check if email already exists
    existing_email = await users_collection.find_one({"email": user_data.email})
    if existing_email:
        raise HTTPException(status_code=400, detail="E-Mail bereits vergeben")
    
    # Create user
    user_dict = user_data.dict()
    hashed_pw = get_password_hash(user_dict.pop("password"))
    
    new_user = {
        "id": str(uuid.uuid4()),
        **user_dict,
        "hashed_password": hashed_pw,
        "is_active": True,
        "is_blocked": False,
        "is_deletable": user_data.role != UserRoleV2.sysop,  # SysOp nicht löschbar
        "blocked_projects": [],
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    await users_collection.insert_one(new_user)
    
    new_user.pop("hashed_password")
    new_user.pop("_id")
    return new_user

@router.put("/{user_id}", response_model=UserV2)
async def update_user(
    user_id: str,
    user_update: UserUpdateV2,
    current_user: dict = Depends(get_current_user)
):
    """
    Update user:
    - SysOp: Kann alle User bearbeiten
    - Admin: Kann nur User seiner Firma bearbeiten
    - QA-Tester: Kann nur eigenes Profil bearbeiten (Username, Vor-/Nachname, E-Mail, Tel)
    """
    db = await get_database()
    users_collection = db["users_v2"]
    
    user = await users_collection.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User nicht gefunden")
    
    # Permission Check
    if current_user.role == "qa_tester":
        if user["id"] != current_user.id:
            raise HTTPException(status_code=403, detail="QA-Tester können nur ihr eigenes Profil bearbeiten")
        # QA-Tester darf nur bestimmte Felder ändern
        allowed_fields = {"username", "first_name", "last_name", "email", "tel"}
        update_fields = {k: v for k, v in user_update.dict(exclude_unset=True).items() if k in allowed_fields}
    elif current_user.role == "admin":
        if user["company_id"] != current_user.company_id:
            raise HTTPException(status_code=403, detail="Admin kann nur User seiner Firma bearbeiten")
        # Admin darf keine SysOps bearbeiten
        if user["role"] == "sysop":
            raise HTTPException(status_code=403, detail="Admin kann keine SysOps bearbeiten")
        update_fields = user_update.dict(exclude_unset=True)
    else:
        # SysOp darf alles
        update_fields = user_update.dict(exclude_unset=True)
    
    # Update timestamp
    update_fields["updated_at"] = datetime.utcnow().isoformat()
    
    await users_collection.update_one(
        {"id": user_id},
        {"$set": update_fields}
    )
    
    updated_user = await users_collection.find_one({"id": user_id})
    updated_user.pop("hashed_password", None)
    updated_user.pop("_id", None)
    return updated_user

@router.delete("/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """
    Delete user:
    - SysOp: Kann alle löschbaren User löschen
    - Admin: Kann nur User seiner Firma löschen
    - QA-Tester: Keine Berechtigung
    """
    db = await get_database()
    users_collection = db["users_v2"]
    
    # Permission Check
    if current_user.role == "qa_tester":
        raise HTTPException(status_code=403, detail="QA-Tester können keine User löschen")
    
    user = await users_collection.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User nicht gefunden")
    
    # Check if deletable
    if not user.get("is_deletable", True):
        raise HTTPException(status_code=403, detail="Dieser User kann nicht gelöscht werden")
    
    if current_user.role == "admin":
        if user["company_id"] != current_user.company_id:
            raise HTTPException(status_code=403, detail="Admin kann nur User seiner Firma löschen")
        if user["role"] == "sysop":
            raise HTTPException(status_code=403, detail="Admin kann keine SysOps löschen")
    
    await users_collection.delete_one({"id": user_id})
    
    return {"message": "User erfolgreich gelöscht"}

@router.post("/{user_id}/block")
async def block_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """
    Block/Unblock user:
    - SysOp: Kann alle User sperren
    - Admin: Kann nur User seiner Firma sperren
    """
    db = await get_database()
    users_collection = db["users_v2"]
    
    if current_user.role not in ["sysop", "admin"]:
        raise HTTPException(status_code=403, detail="Keine Berechtigung zum Sperren")
    
    user = await users_collection.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User nicht gefunden")
    
    if current_user.role == "admin":
        if user["company_id"] != current_user.company_id:
            raise HTTPException(status_code=403, detail="Keine Berechtigung")
        if user["role"] == "sysop":
            raise HTTPException(status_code=403, detail="Admin kann SysOps nicht sperren")
    
    # Toggle block status
    new_status = not user.get("is_blocked", False)
    await users_collection.update_one(
        {"id": user_id},
        {"$set": {"is_blocked": new_status, "updated_at": datetime.utcnow().isoformat()}}
    )
    
    # WICHTIG: Wenn User entsperrt wird, muss auch die Firma entsperrt werden
    if new_status == False:  # User wird entsperrt
        companies_collection = db["companies_v2"]
        await companies_collection.update_one(
            {"id": user["company_id"]},
            {"$set": {"is_blocked": False, "updated_at": datetime.utcnow().isoformat()}}
        )
    
    return {"message": f"User {'gesperrt' if new_status else 'entsperrt'}", "is_blocked": new_status}

@router.post("/{user_id}/block-project/{project_id}")
async def block_user_from_project(
    user_id: str,
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Block user from specific project (nur SysOp)
    """
    if current_user.role != "sysop":
        raise HTTPException(status_code=403, detail="Nur SysOp kann User für einzelne Projekte sperren")
    
    db = await get_database()
    users_collection = db["users_v2"]
    
    user = await users_collection.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User nicht gefunden")
    
    blocked_projects = user.get("blocked_projects", [])
    if project_id in blocked_projects:
        # Entsperren
        blocked_projects.remove(project_id)
        message = "User für Projekt entsperrt"
    else:
        # Sperren
        blocked_projects.append(project_id)
        message = "User für Projekt gesperrt"
    
    await users_collection.update_one(
        {"id": user_id},
        {"$set": {"blocked_projects": blocked_projects, "updated_at": datetime.utcnow().isoformat()}}
    )
    
    return {"message": message, "blocked_projects": blocked_projects}

@router.post("/change-password")
async def change_password(
    old_password: str,
    new_password: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Change user's own password
    Alle User können ihr eigenes Passwort ändern
    """
    from auth import verify_password, get_password_hash
    
    db = await get_database()
    users_collection = db["users_v2"]
    
    # Get current user from database
    user = await users_collection.find_one({"id": current_user["id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User nicht gefunden")
    
    # Verify old password
    if not verify_password(old_password, user.get("hashed_password", "")):
        raise HTTPException(status_code=400, detail="Altes Passwort ist nicht korrekt")
    
    # Validate new password
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Neues Passwort muss mindestens 8 Zeichen lang sein")
    
    # Hash new password
    new_hashed_password = get_password_hash(new_password)
    
    # Update password
    await users_collection.update_one(
        {"id": current_user["id"]},
        {"$set": {
            "hashed_password": new_hashed_password,
            "updated_at": datetime.utcnow().isoformat()
        }}
    )
    
    return {"message": "Passwort erfolgreich geändert"}
