import os
import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Updated regex to handle lassName={...} and lassName="..."
    # We assume the `lassName` part has the correct value (original code), and `c className="..."` is the corruption prefix.
    # So we remove `c className="..."` and rename `lassName` to `className`.
    
    new_content = re.sub(r'c className="[^"]*"\s*lassName=', 'className=', content)
    new_content = re.sub(r"c className='[^']*'\s*lassName=", "className=", new_content)
    
    # Handle the weird case in MACFusion.tsx: className="..."c className="..."
    # regex: `className="[^"]*"\s*c className="[^"]*"` -> `className="..."` (keep first?)
    # or `c className` inside might be valid? No.
    # Let's clean up `c className="..."` if it appears alone? No that might delete valid className if I'm not careful.
    # But `MACFusion.tsx` had: `className="mac-title"c className="mac-title"`
    # This looks like `className` followed by duplicate `c className`.
    # We can remove `c className="[^"]*"` if it follows matches.
    
    new_content = re.sub(r'(className="[^"]*")\s*c className="[^"]*"', r'\1', new_content)

    if new_content != content:
        print(f"Fixing {filepath}")
        with open(filepath, 'w') as f:
            f.write(new_content)

def walk_and_fix(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts') or file.endswith('.jsx') or file.endswith('.js'):
                fix_file(os.path.join(root, file))

if __name__ == '__main__':
    walk_and_fix('src/components')
