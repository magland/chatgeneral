"""FastAPI server for executing Python scripts"""

import asyncio
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel

API_KEY = "z9-local-file-access-key-2026"

app = FastAPI(title="ChatGeneral Script Execution Server")

# Enable CORS for specific origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://magland.github.io"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variable to store the server's working directory
SERVER_WORKING_DIR: Optional[Path] = None


class RunScriptRequest(BaseModel):
    script: str
    scriptType: str = "python"  # "python" or "shell"
    timeout: int = 10
    apiKey: str


class RunScriptResponse(BaseModel):
    success: bool
    scriptDir: Optional[str] = None
    scriptPath: Optional[str] = None
    exitCode: Optional[int] = None
    stdout: Optional[str] = None
    stderr: Optional[str] = None
    timeout: bool = False
    message: Optional[str] = None
    createdFiles: Optional[list[str]] = None
    createdDirectories: Optional[list[str]] = None
    error: Optional[str] = None


def validate_api_key(api_key: str) -> bool:
    """Validate the API key"""
    return api_key == API_KEY


def is_safe_path(base_dir: Path, requested_path: str) -> bool:
    """Check if the requested path is within the base directory (prevent directory traversal)"""
    try:
        base = base_dir.resolve()
        target = (base / requested_path).resolve()
        return target.is_relative_to(base)
    except (ValueError, OSError):
        return False


async def run_script_with_timeout(
    script_path: Path, timeout_seconds: int, cwd: Path, script_type: str = "python"
) -> tuple[int, str, str, bool]:
    """
    Execute a script with a timeout.
    Returns: (exit_code, stdout, stderr, timed_out)
    """
    try:
        if script_type == "python":
            cmd = [sys.executable, str(script_path)]
        elif script_type == "shell":
            cmd = ["/bin/bash", str(script_path)]
        else:
            return -1, "", f"Unsupported script type: {script_type}", False
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=str(cwd),
        )

        try:
            stdout_bytes, stderr_bytes = await asyncio.wait_for(
                process.communicate(), timeout=timeout_seconds
            )
            stdout = stdout_bytes.decode("utf-8", errors="replace")
            stderr = stderr_bytes.decode("utf-8", errors="replace")
            return process.returncode or 0, stdout, stderr, False
        except asyncio.TimeoutError:
            # Kill the process if it times out
            process.kill()
            await process.wait()
            return -1, "", "Script execution timed out", True

    except Exception as e:
        return -1, "", f"Error executing script: {str(e)}", False


def get_files_in_directory(directory: Path) -> set[str]:
    """Get all files in a directory (non-recursive)"""
    try:
        return {f.name for f in directory.iterdir() if f.is_file()}
    except Exception:
        return set()


def get_directories_in_directory(directory: Path) -> set[str]:
    """Get all directories in a directory (non-recursive)"""
    try:
        return {f.name for f in directory.iterdir() if f.is_dir()}
    except Exception:
        return set()


