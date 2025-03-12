import csv
import subprocess
from datetime import datetime, timedelta
import calendar
import pandas as pd
import os
import http.server
import socketserver
import webbrowser
import threading

repo_path = "/Users/mhussain/src/ZT-trustedpath/"
# GitHub repository URL - adjust this to your actual GitHub repository URL
github_repo_url = "https://github.com/cisco-sbg/ZT-trustedpath/"

def get_git_log_for_author(author_email, start_date):
    """
    Get git log for specific author since start_date
    """
    try:
        startdt = start_date.strftime("%Y-%m-%d")

        cmd = [
            'git',
            f'--work-tree={repo_path}'
            'log',
            f'--author={author_email}',
            f'--since={start_date.strftime("%Y-%m-%d")}',
            '--format=%aI'  # ISO 8601-like format
        ]
        """

        "git  log --author kfox@duosecurity.com --since 2024-02-27 --format=%aI"
        cmd = [
            'ls', '-l',
        ]
        """
        result = subprocess.run(f'git  log --author {author_email} --since {start_date.strftime("%Y-%m-%d")} --format=%aI',
            capture_output=True,
            text=True,
            shell=True,
            cwd=repo_path)
        resultStr = result.stdout.strip().split('\n')
        #print(f"gitlog output for {author_email} since {startdt} Ouput {resultStr} {result.stdout.strip()} cwd={repo_path}")
        return resultStr
    except Exception as e:
        print(f"Error getting git log for {author_email}: {e}")
        return []

def get_commit_descriptions_for_author(author_email, start_date):
    """
    Get commit descriptions and hashes for specific author since start_date
    """
    try:
        result = subprocess.run(
            f'git log --author {author_email} --since {start_date.strftime("%Y-%m-%d")} --format="%s | %h"',
            capture_output=True,
            text=True,
            shell=True,
            cwd=repo_path
        )
        return result.stdout.strip().split('\n')
    except Exception as e:
        print(f"Error getting commit descriptions for {author_email}: {e}")
        return []

def count_commits_per_month(commit_dates):
    """
    Count commits per month from list of commit dates
    """
    monthly_counts = {}
    for date_str in commit_dates:
        if date_str:  # Skip empty strings
            try:
                commit_date = datetime.fromisoformat(date_str.strip())
                month_key = commit_date.strftime("%Y-%m")
                monthly_counts[month_key] = monthly_counts.get(month_key, 0) + 1
            except ValueError:
                continue
    return monthly_counts

def generate_month_columns(end_date):
    """
    Generate list of month columns for last 12 months
    """
    months = []
    for i in range(11, -1, -1):
        date = end_date - timedelta(days=i*30)
        months.append(date.strftime("%Y-%m"))
    return months

def save_commit_descriptions(developer_name, commit_descriptions):
    """
    Save commit descriptions to a file in commit-descriptions folder
    with GitHub links for each commit
    """
    # Create folder if it doesn't exist
    folder_path = "commit-descriptions"
    if not os.path.exists(folder_path):
        os.makedirs(folder_path)

    # Create file name from developer name
    # Replace spaces and special characters with underscores
    safe_name = "".join(c if c.isalnum() else "_" for c in developer_name)
    file_name = f"{safe_name}_commit_history.txt"
    file_path = os.path.join(folder_path, file_name)

    # Write commit descriptions to file
    with open(file_path, 'w') as f:
        for desc in commit_descriptions:
            if desc:  # Skip empty lines
                # Split the description and hash
                parts = desc.split(" | ")
                if len(parts) == 2:
                    description, commit_hash = parts
                    # Create GitHub commit URL
                    github_url = f"{github_repo_url}/commit/{commit_hash}"
                    # Write the description, hash, and GitHub link
                    f.write(f"{description} | {commit_hash} | {github_url}\n")
                else:
                    # If format is unexpected, write the original line
                    f.write(f"{desc}\n")

    return file_path

def process_git_logs(input_file, output_file):
    # Read input CSV
    df = pd.read_csv(input_file)

    # Get current date and date 12 months ago
    end_date = datetime.now()
    start_date = end_date - timedelta(days=365)

    # Generate month columns
    month_columns = generate_month_columns(end_date)

    # Initialize results list
    results = []

    # Process each developer
    for _, row in df.iterrows():
        developer_name = row['Developer Name']
        developer_email = row['Developer']  # This is the email column
        grade = row['Grade']
        team = row['Team']
        print(f"Processing developer: {developer_name}")

        # Get git log for developer
        commit_dates = get_git_log_for_author(developer_email, start_date)
        #print(f"Commit dates: {commit_dates}")
        monthly_commits = count_commits_per_month(commit_dates)

        # Get commit descriptions and save to file
        commit_descriptions = get_commit_descriptions_for_author(developer_email, start_date)
        if commit_descriptions and commit_descriptions[0]:  # Check if there are any commits
            file_path = save_commit_descriptions(developer_name, commit_descriptions)
            print(f"Saved commit descriptions to {file_path}")

        # Create result row
        result_row = {
            'Developer Name': developer_name,
            'Developer': developer_email,
            'Grade': grade,
            'Team': team
        }

        # Add monthly commit counts
        for month in month_columns:
            result_row[month] = monthly_commits.get(month, 0)

        results.append(result_row)

    # Create output DataFrame
    output_df = pd.DataFrame(results)

    # Reorder columns
    columns = ['Developer Name', 'Developer', 'Grade', 'Team'] + month_columns
    output_df = output_df[columns]

    # Save to CSV
    output_df.to_csv(output_file, index=False)
    print(f"Results saved to {output_file}")

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Handle API requests for commit descriptions
        if self.path.startswith('/api/commit-descriptions/'):
            # Extract filename from path
            filename = self.path.split('/api/commit-descriptions/')[1]
            filepath = os.path.join('commit-descriptions', filename)

            if os.path.exists(filepath):
                self.send_response(200)
                self.send_header('Content-type', 'text/plain')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()

                with open(filepath, 'rb') as file:
                    self.wfile.write(file.read())
            else:
                self.send_response(404)
                self.send_header('Content-type', 'text/plain')
                self.end_headers()
                self.wfile.write(b'File not found')
            return

        # For all other requests, use the default handler
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

def start_webserver(port=8000):
    """Start a web server to serve the visualization files"""
    handler = CustomHTTPRequestHandler

    try:
        with socketserver.TCPServer(("", port), handler) as httpd:
            print(f"Serving at http://localhost:{port}")
            print(f"Open http://localhost:{port}/eng-stats-visualizer.html in your browser")

            # Open the browser automatically
            webbrowser.open(f'http://localhost:{port}/eng-stats-visualizer.html')

            # Start the server
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped by user.")
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"Port {port} is already in use. Trying another port.")
            start_webserver(port + 1)
        else:
            raise

if __name__ == "__main__":
    import argparse

    # Setup argument parser
    parser = argparse.ArgumentParser(description="Process git logs and visualize commit history")
    parser.add_argument("--repo-path", default=repo_path, help="Path to the git repository")
    parser.add_argument("--input", default="input.csv", help="Input CSV file with developer information")
    parser.add_argument("--output", default="git_commit_history.csv", help="Output CSV file for commit history")

    args = parser.parse_args()

    # Update repo_path if provided via command line
    if args.repo_path != repo_path:
        repo_path = args.repo_path

    # Process git logs with provided or default files
    process_git_logs(args.input, args.output)

    # Start web server in the main thread
    start_webserver()
