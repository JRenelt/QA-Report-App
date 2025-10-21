#!/usr/bin/env python3
"""
Update test companies with placeholder "P" logo
"""

import asyncio
import sys
sys.path.insert(0, '/app/backend')

from database import companies_collection, connect_db, disconnect_db

# Simple SVG logo with "P"
PLACEHOLDER_LOGO = """data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCAyMDAgODAiPgogIDxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iODAiIGZpbGw9IiNFQ0YwRjEiLz4KICA8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjQ4IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzJDM0U1MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+UDwvdGV4dD4KPC9zdmc+"""

async def update_companies():
    """Update all test companies (except ID2) with placeholder logo"""
    await connect_db()
    
    # Get all companies
    companies = await companies_collection.find({}).to_list(1000)
    
    updated_count = 0
    for company in companies:
        # Skip if it's ID2 or already has a logo
        if company.get("id") == "ID2" or company.get("logo_url"):
            continue
        
        # Update with placeholder logo
        result = await companies_collection.update_one(
            {"id": company["id"]},
            {"$set": {"logo_url": PLACEHOLDER_LOGO}}
        )
        
        if result.modified_count > 0:
            print(f"✅ Updated {company['name']} with placeholder logo")
            updated_count += 1
    
    print(f"\n✅ Total: {updated_count} companies updated with placeholder logo")
    
    await disconnect_db()

if __name__ == "__main__":
    asyncio.run(update_companies())
