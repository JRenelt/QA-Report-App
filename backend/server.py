from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import aiohttp
import asyncio
from urllib.parse import urlparse
import json


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class Category(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    parent_id: Optional[str] = None
    level: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CategoryCreate(BaseModel):
    name: str
    parent_id: Optional[str] = None

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[str] = None

class Favorite(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    url: str
    category_id: Optional[str] = None
    description: Optional[str] = ""
    tags: List[str] = []
    is_broken: bool = False
    is_duplicate: bool = False
    is_localhost: bool = False
    is_protected: bool = False
    browser_source: Optional[str] = None
    favicon_url: Optional[str] = None
    original_path: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class FavoriteCreate(BaseModel):
    title: str
    url: str
    category_id: Optional[str] = None
    description: Optional[str] = ""
    tags: List[str] = []

class FavoriteUpdate(BaseModel):
    title: Optional[str] = None
    url: Optional[str] = None
    category_id: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    is_protected: Optional[bool] = None

class BrowserImport(BaseModel):
    browser_name: str
    bookmarks_data: str

class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Utility functions
def is_localhost_url(url: str) -> bool:
    """Check if URL is localhost"""
    try:
        parsed = urlparse(url)
        return parsed.hostname in ['localhost', '127.0.0.1', '::1'] or (parsed.hostname and parsed.hostname.startswith('192.168.'))
    except:
        return False

async def check_url_status(url: str) -> bool:
    """Check if URL is accessible"""
    if is_localhost_url(url):
        return True
    
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
            async with session.head(url, allow_redirects=True) as response:
                return response.status < 400
    except:
        return False

async def find_duplicates():
    """Find and mark duplicate favorites"""
    favorites = await db.favorites.find({}).to_list(10000)
    url_groups = {}
    
    for fav in favorites:
        url = fav['url'].lower().strip()
        if url not in url_groups:
            url_groups[url] = []
        url_groups[url].append(fav)
    
    for url, favs in url_groups.items():
        if len(favs) > 1:
            # Mark all as duplicates except the first one
            for i, fav in enumerate(favs):
                is_dup = i > 0
                await db.favorites.update_one(
                    {"id": fav["id"]}, 
                    {"$set": {"is_duplicate": is_dup, "updated_at": datetime.utcnow()}}
                )

# Routes
@api_router.get("/")
async def root():
    return {"message": "FavOrg API is running"}

# Category endpoints
@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    categories = await db.categories.find().to_list(1000)
    return [Category(**cat) for cat in categories]

@api_router.post("/categories", response_model=Category)
async def create_category(category: CategoryCreate):
    # Calculate level based on parent
    level = 0
    if category.parent_id:
        parent = await db.categories.find_one({"id": category.parent_id})
        if parent:
            level = parent.get("level", 0) + 1
        else:
            raise HTTPException(status_code=404, detail="Parent category not found")
    
    category_dict = category.dict()
    category_obj = Category(**category_dict, level=level)
    await db.categories.insert_one(category_obj.dict())
    return category_obj

@api_router.put("/categories/{category_id}", response_model=Category)
async def update_category(category_id: str, category_update: CategoryUpdate):
    existing = await db.categories.find_one({"id": category_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")
    
    update_data = {k: v for k, v in category_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    # Recalculate level if parent changed
    if "parent_id" in update_data:
        level = 0
        if update_data["parent_id"]:
            parent = await db.categories.find_one({"id": update_data["parent_id"]})
            if parent:
                level = parent.get("level", 0) + 1
            else:
                raise HTTPException(status_code=404, detail="Parent category not found")
        update_data["level"] = level
    
    await db.categories.update_one({"id": category_id}, {"$set": update_data})
    updated = await db.categories.find_one({"id": category_id})
    return Category(**updated)

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted successfully"}

# Favorite endpoints
@api_router.get("/favorites", response_model=List[Favorite])
async def get_favorites(category_id: Optional[str] = None, status: Optional[str] = None):
    query = {}
    
    if category_id:
        query["category_id"] = category_id
    
    if status == "duplicates":
        query["is_duplicate"] = True
    elif status == "broken":
        query["is_broken"] = True
    elif status == "localhost":
        query["is_localhost"] = True
    
    favorites = await db.favorites.find(query).to_list(10000)
    return [Favorite(**fav) for fav in favorites]

@api_router.post("/favorites", response_model=Favorite)
async def create_favorite(favorite: FavoriteCreate):
    favorite_dict = favorite.dict()
    
    # Check if localhost
    is_localhost = is_localhost_url(favorite.url)
    
    # Check if URL is accessible
    is_broken = not await check_url_status(favorite.url) and not is_localhost
    
    favorite_obj = Favorite(
        **favorite_dict,
        is_localhost=is_localhost,
        is_broken=is_broken
    )
    
    await db.favorites.insert_one(favorite_obj.dict())
    
    # Check for duplicates
    await find_duplicates()
    
    return favorite_obj

@api_router.put("/favorites/{favorite_id}", response_model=Favorite)
async def update_favorite(favorite_id: str, favorite_update: FavoriteUpdate):
    existing = await db.favorites.find_one({"id": favorite_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Favorite not found")
    
    # Check if protected
    if existing.get("is_protected", False):
        raise HTTPException(status_code=403, detail="This favorite is write-protected")
    
    update_data = {k: v for k, v in favorite_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    # Re-check URL status if URL changed
    if "url" in update_data:
        is_localhost = is_localhost_url(update_data["url"])
        is_broken = not await check_url_status(update_data["url"]) and not is_localhost
        update_data["is_localhost"] = is_localhost
        update_data["is_broken"] = is_broken
    
    await db.favorites.update_one({"id": favorite_id}, {"$set": update_data})
    
    # Check for duplicates if URL changed
    if "url" in update_data:
        await find_duplicates()
    
    updated = await db.favorites.find_one({"id": favorite_id})
    return Favorite(**updated)

@api_router.delete("/favorites/{favorite_id}")
async def delete_favorite(favorite_id: str):
    existing = await db.favorites.find_one({"id": favorite_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Favorite not found")
    
    if existing.get("is_protected", False):
        raise HTTPException(status_code=403, detail="This favorite is write-protected")
    
    result = await db.favorites.delete_one({"id": favorite_id})
    return {"message": "Favorite deleted successfully"}

# Import/Export endpoints
@api_router.post("/import/browser")
async def import_browser_bookmarks(import_data: BrowserImport):
    try:
        bookmarks = json.loads(import_data.bookmarks_data)
        imported_count = 0
        
        # Parse bookmarks recursively
        async def parse_bookmarks(items, parent_category_id=None, path=""):
            nonlocal imported_count
            
            for item in items:
                if item.get("type") == "folder":
                    # Create category
                    cat_data = CategoryCreate(
                        name=item["name"],
                        parent_id=parent_category_id
                    )
                    category = await create_category(cat_data)
                    
                    # Process children
                    if "children" in item:
                        await parse_bookmarks(
                            item["children"], 
                            category.id, 
                            f"{path}/{item['name']}" if path else item["name"]
                        )
                
                elif item.get("type") == "url" and item.get("url"):
                    # Create favorite
                    fav_data = FavoriteCreate(
                        title=item.get("name", "Untitled"),
                        url=item["url"],
                        category_id=parent_category_id
                    )
                    
                    # Check for localhost and broken links
                    is_localhost = is_localhost_url(item["url"])
                    is_broken = not await check_url_status(item["url"]) and not is_localhost
                    
                    favorite_obj = Favorite(
                        **fav_data.dict(),
                        is_localhost=is_localhost,
                        is_broken=is_broken,
                        browser_source=import_data.browser_name,
                        original_path=path
                    )
                    
                    await db.favorites.insert_one(favorite_obj.dict())
                    imported_count += 1
        
        if "children" in bookmarks:
            await parse_bookmarks(bookmarks["children"])
        elif isinstance(bookmarks, list):
            await parse_bookmarks(bookmarks)
        
        # Find duplicates after import
        await find_duplicates()
        
        # Create special categories if they don't exist
        special_categories = ["Doppelte Favoriten", "Defekte Links", "Localhost"]
        for cat_name in special_categories:
            existing = await db.categories.find_one({"name": cat_name, "parent_id": None})
            if not existing:
                cat_data = CategoryCreate(name=cat_name, parent_id=None)
                await create_category(cat_data)
        
        # Move items to special categories
        await organize_special_categories()
        
        return {"message": f"Successfully imported {imported_count} bookmarks from {import_data.browser_name}"}
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Import failed: {str(e)}")

async def organize_special_categories():
    """Move favorites to special categories"""
    # Get special category IDs
    dup_cat = await db.categories.find_one({"name": "Doppelte Favoriten", "parent_id": None})
    broken_cat = await db.categories.find_one({"name": "Defekte Links", "parent_id": None})
    localhost_cat = await db.categories.find_one({"name": "Localhost", "parent_id": None})
    
    if dup_cat:
        await db.favorites.update_many(
            {"is_duplicate": True},
            {"$set": {"category_id": dup_cat["id"]}}
        )
    
    if broken_cat:
        await db.favorites.update_many(
            {"is_broken": True, "is_localhost": False},
            {"$set": {"category_id": broken_cat["id"]}}
        )
    
    if localhost_cat:
        await db.favorites.update_many(
            {"is_localhost": True},
            {"$set": {"category_id": localhost_cat["id"]}}
        )

@api_router.post("/export/{browser_name}")
async def export_bookmarks(browser_name: str):
    """Export bookmarks in browser-specific format"""
    categories = await db.categories.find().to_list(1000)
    favorites = await db.favorites.find().to_list(10000)
    
    # Build category tree
    cat_dict = {cat["id"]: cat for cat in categories}
    
    # Build export structure
    def build_folder_structure(parent_id=None):
        result = []
        
        # Get categories at this level
        child_cats = [cat for cat in categories if cat.get("parent_id") == parent_id]
        
        for cat in child_cats:
            folder = {
                "name": cat["name"],
                "type": "folder",
                "children": []
            }
            
            # Add favorites in this category
            cat_favorites = [fav for fav in favorites if fav.get("category_id") == cat["id"]]
            for fav in cat_favorites:
                if not fav.get("is_protected", False):  # Don't export protected items
                    folder["children"].append({
                        "name": fav["title"],
                        "url": fav["url"],
                        "type": "url"
                    })
            
            # Add subcategories
            folder["children"].extend(build_folder_structure(cat["id"]))
            result.append(folder)
        
        return result
    
    export_data = {
        "name": f"Bookmarks from FavOrg",
        "type": "folder",
        "children": build_folder_structure()
    }
    
    return export_data

@api_router.post("/analyze/links")
async def analyze_all_links():
    """Analyze all links for broken status and duplicates"""
    favorites = await db.favorites.find().to_list(10000)
    updated_count = 0
    
    for fav in favorites:
        is_localhost = is_localhost_url(fav["url"])
        is_broken = not await check_url_status(fav["url"]) and not is_localhost
        
        if fav.get("is_localhost") != is_localhost or fav.get("is_broken") != is_broken:
            await db.favorites.update_one(
                {"id": fav["id"]},
                {"$set": {
                    "is_localhost": is_localhost,
                    "is_broken": is_broken,
                    "updated_at": datetime.utcnow()
                }}
            )
            updated_count += 1
    
    await find_duplicates()
    await organize_special_categories()
    
    return {"message": f"Analyzed links, updated {updated_count} favorites"}

# Status check endpoints (existing)
@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()