@app.post("/api/run-script", response_model=RunScriptResponse)
async def run_script(request: RunScriptRequest):
    """Execute a script (Python or shell) in a timestamped temporary directory"""
    
    # Validate API key
    if not validate_api_key(request.apiKey):
        raise HTTPException(status_code=401, detail="Invalid API key")

    # Validate script type
    if request.scriptType not in ["python", "shell"]:
        return RunScriptResponse(
            success=False, error="scriptType must be 'python' or 'shell'"
        )

    # Validate timeout
    if request.timeout < 1 or request.timeout > 60:
        return RunScriptResponse(
            success=False, error="Timeout must be between 1 and 60 seconds"
        )

    # Validate script
    if not request.script.strip():
        return RunScriptResponse(success=False, error="Script content is required")

    # Create timestamped directory
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    tmp_dir = SERVER_WORKING_DIR / "tmp"
    tmp_dir.mkdir(exist_ok=True)
    
    script_dir = tmp_dir / timestamp
    script_dir.mkdir(exist_ok=True)

    # Get relative paths and set script extension based on type
    script_dir_rel = script_dir.relative_to(SERVER_WORKING_DIR)
    script_filename = "script.py" if request.scriptType == "python" else "script.sh"
    script_path = script_dir / script_filename
    script_path_rel = script_path.relative_to(SERVER_WORKING_DIR)

    try:
        # Write script to file
        script_path.write_text(request.script, encoding="utf-8")
        
        # Make shell scripts executable
        if request.scriptType == "shell":
            script_path.chmod(0o755)

        # Get files and directories before execution
        files_before = get_files_in_directory(script_dir)
        directories_before = get_directories_in_directory(script_dir)

        # Execute script
        exit_code, stdout, stderr, timed_out = await run_script_with_timeout(
            script_path, request.timeout, script_dir, request.scriptType
        )

        # Get files and directories after execution and determine what was created
        files_after = get_files_in_directory(script_dir)
        directories_after = get_directories_in_directory(script_dir)
        created_files = sorted(files_after - files_before)
        created_directories = sorted(directories_after - directories_before)

        # Build response message
        if timed_out:
            message = f"Script execution timed out after {request.timeout} seconds"
        elif exit_code == 0:
            message = "Script executed successfully"
        else:
            message = f"Script exited with code {exit_code}"

        return RunScriptResponse(
            success=True,
            scriptDir=str(script_dir_rel),
            scriptPath=str(script_path_rel),
            exitCode=exit_code,
            stdout=stdout,
            stderr=stderr,
            timeout=timed_out,
            message=message,
            createdFiles=created_files,
            createdDirectories=created_directories,
        )

    except Exception as e:
        return RunScriptResponse(
            success=False, error=f"Failed to execute script: {str(e)}"
        )


@app.head("/files/{file_path:path}")
async def head_file(file_path: str):
    """HEAD request for files - check if file exists without downloading"""
    
    # Validate path is safe (within working directory)
    if not is_safe_path(SERVER_WORKING_DIR, file_path):
        raise HTTPException(
            status_code=400,
            detail="Invalid path: must be within server working directory",
        )

    full_path = SERVER_WORKING_DIR / file_path

    # Check if file exists
    if not full_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    if not full_path.is_file():
        raise HTTPException(status_code=400, detail="Path is not a file")

    # Get file size for Content-Length header
    file_size = full_path.stat().st_size
    
    return Response(
        status_code=200,
        headers={
            "Content-Length": str(file_size),
            "Accept-Ranges": "bytes",
        }
    )


@app.get("/files/{file_path:path}")
async def serve_file(file_path: str, request: Request):
    """Serve files from the server's working directory with range request support"""
    
    # Validate path is safe (within working directory)
    if not is_safe_path(SERVER_WORKING_DIR, file_path):
        raise HTTPException(
            status_code=400,
            detail="Invalid path: must be within server working directory",
        )

    full_path = SERVER_WORKING_DIR / file_path

    # Check if file exists
    if not full_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    if not full_path.is_file():
        raise HTTPException(status_code=400, detail="Path is not a file")

    # Handle range requests for better streaming/partial content support
    range_header = request.headers.get("Range")
    if range_header:
        # Parse range header (e.g., "bytes=0-1023")
        try:
            range_match = range_header.replace("bytes=", "").split("-")
            start = int(range_match[0]) if range_match[0] else 0
            file_size = full_path.stat().st_size
            end = int(range_match[1]) if range_match[1] else file_size - 1
            
            # Read the requested byte range
            with open(full_path, "rb") as f:
                f.seek(start)
                content = f.read(end - start + 1)
            
            return Response(
                content=content,
                status_code=206,  # Partial Content
                headers={
                    "Content-Range": f"bytes {start}-{end}/{file_size}",
                    "Accept-Ranges": "bytes",
                    "Content-Length": str(len(content)),
                }
            )
        except (ValueError, IndexError):
            # Invalid range, fall back to full file
            pass
    
    return FileResponse(full_path)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "workingDir": str(SERVER_WORKING_DIR)}


def create_app(working_dir: Path) -> FastAPI:
    """Create and configure the FastAPI app with a working directory"""
    global SERVER_WORKING_DIR
    SERVER_WORKING_DIR = working_dir
    return app


def run_server(working_dir: Path, host: str = "127.0.0.1", port: int = 3339):
    """Run the server with uvicorn"""
    global SERVER_WORKING_DIR
    SERVER_WORKING_DIR = working_dir
    
    import uvicorn
    
    uvicorn.run(app, host=host, port=port)
