import json
import os

def test_data_ingestion():
    print("Testing data ingestion...")
    # Run data loader
    os.system("python3 data_loader.py")
    
    # Check if file exists
    if not os.path.exists("script_data.json"):
        print("FAILED: script_data.json not created")
        return False
        
    with open("script_data.json", "r") as f:
        data = json.load(f)
        
    # Check scene count
    if len(data) != 6:
        print(f"FAILED: Expected 6 scenes, got {len(data)}")
        return False
        
    # Check a specific scene
    scene2 = data[1]
    if "Chat Pillar" not in scene2["title"]:
        print(f"FAILED: Scene 2 title incorrect: {scene2['title']}")
        return False
        
    if scene2["duration"] != 60:
        print(f"FAILED: Scene 2 duration incorrect: {scene2['duration']}")
        return False
        
    print("PASSED: Data ingestion test successful!")
    return True

if __name__ == "__main__":
    test_data_ingestion()




