import os

# --- Configuration ---
# '.' means it will search the folder the script is currently in.
DIRECTORY_TO_SEARCH = '.' 

# The exact strings to hunt down and their replacements
REPLACEMENTS = {
    "opentuwa.com": "opentuwa.com",
    "opentuwa.com": "opentuwa.com"
}

# Folders to skip so we don't break Git, dependencies, or compiled code
IGNORE_DIRS = {'.git', 'node_modules', '.next', 'venv', '__pycache__', 'dist', 'build'}

def nuke_old_domains(directory):
    files_changed = 0

    for root, dirs, files in os.walk(directory):
        # Tell os.walk to skip our ignored directories
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

        for file in files:
            # Skip the script itself so it doesn't rewrite its own code
            if file == "replace_domains.py":
                continue

            filepath = os.path.join(root, file)
            
            # Try reading the file as text
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                modified = False
                # Check for our old domains
                for old_domain, new_domain in REPLACEMENTS.items():
                    if old_domain in content:
                        content = content.replace(old_domain, new_domain)
                        modified = True
                        
                # If we made a change, write it back to the file
                if modified:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"✅ Updated: {filepath}")
                    files_changed += 1
                    
            except UnicodeDecodeError:
                # This just skips binary files (like images, fonts, PDFs) silently
                pass
            except Exception as e:
                print(f"⚠️ Error reading {filepath}: {e}")

    print(f"\nDone! Successfully updated {files_changed} files.")

if __name__ == "__main__":
    print("Starting the Ctrl+H Domain Genocide...\n")
    nuke_old_domains(DIRECTORY_TO_SEARCH)