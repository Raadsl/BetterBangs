import json
import requests
from datetime import datetime

# Fetch data from duckduckgo.com/bang.js
response = requests.get('https://duckduckgo.com/bang.js')
ddgbangs_data = response.json()

# Transform each entry to bangs.json format
bangs_data = [
    {
        "b": f"!{entry['t']}",
        "t": entry['s'],
        "u": entry['u']
    }
    for entry in ddgbangs_data
]

# Add the last updated timestamp
data_with_timestamp = {
    "last_updated": datetime.now().isoformat(),
    "total_bangs": len(bangs_data),
    "bangs": bangs_data
}

# Write the updated data back to bangs.json
with open('bangs.json', 'w', encoding='utf-8') as bangs_file:
    json.dump(data_with_timestamp, bangs_file, indent=2)

print('bangs.json has been updated successfully.')