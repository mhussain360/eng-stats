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

# Create config.ini with repo path
echo "\nCreating config file..."
cat > config.ini << EOL
[DEFAULT]
repo_path = ${REPO_PATH:-"."}
EOL

# Check if pyenv is installed and set Python version
if command -v pyenv 1>/dev/null 2>&1; then
    echo "\nConfiguring Python environment..."
    eval "$(pyenv init -)"

    # Find latest Python 3.7 or higher version available
    PYTHON_VERSION=$(pyenv versions --bare | grep -E '^3\.[7-9]|^3\.[1-9][0-9]' | sort -V | tail -n1)
    if [[ -n "$PYTHON_VERSION" ]]; then
        echo "Setting Python version to $PYTHON_VERSION"
        pyenv shell "$PYTHON_VERSION"
    else
        echo "Error: Python 3.7 or higher not found in pyenv"
        echo "Please install using: pyenv install 3.7.0 (or higher)"
        exit 1
    fi
fi

# Verify Python is available
if ! command -v python3 >/dev/null 2>&1; then
    echo "Error: Python3 command not found"
    echo "Please ensure Python3 is properly installed"
    exit 1
fi

# Create and activate virtual environment
echo "\nCreating virtual environment..."
python3 -m venv venv
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

    # Build command based on presence of emails.txt
    CMD="python3 teamDetailsToInputCSV.py Team_detail.csv input.csv teamMappings.json"
    if [[ -f "emails.txt" ]]; then
        echo "Found emails.txt, using it for email mappings"
        CMD="$CMD --email-file emails.txt"
    else
        echo "No emails.txt found, proceeding without email mappings"
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

echo "\nSetup complete. Use run.sh to start the server."
deactivate
