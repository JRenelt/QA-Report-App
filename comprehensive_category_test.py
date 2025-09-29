import requests
import json
import time

def comprehensive_category_test():
    base_url = "https://test-suite-portal.preview.emergentagent.com/api"
    
    print("🎯 COMPREHENSIVE CATEGORY CRUD TESTING")
    print("🇩🇪 Teste alle User-gemeldeten Kategorie-Probleme")
    print("=" * 70)
    
    # Test 1: Create category and bookmark
    print("\n📋 TEST 1: Category Creation and Bookmark Assignment")
    
    # Create a unique category name
    test_category_name = f"TestCat_{int(time.time())}"
    category_data = {"name": test_category_name}
    
    response = requests.post(f"{base_url}/categories", json=category_data)
    print(f"   Create category: {response.status_code}")
    
    if response.status_code != 200:
        print(f"   ERROR: {response.text}")
        return False
    
    created_category = response.json()
    category_id = created_category['id']
    print(f"   Created category ID: {category_id}")
    print(f"   Category name: {created_category['name']}")
    
    # Create bookmarks in this category
    bookmarks_to_create = [
        {"title": "Test Bookmark 1", "url": "https://test1.com", "category": test_category_name},
        {"title": "Test Bookmark 2", "url": "https://test2.com", "category": test_category_name}
    ]
    
    created_bookmark_ids = []
    for bookmark_data in bookmarks_to_create:
        response = requests.post(f"{base_url}/bookmarks", json=bookmark_data)
        if response.status_code == 200:
            bookmark = response.json()
            created_bookmark_ids.append(bookmark['id'])
            print(f"   Created bookmark: {bookmark['title']} (ID: {bookmark['id']})")
    
    print(f"   Total bookmarks created: {len(created_bookmark_ids)}")
    
    # Test 2: Verify category has bookmarks
    print(f"\n📋 TEST 2: Verify Category Has Bookmarks")
    
    response = requests.get(f"{base_url}/categories")
    if response.status_code == 200:
        categories = response.json()
        test_category = None
        for cat in categories:
            if cat['id'] == category_id:
                test_category = cat
                break
        
        if test_category:
            bookmark_count = test_category.get('bookmark_count', 0)
            print(f"   Category bookmark count: {bookmark_count}")
            
            if bookmark_count != len(created_bookmark_ids):
                print(f"   ⚠️  Mismatch: Expected {len(created_bookmark_ids)}, got {bookmark_count}")
        else:
            print(f"   ❌ Category not found in list")
            return False
    
    # Test 3: Attempt category deletion with bookmark reassignment
    print(f"\n📋 TEST 3: Category Deletion with Bookmark Reassignment")
    print(f"   Attempting to delete category: {category_id}")
    
    # First, check if "Nicht zugeordnet" exists
    response = requests.get(f"{base_url}/categories")
    if response.status_code == 200:
        categories = response.json()
        nicht_zugeordnet_exists = any(cat.get('name') == 'Nicht zugeordnet' for cat in categories)
        print(f"   'Nicht zugeordnet' exists before deletion: {nicht_zugeordnet_exists}")
    
    # Now delete the category
    response = requests.delete(f"{base_url}/categories/{category_id}")
    print(f"   Delete response status: {response.status_code}")
    print(f"   Delete response body: {response.text}")
    
    if response.status_code == 200:
        result = response.json()
        message = result.get('message', '')
        print(f"   Success message: {message}")
        
        # Check if bookmarks were moved
        response = requests.get(f"{base_url}/bookmarks/category/Nicht zugeordnet")
        if response.status_code == 200:
            uncategorized_bookmarks = response.json()
            moved_bookmarks = [b for b in uncategorized_bookmarks if b['title'] in ['Test Bookmark 1', 'Test Bookmark 2']]
            print(f"   Bookmarks found in 'Nicht zugeordnet': {len(moved_bookmarks)}")
            
            for bookmark in moved_bookmarks:
                print(f"     - {bookmark['title']} (Category: {bookmark['category']})")
        
        # Verify "Nicht zugeordnet" category was created if it didn't exist
        response = requests.get(f"{base_url}/categories")
        if response.status_code == 200:
            categories = response.json()
            nicht_zugeordnet_after = any(cat.get('name') == 'Nicht zugeordnet' for cat in categories)
            print(f"   'Nicht zugeordnet' exists after deletion: {nicht_zugeordnet_after}")
        
        return True
    else:
        print(f"   ❌ Deletion failed: {response.text}")
        
        # Debug: Let's check what categories exist
        print(f"\n🔍 DEBUG: Checking all categories...")
        response = requests.get(f"{base_url}/categories")
        if response.status_code == 200:
            categories = response.json()
            for cat in categories:
                if cat['name'] == test_category_name:
                    print(f"   Found category: {cat['name']} (ID: {cat['id']})")
                    print(f"   Full category data: {json.dumps(cat, indent=4)}")
        
        return False

