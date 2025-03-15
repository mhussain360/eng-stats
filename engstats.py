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
import json
import tempfile
import sys
import traceback
import cgi
import io
import re

repo_path = "."
# GitHub repository URL - adjust this to your actual GitHub repository URL
github_repo_url = "" #"https://github.com/cisco-sbg/ZT-trustedpath/"

def get_git_log_for_author(author_email, start_date):
    """
    Get git log for specific author since start_date
    """
    try:
        startdt = start_date.strftime("%Y-%m-%d")
        result = subprocess.run(['git', 'log', '--author', author_email, '--since', start_date.strftime("%Y-%m-%d"), '--format=%aI'],
            capture_output=True,
            text=True,
            shell=False,
            cwd=repo_path)
        resultStr = result.stdout.strip().split('\n')
        return resultStr
    except Exception as e:
        print(f"Error getting git log for {author_email}: {e}")
        return []

def get_commit_descriptions_for_author(author_email, start_date):
    """
    Get commit descriptions and hashes for specific author since start_date
    """
    try:
        result = subprocess.run(['git', 'log', '--date=short', '--author', author_email, '--since', start_date.strftime("%Y-%m-%d"), '--format=%cd | %s | %h'],
            capture_output=True,
            text=True,
            shell=False,
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
                if len(parts) == 3:
                    commit_date, description, commit_hash = parts
                    # Create GitHub commit URL
                    github_url = f"{github_repo_url}/commit/{commit_hash}"
                    # Write the description, hash, and GitHub link
                    f.write(f"{commit_date} | {description} | {commit_hash} | {github_url}\n")
                else:
                    # If format is unexpected, write the original line
                    f.write(f"{desc}\n")

    return file_path

def process_git_logs(input_file, output_file):
    """
    Process git logs for developers in input_file and write results to output_file
    Returns True if successful, False otherwise
    """
    try:
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
        return True
    except Exception as e:
        print(f"Error processing git logs: {e}")
        traceback.print_exc()
        return False

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def serve_file(self, path, filename, content_type=None):
        """Serve a file with appropriate headers based on file type"""
        self.path = path

        # First send the response
        self.send_response(200)

        # Determine content type based on file extension if not provided
        if content_type is None:
            if filename.endswith('.html'):
                content_type = 'text/html'
            elif filename.endswith('.js'):
                content_type = 'application/javascript'
            elif filename.endswith('.css'):
                content_type = 'text/css'
            else:
                content_type = 'application/octet-stream'

        self.send_header('Content-type', content_type)

        # Set no-cache headers for all files to ensure fresh content
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')

        # End headers and continue with GET request
        self.end_headers()

        # Serve the file
        file_path = os.path.join(os.getcwd(), filename)
        if os.path.exists(file_path):
            with open(file_path, 'rb') as file:
                self.wfile.write(file.read())
        else:
            print(f"Warning: File not found: {file_path}")
            return

    def do_GET(self):
        # Serve the visualizer as the default file
        if self.path == '/':
            self.serve_file('/index.html', 'index.html')
            return

        if self.path == '/eng-stats-visualizer.html':
            self.serve_file('/eng-stats-visualizer.html', 'eng-stats-visualizer.html')
            return

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

        # Handle API requests for the output CSV file
        elif self.path == '/api/stats':
            output_file = getattr(self.server, 'output_file', 'git_commit_history.csv')

            if os.path.exists(output_file):
                self.send_response(200)
                self.send_header('Content-type', 'text/csv')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Content-Disposition', f'attachment; filename="{os.path.basename(output_file)}"')
                self.end_headers()

                with open(output_file, 'rb') as file:
                    self.wfile.write(file.read())
            else:
                self.send_response(404)
                self.send_header('Content-type', 'text/plain')
                self.end_headers()
                self.wfile.write(b'Statistics file not found')
            return
        else:
            # For other requests, use the path as the filename
            requested_path = self.path[1:]  # Remove leading slash
            self.serve_file(self.path, requested_path)

    def do_POST(self):
        if self.path == '/api/upload':
            try:
                # Get content length
                content_length = int(self.headers['Content-Length'])

                # Parse form data
                form = cgi.FieldStorage(
                    fp=self.rfile,
                    headers=self.headers,
                    environ={'REQUEST_METHOD': 'POST',
                            'CONTENT_TYPE': self.headers['Content-Type']}
                )

                # Check if the file field exists
                if 'file' not in form:
                    self.send_response(400)
                    self.send_header('Content-type', 'text/plain')
                    self.end_headers()
                    self.wfile.write(b'No file uploaded')
                    return

                # Get the file item
                fileitem = form['file']

                # Check if it's an uploaded file
                if not fileitem.filename:
                    self.send_response(400)
                    self.send_header('Content-type', 'text/plain')
                    self.end_headers()
                    self.wfile.write(b'No file selected')
                    return

                # Create a temporary file to store the uploaded CSV
                with tempfile.NamedTemporaryFile(suffix='.csv', delete=False) as temp_file:
                    # Write the uploaded file to the temporary file
                    temp_file.write(fileitem.file.read())
                    temp_file_path = temp_file.name

                # Process the uploaded file
                output_file = getattr(self.server, 'output_file', 'git_commit_history.csv')
                success = process_git_logs(temp_file_path, output_file)

                # Remove temporary file
                try:
                    os.unlink(temp_file_path)
                except:
                    pass

                if success:
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        'success': True,
                        'message': 'File processed successfully'
                    }).encode())
                else:
                    self.send_response(500)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        'success': False,
                        'message': 'Error processing file'
                    }).encode())

            except Exception as e:
                print(f"Error handling upload: {e}")
                traceback.print_exc()
                self.send_response(500)
                self.send_header('Content-type', 'text/plain')
                self.end_headers()
                self.wfile.write(f"Error: {str(e)}".encode())

            return

        # For any other POST requests
        self.send_response(404)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        self.wfile.write(b'Not found')

