#!/usr/bin/env python3
import os
import urllib.request
import urllib.error
import base64
import zlib

base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
puml_file = os.path.join(base_dir, 'docs', 'diagrams', 'usecase.puml')
output_dir = os.path.join(base_dir, 'docs', 'images')
os.makedirs(output_dir, exist_ok=True)

with open(puml_file, 'r', encoding='utf-8') as f:
    code = f.read()

# Encode using PlantUML compression
compressed = zlib.compress(code.encode('utf-8'), 9)
encoded = base64.b64encode(compressed).decode('utf-8').replace('\n', '')

# Try multiple endpoints
urls = [
    f"https://www.plantuml.com/plantuml/png/{encoded}",
    f"http://www.plantuml.com/plantuml/png/{encoded}",
]

output_path = os.path.join(output_dir, 'usecase.png')

for url in urls:
    try:
        print(f"Generating diagram from PlantUML...")
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=30) as response:
            with open(output_path, 'wb') as f:
                f.write(response.read())
        print(f"✓ Saved to {output_path}")
        exit(0)
    except Exception as e:
        print(f"✗ Failed: {e}")
        continue

print("✗ All attempts failed")
