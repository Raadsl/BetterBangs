import json
import requests
import re
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

# Add the first result bang
bangs_data.insert(0, {
    "b": "!",
    "t": "First Result",
    "u": "FIRST_RESULT_SPECIAL:{{{s}}}"
})

# Add the last updated timestamp
data_with_timestamp = {
    "last_updated": datetime.now().isoformat(),
    "total_bangs": len(bangs_data),
    "bangs": bangs_data
}

# Write the updated data back to bangs.json
with open('bangs.json', 'w', encoding='utf-8') as bangs_file:
    json.dump(data_with_timestamp, bangs_file, indent=2)

# Update the README.md file with the current date
current_date = datetime.now().strftime('%d-%m-%Y') # dd-mm-yyyy format
try:
    with open('README.md', 'r', encoding='utf-8') as readme_file:
        readme_content = readme_file.read()
    
    # Replace the date in the README
    updated_readme = re.sub(
        r'The last time the Bangs-list was updated was on `\d{2}-\d{2}-\d{4}`\.',
        f'The last time the Bangs-list was updated was on `{current_date}`.',
        readme_content
    )
    
    with open('README.md', 'w', encoding='utf-8') as readme_file:
        readme_file.write(updated_readme)
    
    print(f'README.md updated with date: {current_date}')
except FileNotFoundError:
    print('README.md not found, skipping date update.')
except Exception as e:
    print(f'Error updating README.md: {e}')

print('bangs.json has been updated successfully.')