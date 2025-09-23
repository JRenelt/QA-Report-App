import requests
import json

def debug_category_operations():
    base_url = "https://test-audit-tool.preview.emergentagent.com/api"
    
    print("🔍 DEBUGGING CATEGORY OPERATIONS")
    print("=" * 50)
    
    # Step 1: Create a test bookmark in a specific category
    print("\n1. Creating test bookmark...")
    bookmark_data = {
        "title": "Debug Test Bookmark",
        "url": "https://example.com/debug",
        "category": "DebugTestCategory"
    }
    
    response = requests.post(f"{base_url}/bookmarks", json=bookmark_data)
    print(f"   Bookmark creation: {response.status_code}")
    if response.status_code == 200:
        bookmark = response.json()
        print(f"   Created bookmark ID: {bookmark['id']}")
        print(f"   Category: {bookmark['category']}")
    
    # Step 2: Get all categories to see the structure
    print("\n2. Getting all categories...")
    response = requests.get(f"{base_url}/categories")
    print(f"   Categories fetch: {response.status_code}")
    
    if response.status_code == 200:
        categories = response.json()
        print(f"   Total categories: {len(categories)}")
        
        # Find our test category
        debug_category = None
        for cat in categories:
            if cat.get('name') == 'DebugTestCategory':
                debug_category = cat
                break
        
        if debug_category:
            print(f"   Found DebugTestCategory:")
            print(f"     ID: {debug_category['id']}")
            print(f"     Name: {debug_category['name']}")
            print(f"     Bookmark count: {debug_category.get('bookmark_count', 0)}")
            
            # Step 3: Try to delete this category
            print(f"\n3. Attempting to delete category {debug_category['id']}...")
            response = requests.delete(f"{base_url}/categories/{debug_category['id']}")
            print(f"   Delete response: {response.status_code}")
            print(f"   Response body: {response.text}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"   Success message: {result.get('message', 'No message')}")
                
                # Step 4: Verify bookmarks were moved
                print(f"\n4. Checking if bookmarks were moved to 'Nicht zugeordnet'...")
                response = requests.get(f"{base_url}/bookmarks/category/Nicht zugeordnet")
                if response.status_code == 200:
                    uncategorized_bookmarks = response.json()
                    print(f"   Bookmarks in 'Nicht zugeordnet': {len(uncategorized_bookmarks)}")
                    
                    # Look for our test bookmark
                    found_bookmark = any(b.get('title') == 'Debug Test Bookmark' for b in uncategorized_bookmarks)
                    print(f"   Our test bookmark found in 'Nicht zugeordnet': {found_bookmark}")
            else:
                print(f"   Delete failed with error: {response.text}")
        else:
            print("   DebugTestCategory not found in categories list")
    
    # Step 5: Test subcategory creation
    print(f"\n5. Testing subcategory creation...")
    
    # Create parent category
    parent_data = {"name": "ParentDebugCategory"}
    response = requests.post(f"{base_url}/categories", json=parent_data)
    print(f"   Parent category creation: {response.status_code}")
    
    if response.status_code == 200:
        parent_category = response.json()
        parent_name = parent_category['name']
        
        # Create subcategory
        sub_data = {
            "name": "SubDebugCategory",
            "parent_category": parent_name
        }
        response = requests.post(f"{base_url}/categories", json=sub_data)
        print(f"   Subcategory creation: {response.status_code}")
        
        if response.status_code == 200:
            sub_category = response.json()
            print(f"   Subcategory created: {sub_category['name']}")
            print(f"   Parent: {sub_category.get('parent_category')}")
        else:
            print(f"   Subcategory creation failed: {response.text}")
    
    # Step 6: Test invalid parent category
    print(f"\n6. Testing invalid parent category...")
    invalid_data = {
        "name": "InvalidSubCategory",
        "parent_category": "NonExistentParent999"
    }
    response = requests.post(f"{base_url}/categories", json=invalid_data)
    print(f"   Invalid parent test: {response.status_code}")
    print(f"   Response: {response.text}")
    
    # Expected: Should return error (400/422), but if it returns 200, that's a problem

if __name__ == "__main__":
    debug_category_operations()