"""CLI entry point for chatgeneral server"""

import argparse
import sys
from pathlib import Path


def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(
        description="ChatGeneral - Python script execution server"
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # start-server command
    start_parser = subparsers.add_parser(
        "start-server", help="Start the script execution server"
    )
    start_parser.add_argument(
        "--host",
        default="127.0.0.1",
        help="Host to bind the server to (default: 127.0.0.1)",
    )
    start_parser.add_argument(
        "--port", type=int, default=3339, help="Port to bind the server to (default: 3339)"
    )
    start_parser.add_argument(
        "--working-dir",
        type=Path,
        default=Path.cwd(),
        help="Working directory for the server (default: current directory)",
    )

    args = parser.parse_args()

    if args.command == "start-server":
        working_dir = Path(args.working_dir).resolve()
        
        # Create working directory if it doesn't exist
        working_dir.mkdir(parents=True, exist_ok=True)
        
        print(f"Starting ChatGeneral server...")
        print(f"  Working directory: {working_dir}")
        print(f"  Host: {args.host}")
        print(f"  Port: {args.port}")
        print()
        
        from .server import run_server
        
        run_server(working_dir, host=args.host, port=args.port)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
