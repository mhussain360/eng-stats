#!/bin/zsh

echo "Setting up environment for engstats server..."

# Check if pyenv is installed and set Python version
if command -v pyenv 1>/dev/null 2>&1; then
    echo "\nConfiguring Python environment..."
    eval "$(pyenv init -)"

    # Check if Python 3.11.11 is available
    if pyenv versions | grep -q "3.11.11"; then
        echo "Setting Python version to 3.11.11"
        pyenv shell 3.11.11
    else
        echo "Error: Python 3.11.11 not found in pyenv"
        echo "Please install it using: pyenv install 3.11.11"
        exit 1
    fi
fi

# Verify Python is available
if ! command -v python >/dev/null 2>&1; then
    echo "Error: Python command not found"
    echo "Please ensure Python is properly installed"
    exit 1
fi

# Create and activate virtual environment
echo "\nCreating virtual environment..."
python -m venv venv
if [[ $? -ne 0 ]]; then
    echo "Error: Failed to create virtual environment"
    exit 1
fi

echo "Activating virtual environment..."
source venv/bin/activate
if [[ $? -ne 0 ]]; then
    echo "Error: Failed to activate virtual environment"
    exit 1
fi

# Rest of the script remains the same...
# Install required packages
echo "\nInstalling required packages..."
pip install pandas flask gitpython
if [[ $? -ne 0 ]]; then
    echo "Error: Failed to install required packages"
    deactivate
    exit 1
fi

# Process Team_detail.csv only if all required files are present
if [[ -f "teamMappings.json" && -f "Team_detail.csv" ]]; then
    echo "\nFound Team_detail.csv and teamMappings.json"
    echo "Processing Team_detail.csv to create input.csv..."
    python teamDetailsToInputCSV.py Team_detail.csv input.csv teamMappings.json
    if [[ $? -ne 0 ]]; then
        echo "Warning: Failed to process Team_detail.csv"
        echo "Continuing with existing input.csv if available..."
    else
        echo "Successfully created input.csv"
    fi
else
    echo "\nSkipping Team_detail.csv processing:"
    [[ ! -f "teamMappings.json" ]] && echo "- teamMappings.json not found"
    [[ ! -f "Team_detail.csv" ]] && echo "- Team_detail.csv not found"
    echo "Will proceed with existing input.csv if available"
fi

# Create required directories if they don't exist
echo "\nCreating required directories..."
mkdir -p data/uploads data/processed static

# Check if input.csv exists before starting server
if [[ ! -f "input.csv" ]]; then
    echo "\nWarning: input.csv not found. Server will start but may not function correctly until input.csv is provided."
fi

# Start the engstats server
echo "\nStarting engstats server..."
python engstats.py
if [[ $? -ne 0 ]]; then
    echo "Error: Failed to start engstats server"
    deactivate
    exit 1
fi

# Deactivate virtual environment on script exit
trap "echo '\nDeactivating virtual environment...'; deactivate" EXIT
