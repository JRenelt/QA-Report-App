#!/usr/bin/env python3

# Script to fix the duplicate content in App.js

def fix_app_js():
    with open('/app/frontend/src/App.js', 'r') as f:
        lines = f.readlines()
    
    # Find the problematic section
    # The duplicate starts at line 2895 (index 2894) with "  // Core State Management"
    # The duplicate ends at line 3843 (index 3842) with "  };"
    # The return statement should be at line 3844 (index 3843)
    
    # Remove lines 2895 to 3843 (indices 2894 to 3842)
    fixed_lines = lines[:2894] + lines[3843:]
    
    with open('/app/frontend/src/App.js', 'w') as f:
        f.writelines(fixed_lines)
    
    print("Fixed App.js by removing duplicate content")
    print(f"Original lines: {len(lines)}")
    print(f"Fixed lines: {len(fixed_lines)}")
    print(f"Removed lines: {len(lines) - len(fixed_lines)}")

if __name__ == "__main__":
    fix_app_js()