# Engineering Activity Dashboard

This tool generates and displays statistics about developer contributions based on git commit history. It processes commit information from a repository, processes it into monthly statistics, and provides an interactive web dashboard for analysis.

## Prerequisites

- Python 3.6 or higher
- Git command-line tools installed and configured
- virtualenv installed
- Web browser (Chrome, Firefox, Safari, or Edge recommended)

## Installation & Setup

1. Clone or download this repository to your local machine.

2. Prepare the required files:
   - `teamMappings.json`: Team mapping configuration
   - `Team_detail.csv`: (Optional) Source data for generating input.csv
   - `input.csv`: (Required if Team_detail.csv is not provided)

3. Run the setup script:
```bash
chmod +x setup_engstats.zsh
./setup_engstats.zsh
```

The setup script will:
- Create and activate a Python virtual environment
- Install required dependencies (pandas, flask, gitpython)
- Process Team_detail.csv to create input.csv (if source files exist)
- Create necessary directories
- Start the engstats server

## Configuration Files

### teamMappings.json
Team mapping configuration file that defines how supervisors map to teams:
```json
{
    "supervisor name": "Team Name",
    "ian beals": "AEX",
    "rory scott": "Duo Directory"
    // ... additional mappings
}
```

### Team_detail.csv
Source data file containing employee details. Will be processed to create input.csv if present.

### input.csv
Required CSV file with the following columns:
```csv
Developer Name,Developer,Grade,Team
John Doe,john.doe@example.com,Senior,Frontend
Jane Smith,jane.smith@example.com,Principal,Backend
```

## Features

- Monthly commit statistics visualization
- Team and individual activity analysis
- Multiple chart types (line, bar, radar, polar area)
- Filterable data table
- Developer comparison with various metrics
- Detailed commit history viewer
- Commit description search functionality
- Web-based dashboard interface

## Usage

1. Ensure all required files are in place.

2. Run the setup script:
```bash
./setup_engstats.zsh
```

3. Access the dashboard in your web browser at:
```
http://127.0.0.1:5000
```

4. Use the dashboard to:
- Filter developers by name, grade, or team
- View performance trends over time
- Compare developer contributions
- View detailed commit history

## Directory Structure

```
.
├── data/
│   ├── uploads/       # Uploaded files
│   └── processed/     # Processed statistics
├── static/            # Static web assets
├── teamMappings.json  # Team mapping configuration
├── Team_detail.csv    # (Optional) Source data
├── input.csv          # Processed input data
├── engstats.py        # Main server script
└── setup_engstats.zsh # Setup script
```

## Troubleshooting

### Common Issues

1. **Setup script fails**
- Verify Python and virtualenv are installed
- Check if required files exist in the correct location
- Ensure you have write permissions in the current directory

2. **Server fails to start**
- Check if port 5000 is available
- Verify input.csv exists or can be generated
- Check Python dependencies are installed correctly

3. **No data appears in dashboard**
- Verify input.csv format is correct
- Check server logs for processing errors
- Ensure git repository is accessible

### Logs and Debugging

The setup script provides detailed output about:
- Virtual environment creation
- Package installation
- File processing status
- Server startup
