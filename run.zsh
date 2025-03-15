#!/bin/zsh

# Parse command line arguments
INPUT_CSV=""
OUTPUT_FILE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --input-csv)
            INPUT_CSV="$2"
            shift 2
            ;;
        --output-file)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--input-csv path/to/input.csv] [--output-file path/to/output.txt]"
            exit 1
            ;;
    esac
done

# Check if config.ini exists
if [[ ! -f "config.ini" ]]; then
    echo "Error: config.ini not found"
    echo "Please run setup.zsh first"
    exit 1
fi

# Read repo path from config.ini using zsh read
REPO_PATH=$(grep "repo_path" config.ini | cut -d'=' -f2 | tr -d ' ')
if [[ -z "$REPO_PATH" ]]; then
    echo "Error: repo_path not found in config.ini"
    exit 1
fi

# Activate virtual environment
source venv/bin/activate
if [[ $? -ne 0 ]]; then
    echo "Error: Failed to activate virtual environment"
    echo "Please run setup.zsh first"
    exit 1
fi

# Build command with all optional parameters
CMD="python engstats.py --repo-path ${(q)REPO_PATH}"

if [[ -n "$INPUT_CSV" ]]; then
    CMD="${CMD} --input-csv ${(q)INPUT_CSV}"
fi

if [[ -n "$OUTPUT_FILE" ]]; then
    CMD="${CMD} --output-file ${(q)OUTPUT_FILE}"
fi

# Start the engstats server
echo "Starting engstats server..."
echo "Using git repository at: $REPO_PATH"
eval $CMD

if [[ $? -ne 0 ]]; then
    echo "Error: Failed to start engstats server"
    deactivate
    exit 1
fi
