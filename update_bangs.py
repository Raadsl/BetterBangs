import json
import requests

# Fetch data from duckduckgo.com/bang.js
response = requests.get('https://duckduckgo.com/bang.js')
ddgbangs_data = response.json()

# Transform each entry to bangs.json format
bangs_data = [
    {
        "bang": f"!{entry['t']}",
        "title": entry['s'],
        "url": entry['u']
    }
    for entry in ddgbangs_data
]


# Write the updated data back to bangs.json
with open('bangs.json', 'w', encoding='utf-8') as bangs_file:
    json.dump(bangs_data, bangs_file, indent=2)

print('bangs.json has been updated successfully.')