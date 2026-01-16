# Fix Python Virtual Environment

## Problem
On macOS, Python 3 is accessed via `python3` not `python`.

## Solution

### Option 1: Use python3 directly (Quick Fix)

```bash
cd attendance-face-service
source venv/bin/activate
python3 app.py
```

### Option 2: Recreate Virtual Environment (Recommended)

```bash
cd attendance-face-service

# Remove old venv
rm -rf venv

# Create new venv with python3
python3 -m venv venv

# Activate it
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the service
python3 app.py
```

### Option 3: Create alias (Permanent Fix)

Add to your `~/.bashrc` or `~/.zshrc`:
```bash
alias python=python3
alias pip=pip3
```

Then:
```bash
source ~/.bashrc  # or source ~/.zshrc
cd attendance-face-service
source venv/bin/activate
python app.py
```