def start_webserver(port=8000, output_file='git_commit_history.csv'):
    """Start a web server to serve the visualization files"""
    handler = CustomHTTPRequestHandler

    # Create a custom server class that can store additional attributes
    class CustomTCPServer(socketserver.TCPServer):
        def __init__(self, server_address, RequestHandlerClass, output_file=None):
            self.output_file = output_file
            self.allow_reuse_address = True  # Add this to avoid "address already in use" errors
            super().__init__(server_address, RequestHandlerClass)

    try:
        # Use our custom server class that supports the output_file attribute
        httpd = CustomTCPServer(("", port), handler, output_file=output_file)

        print(f"Serving at http://localhost:{port}")
        print(f"Open http://localhost:{port}/index.html in your browser")
        print(f"CSV data available at http://localhost:{port}/api/stats")

        # Open the browser automatically
        webbrowser.open(f'http://localhost:{port}/')

        # Start the server
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped by user.")
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"Port {port} is already in use. Trying another port.")
            start_webserver(port + 1, output_file)
        else:
            raise

def get_github_repo_url(repo_path):
    # Get remote URL
    remote_url = subprocess.check_output(['git', 'remote', 'get-url', 'origin'], cwd=repo_path).decode('utf-8').strip()


    # Convert SSH URL to HTTPS if needed
    # From: git@github.com:username/repo.git
    # To: https://github.com/username/repo
    if remote_url.count('@github.com:')>0:
        remote_url = re.sub(r'[^@]*@github.com:', 'https://github.com/', remote_url)

    # Remove .git suffix
    remote_url = remote_url.rstrip('.git')

    return remote_url

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

    github_repo_url = get_github_repo_url(repo_path)
    # Process git logs with provided or default files
    process_git_logs(args.input, args.output)

    # Start web server in the main thread
    start_webserver(output_file=args.output)
