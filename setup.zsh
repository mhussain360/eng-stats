#!/bin/zsh

# Parse command line arguments
REPO_PATH=""
while [[ $# -gt 0 ]]; do
    case $1 in
        --repo-path)
            REPO_PATH="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--repo-path /path/to/git/repo]"
            exit 1
            ;;
    esac
done

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

# Install required packages
echo "\nInstalling required packages..."
pip install pandas flask gitpython Pillow
if [[ $? -ne 0 ]]; then
    echo "Error: Failed to install required packages"
    deactivate
    exit 1
fi

# Process Team_detail.csv only if all required files are present
if [[ -f "teamMappings.json" && -f "Team_detail.csv" ]]; then
    echo "\nFound Team_detail.csv and teamMappings.json"
    echo "Processing Team_detail.csv to create input.csv..."

    # Build command based on presence of alldevs.txt
    CMD="python teamDetailsToInputCSV.py Team_detail.csv input.csv teamMappings.json"
    if [[ -f "alldevs.txt" ]]; then
        echo "Found alldevs.txt, using it for email mappings"
        CMD="$CMD --email-file alldevs.txt"
    else
        echo "No alldevs.txt found, proceeding without email mappings"
    fi

    # Execute the command
    eval $CMD

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

# Start the engstats server with optional repo path
echo "\nStarting engstats server..."
if [[ -n "$REPO_PATH" ]]; then
    echo "Using git repository at: $REPO_PATH"
    python engstats.py --repo-path "$REPO_PATH"
else
    echo "Using current directory as git repository"
    python engstats.py --repo-path "."
fi

if [[ $? -ne 0 ]]; then
    echo "Error: Failed to start engstats server"
    deactivate
    exit 1
fi
