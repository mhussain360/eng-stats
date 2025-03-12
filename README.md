# Developer Activity Statistics
=======
# Engineering Activity Dashboard

This tool generates and displays statistics about developer contributions based on git commit history. It parses commit information from a repository, processes it into monthly statistics, and provides an interactive web dashboard for analysis.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Input Format](#input-format)
- [Features](#features)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Python 3.6 or higher
- Git command-line tools installed and configured
- Web browser (Chrome, Firefox, Safari, or Edge recommended)

## Installation

1. Clone or download this repository to your local machine.

2. Install the required Python dependencies:

```bash
pip install pandas
```

This project has minimal dependencies as it primarily uses Python standard library modules.

## Usage

1. Prepare an input CSV file named `input.csv` with the following columns:
   - Developer Name: Full name of the developer
   - Developer: Email address used for git commits
   - Grade: Developer grade/level (optional)
   - Team: Team name (optional)

2. Run the script:
   ```bash
   python engstats.py --repo-path /path/to/repo --input devs.csv
   ```

3. The script will:
   - Process git commit history for each developer
   - Generate a CSV file with commit statistics per month
   - Save individual commit descriptions in the `commit-descriptions` folder
   - Start a web server and open the visualization dashboard in your browser

4. The dashboard will automatically load and display the generated data. You can:
   - Filter developers by name, grade, or team
   - View performance trends over time
   - Compare developer contributions
   - View detailed commit history for each developer

## Input Format

The `input.csv` file should be formatted as follows:

```
Developer Name,Developer,Grade,Team
John Doe,john.doe@example.com,Senior,Frontend
Jane Smith,jane.smith@example.com,Principal,Backend
```

## Features

- Monthly commit statistics visualization
- Team and individual developer performance analysis
- Multiple chart types (line, bar, radar, polar area)
- Filterable data table
- Developer comparison with various metrics
- Detailed commit history viewer with links to GitHub commits
- Commit description search functionality
- Automatic web server for viewing the dashboard

## Troubleshooting

### Common Issues

1. **Git command not found**
   - Ensure Git is installed and available in your system PATH
   - Try running `git --version` to verify

2. **No commit data for developers**
   - Check that the email addresses in your input file match those used for git commits
   - Verify the repository path is correct
   - Ensure the git history contains commits within the last year

3. **Web server fails to start**
   - Check if the port 8000 is already in use
   - The script will automatically try other ports if 8000 is unavailable

4. **Loading spinner never disappears in commit modal**
   - Check browser console for any CORS or network errors
   - Verify the commit description files were generated correctly in the `commit-descriptions` folder

5. **Content Security Policy blocks resources**
   - The HTML file includes a CSP that allows connections to necessary resources
   - If you're hosting the dashboard on a different server, you may need to adjust the CSP

### Browser Compatibility

The dashboard has been tested with:
- Google Chrome (recommended)
- Mozilla Firefox
- Microsoft Edge
- Safari

For best performance and compatibility, use the latest version of your browser.

### Reporting Issues

If you encounter any other problems, please provide:
- Error messages
- Operating system details
- Python version (`python --version`)
- Git version (`git --version`)
- Browser and version information
