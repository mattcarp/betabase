#!/bin/bash
# Le Prompt-O-Matic Runner

# Always update script data from the markdown guide
echo "Ingesting latest script from CAPCUT-DEMO-GUIDE.md..."
python3 data_loader.py

# Check for virtual environment
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate venv and install requirements
source venv/bin/activate
echo "Installing/Updating dependencies..."
pip install -r requirements.txt -q

# Run the app
echo "Lancement du Mattie's Promptomatic... Prêt?"
python3 prompter.py



# Always update script data from the markdown guide
echo "Ingesting latest script from CAPCUT-DEMO-GUIDE.md..."
python3 data_loader.py

# Check for virtual environment
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate venv and install requirements
source venv/bin/activate
echo "Installing/Updating dependencies..."
pip install -r requirements.txt -q

# Run the app
echo "Lancement du Mattie's Promptomatic... Prêt?"
python3 prompter.py

