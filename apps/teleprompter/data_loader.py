import re
import json
import os

def parse_bullets(filepath):
    if not os.path.exists(filepath):
        print(f"Error: {filepath} not found.")
        return None

    with open(filepath, 'r') as f:
        content = f.read()

    # Define our target segments based on ## SEGMENT headers
    segments = []
    segment_blocks = re.split(r"## SEGMENT ", content)
    
    for block in segment_blocks[1:]: # Skip preamble
        lines = block.strip().split('\n')
        header = lines[0]
        
        # Extract title and duration
        # Format: 1: HOOK (30 seconds)
        duration_match = re.search(r"\((.*?) seconds?\)", header)
        duration = int(duration_match.group(1)) if duration_match else 60
            
        title = header.split('(')[0].split(':')[-1].strip()
        
        # Extract bullets and sub-sections
        bullets = []
        for line in lines[1:]:
            line = line.strip()
            if not line or line.startswith('---'):
                continue
            if line.startswith('- ') or line.startswith('• '):
                bullets.append(f"• {line[2:]}")
            elif line.startswith('### '):
                bullets.append(f"[bold white]{line[4:].upper()}[/]")
            elif line.startswith('**Query'):
                bullets.append(f"[cyan]{line}[/]")
        
        segments.append({
            "id": len(segments) + 1,
            "title": title,
            "duration": duration,
            "bullets": bullets
        })
        
    return segments

if __name__ == "__main__":
    # Use the FINAL 3-pillar bullets as the source of truth
    guide_path = "../../docs/FINAL-3-PILLAR-BULLETS.md"
    script_data = parse_bullets(guide_path)
    
    if script_data:
        # Save to the local directory
        with open("script_data.json", "w") as f:
            json.dump(script_data, f, indent=4)
        print(f"Successfully ingested {len(script_data)} segments from {guide_path}")
    else:
        print("Failed to ingest bullets.")

import os

def parse_bullets(filepath):
    if not os.path.exists(filepath):
        print(f"Error: {filepath} not found.")
        return None

    with open(filepath, 'r') as f:
        content = f.read()

    # Define our target segments based on ## SEGMENT headers
    segments = []
    segment_blocks = re.split(r"## SEGMENT ", content)
    
    for block in segment_blocks[1:]: # Skip preamble
        lines = block.strip().split('\n')
        header = lines[0]
        
        # Extract title and duration
        # Format: 1: HOOK (30 seconds)
        duration_match = re.search(r"\((.*?) seconds?\)", header)
        duration = int(duration_match.group(1)) if duration_match else 60
            
        title = header.split('(')[0].split(':')[-1].strip()
        
        # Extract bullets and sub-sections
        bullets = []
        for line in lines[1:]:
            line = line.strip()
            if not line or line.startswith('---'):
                continue
            if line.startswith('- ') or line.startswith('• '):
                bullets.append(f"• {line[2:]}")
            elif line.startswith('### '):
                bullets.append(f"[bold white]{line[4:].upper()}[/]")
            elif line.startswith('**Query'):
                bullets.append(f"[cyan]{line}[/]")
        
        segments.append({
            "id": len(segments) + 1,
            "title": title,
            "duration": duration,
            "bullets": bullets
        })
        
    return segments

if __name__ == "__main__":
    # Use the FINAL 3-pillar bullets as the source of truth
    guide_path = "../../docs/FINAL-3-PILLAR-BULLETS.md"
    script_data = parse_bullets(guide_path)
    
    if script_data:
        # Save to the local directory
        with open("script_data.json", "w") as f:
            json.dump(script_data, f, indent=4)
        print(f"Successfully ingested {len(script_data)} segments from {guide_path}")
    else:
        print("Failed to ingest bullets.")
