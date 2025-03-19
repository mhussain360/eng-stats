#!/usr/bin/env python3

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
import io
import re
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from urllib.parse import parse_qs
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class GitRepository:
    """Handle Git repository operations"""
    def __init__(self, repo_path: str):
        self.repo_path = Path(repo_path)
        self.github_repo_url = self._get_github_repo_url()

    def _get_github_repo_url(self) -> str:
        """Get GitHub repository URL from git remote"""
        try:
            remote_url = subprocess.check_output(
                ['git', 'remote', 'get-url', 'origin'],
                cwd=self.repo_path,
                text=True
            ).strip()

            # Convert SSH URL to HTTPS if needed
            if '@github.com:' in remote_url:
                remote_url = re.sub(r'[^@]*@github\.com:', 'https://github.com/', remote_url)

            # Remove .git suffix
            return remote_url.rstrip('.git')
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to get GitHub URL: {e}")
            return ""

    def get_commit_data(self, author_email: str, start_date: datetime) -> Tuple[List[str], List[str]]:
        """Get git log data for specific author since start_date"""
        try:
            result = subprocess.run(
                [
                    'git', 'log',
                    '--author', author_email,
                    '--since', start_date.strftime("%Y-%m-%d"),
                    '--format=%aI<=>%cd<=>%s<=>%h',
                    '--date=short'
                ],
                capture_output=True,
                text=True,
                check=True,
                cwd=self.repo_path
            )

            commit_dates = []
            commit_descriptions = []

            for line in result.stdout.strip().split('\n'):
                if line:
                    try:
                        iso_date, commit_date, subject, hash_val = line.split('<=>')
                        subject = subject.replace('|', r'\|')  # Escape pipe characters
                        commit_dates.append(iso_date)
                        commit_descriptions.append(f"{commit_date} | {subject} | {hash_val}")
                    except ValueError as e:
                        logger.warning(f"Error parsing git log line: {line}, Error: {e}")
                        continue

            return commit_dates, commit_descriptions

        except subprocess.CalledProcessError as e:
            logger.error(f"Git log error for {author_email}: {e}")
            return [], []

