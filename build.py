import os
import shutil

print("Building BetterBangs extension for Chrome and Firefox...")

# Create build directories
def clean_and_create_dir(path):
    if os.path.exists(path):
        shutil.rmtree(path)
    os.makedirs(path)

clean_and_create_dir('dist-chrome')
clean_and_create_dir('dist-firefox')

# Shared files to copy
FILES = [
    'popup.html',
    'popup.css',
    'popup.js',
    'content.js',
    'bangs.json',
    'icons',
    'LICENSE',
    'README.md'
]

# Copy common files to both directories
def copy_common_files():
    print("Copying common files...")
    for file in FILES:
        if os.path.isdir(file):
            shutil.copytree(file, os.path.join('dist-chrome', file))
            shutil.copytree(file, os.path.join('dist-firefox', file))
        else:
            shutil.copy2(file, 'dist-chrome')
            shutil.copy2(file, 'dist-firefox')

copy_common_files()

# Copy Chrome-specific files
print("Setting up Chrome build...")
shutil.copy2('manifest.json', 'dist-chrome')
shutil.copy2('background.js', 'dist-chrome')

# Copy Firefox-specific files
print("Setting up Firefox build...")
shutil.copy2('manifest-firefox.json', os.path.join('dist-firefox', 'manifest.json'))
shutil.copy2('background-firefox.js', os.path.join('dist-firefox', 'background.js'))

print("Build complete!")
print("Chrome build: dist-chrome/")
print("Firefox build: dist-firefox/")
print("")
print("To test:")
print("Chrome: Load unpacked extension from dist-chrome/")
print("Firefox: Load temporary add-on from dist-firefox/manifest.json")