def test_subcategory_creation():
    base_url = "https://test-suite-portal.preview.emergentagent.com/api"
    
    print(f"\n📋 TEST 4: Subcategory Creation (Multi-level)")
    
    # Create main category
    main_name = f"MainCat_{int(time.time())}"
    response = requests.post(f"{base_url}/categories", json={"name": main_name})
    
    if response.status_code != 200:
        print(f"   ❌ Failed to create main category: {response.text}")
        return False
    
    print(f"   ✅ Created main category: {main_name}")
    
    # Create subcategory
    sub_name = f"SubCat_{int(time.time())}"
    response = requests.post(f"{base_url}/categories", json={
        "name": sub_name,
        "parent_category": main_name
    })
    
    if response.status_code != 200:
        print(f"   ❌ Failed to create subcategory: {response.text}")
        return False
    
    print(f"   ✅ Created subcategory: {sub_name} under {main_name}")
    
    # Create sub-subcategory
    sub_sub_name = f"SubSubCat_{int(time.time())}"
    response = requests.post(f"{base_url}/categories", json={
        "name": sub_sub_name,
        "parent_category": sub_name
    })
    
    if response.status_code != 200:
        print(f"   ❌ Failed to create sub-subcategory: {response.text}")
        return False
    
    print(f"   ✅ Created sub-subcategory: {sub_sub_name} under {sub_name}")
    
    # Test invalid parent
    response = requests.post(f"{base_url}/categories", json={
        "name": f"InvalidSub_{int(time.time())}",
        "parent_category": "NonExistentParent999"
    })
    
    if response.status_code == 400 or response.status_code == 422:
        print(f"   ✅ Correctly rejected invalid parent category")
        return True
    else:
        print(f"   ⚠️  Invalid parent was accepted (should be rejected): {response.status_code}")
        return False

def test_category_cleanup():
    base_url = "https://test-suite-portal.preview.emergentagent.com/api"
    
    print(f"\n📋 TEST 5: Category Cleanup")
    
    response = requests.post(f"{base_url}/categories/cleanup")
    print(f"   Cleanup response: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"   Cleanup result: {result}")
        return True
    else:
        print(f"   ❌ Cleanup failed: {response.text}")
        return False

if __name__ == "__main__":
    success1 = comprehensive_category_test()
    success2 = test_subcategory_creation()
    success3 = test_category_cleanup()
    
    print(f"\n" + "=" * 70)
    print(f"📊 FINAL RESULTS")
    print(f"✅ Category Deletion with Reassignment: {'PASS' if success1 else 'FAIL'}")
    print(f"✅ Subcategory Creation (Multi-level): {'PASS' if success2 else 'FAIL'}")
    print(f"✅ Category Cleanup: {'PASS' if success3 else 'FAIL'}")
    
    if success1 and success2 and success3:
        print(f"\n🎉 ALL CATEGORY TESTS PASSED!")
        print(f"✅ Backend Category CRUD functionality is working correctly")
    else:
        print(f"\n⚠️  Some category tests failed")
        print(f"❌ Backend issues identified that could cause user problems")