class CommitProcessor:
    """Process and analyze git commits"""
    @staticmethod
    def count_commits_per_month(commit_dates: List[str]) -> Dict[str, int]:
        """Count commits per month from list of commit dates"""
        monthly_counts = {}
        for date_str in commit_dates:
            if date_str:
                try:
                    commit_date = datetime.fromisoformat(date_str.strip())
                    month_key = commit_date.strftime("%Y-%m")
                    monthly_counts[month_key] = monthly_counts.get(month_key, 0) + 1
                except ValueError:
                    continue
        return monthly_counts

    @staticmethod
    def generate_month_columns(end_date: datetime) -> List[str]:
        """Generate list of month columns for last 12 months"""
        return [
            (end_date - timedelta(days=i*30)).strftime("%Y-%m")
            for i in range(11, -1, -1)
        ]

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom HTTP request handler with file upload support"""

    def parse_multipart_form(self, data: bytes, boundary: bytes) -> Dict[str, Any]:
        """Parse multipart form data"""
        form = {}
        parts = data.split(boundary)
        for part in parts[1:-1]:
            if b'filename=' in part:
                header_end = part.index(b'\r\n\r\n')
                headers = part[:header_end].decode()
                content = part[header_end + 4:-2]

                filename = None
                for line in headers.split('\r\n'):
                    if 'Content-Disposition' in line:
                        for segment in line.split(';'):
                            if 'filename=' in segment:
                                filename = segment.split('=')[1].strip('"')

                if filename:
                    form['file'] = {
                        'filename': filename,
                        'content': content
                    }
        return form

    def serve_file(self, path: str, filename: str, content_type: Optional[str] = None) -> None:
        """Serve a file with appropriate headers"""
        self.path = path
        self.send_response(200)

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
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.end_headers()

        file_path = Path(filename)
        if file_path.exists():
            with open(file_path, 'rb') as file:
                self.wfile.write(file.read())
        else:
            logger.warning(f"File not found: {file_path}")

    def do_GET(self):
        """Handle GET requests"""
        if self.path == '/':
            self.serve_file('/index.html', 'index.html')
            return

        if self.path.startswith('/api/commit-descriptions/'):
            filename = self.path.split('/api/commit-descriptions/')[1]
            filepath = Path('commit-descriptions') / filename

            if filepath.exists():
                self.send_response(200)
                self.send_header('Content-type', 'text/plain')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()

                with open(filepath, 'rb') as file:
                    self.wfile.write(file.read())
            else:
                self.send_error(404, 'File not found')
            return

        elif self.path == '/api/stats':
            output_file = getattr(self.server, 'output_file', 'git_commit_history.csv')

            if os.path.exists(output_file):
                self.send_response(200)
                self.send_header('Content-type', 'text/csv')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Content-Disposition',
                               f'attachment; filename="{os.path.basename(output_file)}"')
                self.end_headers()

                with open(output_file, 'rb') as file:
                    self.wfile.write(file.read())
            else:
                self.send_error(404, 'Statistics file not found')
            return
        else:
            requested_path = self.path[1:]
            self.serve_file(self.path, requested_path)

    def do_POST(self):
        """Handle POST requests"""
        if self.path == '/api/upload':
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)

                if self.headers.get('Content-Type', '').startswith('multipart/form-data'):
                    boundary = self.headers.get('Content-Type').split('=')[1].encode()
                    form_data = self.parse_multipart_form(post_data, boundary)

                    if 'file' not in form_data:
                        self.send_error(400, 'No file uploaded')
                        return

                    file_data = form_data['file']
                    with tempfile.NamedTemporaryFile(suffix='.csv', delete=False) as temp_file:
                        temp_file.write(file_data['content'])
                        temp_file_path = temp_file.name

                    output_file = getattr(self.server, 'output_file', 'git_commit_history.csv')
                    repo_path = getattr(self.server, 'repo_path', '.')
                    processor = GitDataProcessor(repo_path)
                    success = processor.process_git_logs(temp_file_path, output_file)

                    Path(temp_file_path).unlink(missing_ok=True)

                    if success:
                        self._send_json_success('File processed successfully')
                    else:
                        self._send_json_error('Error processing file: ', temp_file_path)
            except Exception as e:
                logger.error(f"Upload error: {e}")
                self._send_json_error('Error executing git pull', str(e))
            return
        elif self.path == '/api/git-pull':
            try:
                repo_path = getattr(self.server, 'repo_path', '.')
                result = subprocess.run(
                    ['git', 'pull'],
                    capture_output=True,
                    text=True,
                    check=True,
                    cwd=repo_path
                )
                self._send_json_success('Git pull successful', '' if result.stdout is None else result.stdout)
                return
            except subprocess.CalledProcessError as e:
                self._send_json_error('Git pull failed', e.stderr)
            except Exception as e:
                self._send_json_error('Error executing git pull', str(e))
            return

    def _send_json_success(self, message: str, details: str='') -> None:
        """Send a JSON-formatted success response"""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({
            'success': True,
            'message': message
        }).encode())

    def _send_json_error(self, message: str, details: str) -> None:
        """Send a JSON-formatted error response"""
        self.send_response(500)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({
            'success': False,
            'message': message,
            'details': details
        }).encode())

class CustomTCPServer(socketserver.TCPServer):
    """Custom TCP server with additional attributes"""
    def __init__(self, server_address: Tuple[str, int], RequestHandlerClass: Any, *,
                 output_file: Optional[str] = None, repo_path: Optional[str] = None):
        self.output_file = output_file
        self.repo_path = repo_path
        self.allow_reuse_address = True
        super().__init__(server_address, RequestHandlerClass)

class GitDataProcessor:
    """Process git repository data"""
    def __init__(self, repo_path: str):
        self.repo = GitRepository(repo_path)
        self.commit_processor = CommitProcessor()

    def process_git_logs(self, input_file: str, output_file: str) -> bool:
        """Process git logs for developers and save results"""
        try:
            df = pd.read_csv(input_file)
            end_date = datetime.now()
            start_date = end_date - timedelta(days=365)
            month_columns = self.commit_processor.generate_month_columns(end_date)
            results = []

            for _, row in df.iterrows():
                developer_name = row['Developer Name']
                developer_email = row['Developer']
                grade = row['Grade']
                team = row['Team']
                logger.info(f"Processing developer: {developer_name}")

                commit_dates, commit_descriptions = self.repo.get_commit_data(developer_email, start_date)
                monthly_commits = self.commit_processor.count_commits_per_month(commit_dates)

                if commit_descriptions:
                    self._save_commit_descriptions(developer_name, commit_descriptions)

                result_row = {
                    'Developer Name': developer_name,
                    'Developer': developer_email,
                    'Grade': grade,
                    'Team': team,
                    **{month: monthly_commits.get(month, 0) for month in month_columns}
                }
                results.append(result_row)

            output_df = pd.DataFrame(results)
            columns = ['Developer Name', 'Developer', 'Grade', 'Team'] + month_columns
            output_df = output_df[columns]
            output_df.to_csv(output_file, index=False)
            logger.info(f"Results saved to {output_file}")
            return True

        except Exception as e:
            logger.error(f"Error processing git logs: {e}")
            traceback.print_exc()
            return False

    def _save_commit_descriptions(self, developer_name: str, commit_descriptions: List[str]) -> None:
        """Save commit descriptions to a file"""
        folder_path = Path("commit-descriptions")
        folder_path.mkdir(exist_ok=True)

        safe_name = "".join(c if c.isalnum() else "_" for c in developer_name)
        file_path = folder_path / f"{safe_name}_commit_history.txt"

        with open(file_path, 'w') as f:
            for desc in commit_descriptions:
                if desc:
                    parts = desc.split(" | ")
                    if len(parts) == 3:
                        commit_date, description, commit_hash = parts
                        github_url = f"{self.repo.github_repo_url}/commit/{commit_hash}"
                        f.write(f"{commit_date} | {description} | {commit_hash} | {github_url}\n")
                    else:
                        f.write(f"{desc}\n")

def start_webserver(*, port: int = 8000, output_file: str = 'git_commit_history.csv',
                   repo_path: str = '.') -> None:
    """Start the web server"""
    handler = CustomHTTPRequestHandler

    try:
        server = CustomTCPServer(
            ("", port),
            handler,
            output_file=output_file,
            repo_path=repo_path
        )

        logger.info(f"Serving at http://localhost:{port}")
        logger.info(f"Open http://localhost:{port}/index.html in your browser")
        logger.info(f"CSV data available at http://localhost:{port}/api/stats")

        webbrowser.open(f'http://localhost:{port}/')
        server.serve_forever()

    except KeyboardInterrupt:
        logger.info("\nServer stopped by user.")
    except OSError as e:
        if e.errno == 48:  # Address already in use
            logger.warning(f"Port {port} is already in use. Trying another port.")
            start_webserver(port=port + 1, output_file=output_file, repo_path=repo_path)
        else:
            raise

def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description="Process git logs and visualize commit history")
    parser.add_argument("--repo-path", default=".",
                       help="Path to the git repository")
    parser.add_argument("--input", default="input.csv",
                       help="Input CSV file with developer information")
    parser.add_argument("--output", default="git_commit_history.csv",
                       help="Output CSV file for commit history")
    parser.add_argument("--port", type=int, default=8000,
                       help="Port number for the web server")
    parser.add_argument("--debug", action="store_true",
                       help="Enable debug logging")

    args = parser.parse_args()

    # Configure logging level based on debug flag
    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)
        logger.debug("Debug logging enabled")

    # Validate repository path
    repo_path = Path(args.repo_path)
    if not (repo_path / '.git').exists():
        logger.error(f"No git repository found at {repo_path}")
        sys.exit(1)

    # Validate input file
    if not Path(args.input).exists():
        logger.error(f"Input file not found: {args.input}")
        sys.exit(1)

    try:
        # Initialize processor and process git logs
        processor = GitDataProcessor(args.repo_path)
        logger.info("Processing git logs...")
        success = processor.process_git_logs(args.input, args.output)

        if not success:
            logger.error("Failed to process git logs")
            sys.exit(1)

        logger.info("Git logs processed successfully")

        # Start web server
        logger.info("Starting web server...")
        start_webserver(
            port=args.port,
            output_file=args.output,
            repo_path=args.repo_path
        )

    except KeyboardInterrupt:
        logger.info("\nApplication terminated by user")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        if args.debug:
            traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
