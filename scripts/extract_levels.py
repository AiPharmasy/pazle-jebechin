#!/usr/bin/env python3
"""Extract 15 Microban levels with progressive difficulty."""
import json, re

with open('/home/z/my-project/scripts/microban.json') as f:
    data = json.load(f)

html = data['data']['html']

# Find <pre class="sokFont">...</pre>
m = re.search(r'<pre class="sokFont">(.*?)</pre>', html, re.DOTALL)
if not m:
    print("No pre tag found")
    exit(1)

content = m.group(1)
# Unescape HTML entities
content = content.replace('&lt;', '<').replace('&gt;', '>').replace('&amp;', '&').replace('&quot;', '"')

# Split into levels. Each level starts with "Level N" or "'name'" line
levels = []
current_lines = []
current_name = None

for line in content.split('\n'):
    # Match "Level N" or "'name'"
    if re.match(r"^Level \d+\s*$", line) or re.match(r"^'[^']*'$", line.strip()):
        if current_lines:
            levels.append((current_name, current_lines))
        current_name = line.strip()
        current_lines = []
    else:
        current_lines.append(line)

if current_lines:
    levels.append((current_name, current_lines))

# Clean up: remove leading/trailing empty lines from each level
cleaned_levels = []
for name, lines in levels:
    # Strip leading/trailing empty lines
    while lines and not lines[0].strip():
        lines.pop(0)
    while lines and not lines[-1].strip():
        lines.pop()
    if lines:
        cleaned_levels.append((name, lines))

# Selected level numbers (progressive difficulty)
selected = [1, 2, 3, 5, 7, 9, 11, 14, 18, 23, 30, 33, 36, 50, 60]

print(f"Total levels parsed: {len(cleaned_levels)}")
print()

# Print selected levels
for num in selected:
    if num <= len(cleaned_levels):
        name, lines = cleaned_levels[num - 1]
        print(f"=== {name} ===")
        for line in lines:
            print(line)
        print()
