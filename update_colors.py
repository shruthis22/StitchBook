import os

def replace_in_file(filepath, old_str, new_str):
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        content = content.replace(old_str, new_str)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

replace_in_file(r'app\(drawer)\home\index.tsx', "backgroundColor: '#3B82F6'", "backgroundColor: '#1F2937'")
replace_in_file(r'app\(drawer)\home\index.tsx', "borderColor: '#3B82F6'", "borderColor: '#1F2937'")
replace_in_file(r'app\(drawer)\home\index.tsx', "backgroundColor: '#10B981'", "backgroundColor: '#1F2937'")

replace_in_file(r'app\(drawer)\pending-payments\index.tsx', "backgroundColor: '#3B82F6'", "backgroundColor: '#1F2937'")
replace_in_file(r'app\(drawer)\pending-payments\index.tsx', "borderColor: '#3B82F6'", "borderColor: '#1F2937'")

replace_in_file(r'app\(drawer)\add-stock\index.tsx', "backgroundColor: '#3B82F6'", "backgroundColor: '#1F2937'")

# Also fix the weird single quote issue I introduced in my first python script regex:
replace_in_file(r'app\(drawer)\add\index.tsx', "backgroundColor: \\'#1F2937\\'", "backgroundColor: '#1F2937'")
replace_in_file(r'app\(drawer)\add-customer\index.tsx', "backgroundColor: \\'#1F2937\\'", "backgroundColor: '#1F2937'")
replace_in_file(r'app\(drawer)\add-stock\index.tsx', "backgroundColor: \\'#1F2937\\'", "backgroundColor: '#1F2937'")
replace_in_file(r'app\(drawer)\home\index.tsx', "backgroundColor: \\'#1F2937\\'", "backgroundColor: '#1F2937'")
