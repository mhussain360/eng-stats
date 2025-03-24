'''
usage: teamDetailsToInputCSV.py [-h] input_file output_file teamp_mapping_file --email-file email_mappings.txt

Process HR data CSV to team structure CSV

positional arguments:
  input_file    Path to input CSV file
  output_file   Path to output CSV file
  mapping_file  Path to team mappings JSON file

optional arguments:
  -h, --help    show this help message and exit

The script will:
1. Load and validate the team mappings from JSON
2. Validate the input file exists
3. Check for required columns
4. Process the CSV according to the mapping rules
5. Generate the output file
6. Display a summary of team distribution

Example team_mappings.json with comments (remove comments in actual file):
{
    "supervisor name in all lower case": "<Team Name>",
}
'''
import csv
import json
import re
from pathlib import Path
import argparse
from typing import Dict, Optional, List, Tuple

from pandas.core.internals.blocks import NA

# Define email domain precedence
EMAIL_DOMAIN_PRECEDENCE = [
    "github.com",
    "duosecurity.com",
    "duo.com"
]

def load_team_mappings(mapping_file: Path) -> dict:
    """Load team mappings from a JSON configuration file."""
    if not mapping_file.exists():
        raise FileNotFoundError(f"Team mapping file not found: {mapping_file}")

    try:
        with mapping_file.open('r', encoding='utf-8-sig') as f:
            mappings = json.load(f)

        if not isinstance(mappings, dict):
            raise ValueError("Team mappings must be a dictionary")

        return {k.lower(): v for k, v in mappings.items()}

    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON in mapping file: {e}")

def get_email_precedence(email: str) -> int:
    """Get precedence value for email domain (lower is better)."""
    email = email.lower()
    for i, domain in enumerate(EMAIL_DOMAIN_PRECEDENCE):
        if domain in email:
            return i
    return len(EMAIL_DOMAIN_PRECEDENCE)  # Lower precedence for other domains

def get_author_email_from_git(config_path: Path) -> Dict[str, List[str]]:
    """Get author emails from git log using repository path in config."""
    import configparser
    import subprocess

    email_mappings: Dict[str, List[str]] = {}

    # Regular expression to parse "name <email>" format
    email_pattern = re.compile(r'^(.*?)\s*<(.+?)>$')

    # Get repo path from config.ini
    config = configparser.ConfigParser()
    config.read(config_path)
    repo_path = config.get('DEFAULT', 'repo_path', fallback='.')

    # Get unique author name/email pairs from git log
    result = subprocess.run(
        ['git', 'log', '--format=%aN <%aE>'],
        capture_output=True,
        text=True,
        cwd=repo_path
    )

    for line in result.stdout.splitlines():
        line = line.strip()
        if not line:
            continue

        match = email_pattern.match(line)
        if match:
            name = match.group(1).strip().lower()
            email = match.group(2).strip()

            if name not in email_mappings:
                email_mappings[name] = []
            if email not in email_mappings[name]:
                email_mappings[name].append(email)

    # Sort emails for each name by domain precedence
    for name in email_mappings:
        email_mappings[name].sort(key=get_email_precedence)

    return email_mappings

def determine_team(supervisor: str, team_mappings: dict) -> str:
    """Determine team based on supervisor name using provided mappings."""
    supervisor = supervisor.lower()

    for supervisor_pattern, team in team_mappings.items():
        if supervisor_pattern.lower() in supervisor:
            return team

    return "Unknown"

def get_email_address(name: str, row_email: str, email_mappings: Optional[Dict[str, List[str]]]) -> Tuple[str, Optional[str]]:
    """Get email address from mappings if available, otherwise use the one from CSV.
    Returns tuple of (email_to_use, original_matched_email)"""
    if email_mappings is None:
        return row_email, None

    normalized_name = name.lower()
    if normalized_name in email_mappings and email_mappings[normalized_name]:
        # Return highest precedence email (first in sorted list)
        matched_email = email_mappings[normalized_name][0]
        return matched_email, matched_email

    return row_email, None

def process_csv(input_file: Path, output_file: Path, mapping_file: Path) -> None:
    """Process input CSV and generate output CSV with mapped fields."""
    if not input_file.exists():
        raise FileNotFoundError(f"Input file not found: {input_file}")

    # Load team mappings
    team_mappings = load_team_mappings(mapping_file)

    # Load email mappings if provided
    email_mappings = None
    email_mappings = get_author_email_from_git(Path("./config.ini"))
    print(f"Loaded {len(email_mappings)} unique developer names with email mappings")

    output_data = []
    email_updates: List[Tuple[str, str, str, Optional[List[str]]]] = []  # Track email updates for reporting

    # Read input CSV
    with input_file.open('r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)

        if reader.fieldnames is None:
            raise ValueError("CSV file is empty or has no headers")

        required_columns = {'Worker', 'Email', 'Job Level - Primary Position', 'Supervisor'}
        missing_columns = required_columns - set(reader.fieldnames)
        if missing_columns:
            raise ValueError(f"Missing required columns in input CSV: {missing_columns}")

        for row in reader:
            original_email = row['Email']
            developer_name = row['Worker']

            # Get potentially updated email
            email, matched_email = get_email_address(developer_name, original_email, email_mappings)

            # Track if email was updated
            if email != original_email:
                all_available_emails = email_mappings.get(developer_name.lower(), []) if email_mappings else None
                email_updates.append((developer_name, original_email, email, all_available_emails))

            output_row = {
                'Developer Name': developer_name,
                'Developer': email,
                'Grade': row['Job Level - Primary Position'],
                'Team': determine_team(row['Supervisor'], team_mappings)
            }
            output_data.append(output_row)

    # Write output CSV
    with output_file.open('w', newline='', encoding='utf-8') as f:
        fieldnames = ['Developer Name', 'Developer', 'Grade', 'Team']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(output_data)

    # Report email updates
    if email_updates:
        print("\nEmail updates made:")
        for name, old_email, new_email, available_emails in email_updates:
            print(f"\n{name}:")
            print(f"  Old: {old_email}")
            print(f"  New: {new_email}")
            if available_emails:
                print("  Available emails (in precedence order):")
                for email in available_emails:
                    print(f"    - {email}")
        print(f"\nTotal email updates: {len(email_updates)}")

def main():
    parser = argparse.ArgumentParser(description='Process HR data CSV to team structure CSV')
    parser.add_argument('input_file', type=str, help='Path to input CSV file')
    parser.add_argument('output_file', type=str, help='Path to output CSV file')
    parser.add_argument('mapping_file', type=str, help='Path to team mappings JSON file')

    args = parser.parse_args()

    input_path = Path(args.input_file)
    output_path = Path(args.output_file)
    mapping_path = Path(args.mapping_file)

    try:
        process_csv(input_path, output_path, mapping_path)
        print(f"\nSuccessfully processed CSV. Output written to {output_path}")

        # Print summary of teams
        with output_path.open('r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            team_counts = {}
            for row in reader:
                team = row['Team']
                team_counts[team] = team_counts.get(team, 0) + 1

        print("\nTeam distribution:")
        for team, count in sorted(team_counts.items()):
            print(f"{team}: {count} developers")

    except Exception as e:
        print(f"Error processing CSV: {e}")
        exit(1)

if __name__ == "__main__":
    main()
