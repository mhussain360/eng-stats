# Engineering Activity Dashboard

This tool generates and displays statistics about developer contributions based on git commit history. It processes commit information from a repository, processes it into monthly statistics, and provides an interactive web dashboard for analysis.

## Prerequisites

- Python 3.7 or higher
- pyenv installed
- Git command-line tools installed and configured
- **Your git project is cloned locally and is up to date with master branch**
- Web browser (Chrome, Firefox, Safari, or Edge recommended)

## Configuration Files

### teamMappings.json
Team mapping configuration file that defines how supervisors map to teams. Optional if input.csv is manually created:
```json
{
    "supervisor name": "Team Name",
    // ... additional mappings
}
```

### Team_detail.csv
This is a report from Workday called Team_Detail. Source data file containing employee details. Will be processed to create input.csv if present but optional if input.csv is manually created. Required columns:
- Worker: Employee's full name
- Email: Employee's email address. This email will be used if the program cannot get the email address from the git log.
- Job Level - Primary Position: Employee's grade level
- Supervisor: Employee's supervisor name

### input.csv
Required only if Team_detail.csv and teamMappings.json are not provided otherwise it is automatically generated. Make sure that the email address is the corect email address for this git repo for the developers:
```csv
Developer Name,Developer,Grade,Team
John Doe,john.doe@example.com,10,Frontend
Jane Smith,jane.smith@example.com,11,Backend
```

## Setup
1. unzip engstats.zip in a directory called eng-stats

2. Prepare the required files:
   - `input.csv`: (Required only if Team_detail.csv and teamMapping.json are not provided)
   - `teamMappings.json`: (Optional) Team mapping configuration
   - `Team_detail.csv`: (Optional) Source data for generating input.csv


3. Run the setup script:
```bash
chmod +x setup.zsh
./setup.zsh --repo-path /path/to/git/repo
```

The setup script will:
- Create and activate a Python virtual environment
- Install required dependencies (pandas)
- Process Team_detail.csv to create input.csv (if these files exist)
- Create necessary directories
- Store repository configuration

## Usage

1. Start the server which will generate the statistics upon start up and open a browser window to view the restuls:
```bash
./run.zsh
```

2. Use the dashboard to:
- Filter developers by name, grade, or team
- View contributions over time
- View multiple teams and developer contributions in one view
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
├── config.ini         # Server configuration
├── engstats.py       # Main server script
├── setup.zsh         # Setup script
└── run.zsh           # Server startup script
```

## Troubleshooting

### Common Issues

1. **Setup script fails**
- Verify Python and pyenv are installed
- Check if required files exist in the correct location
- Ensure you have write permissions in the current directory

2. **Server fails to start**
- Check if specified port is available
- Verify input.csv exists or can be generated
- Check Python dependencies are installed correctly

3. **No data appears in dashboard**
- Verify input.csv format is correct
- Verify that the email address for the developer is the correct email associated with that repo
- Check server logs for processing errors
- Ensure git repository path is correct

### Logs and Debugging

The setup and run scripts provide detailed output about:
- Virtual environment creation
- Package installation
- File processing status
- Server startup and configuration
