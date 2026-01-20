# ChatGeneral Python Package

A bare-bones Python package that provides an HTTP server for executing Python scripts remotely. Designed to work with the ChatGeneral assistant tools.

## Installation

From the `python/chatgeneral` directory:

```bash
pip install -e .
```

Or install directly with pip:

```bash
pip install .
```

## Usage

### Starting the Server

Run the server from any working directory:

```bash
chatgeneral start-server
```

The server will:
- Listen on `http://127.0.0.1:3339`
- Use the current directory as its working directory
- Create a `tmp/` subdirectory for script execution

#### Options

```bash
chatgeneral start-server --host 0.0.0.0 --port 3339 --working-dir /path/to/workdir
```

- `--host`: Host to bind to (default: `127.0.0.1`)
- `--port`: Port to bind to (default: `3339`)
- `--working-dir`: Server working directory (default: current directory)

## API Endpoints

### 1. Run Python Script

**POST** `/api/run-python-script`

Execute a Python script in a timestamped temporary directory.

**Request Body:**
```json
{
  "script": "print('Hello, World!')",
  "timeout": 10,
  "apiKey": "z9-local-file-access-key-2026"
}
```

**Response:**
```json
{
  "success": true,
  "scriptDir": "tmp/20260120_145900",
  "scriptPath": "tmp/20260120_145900/script.py",
  "exitCode": 0,
  "stdout": "Hello, World!\n",
  "stderr": "",
  "timeout": false,
  "message": "Script executed successfully",
  "createdFiles": ["output.txt", "data.csv"]
}
```

**Parameters:**
- `script` (required): The Python script to execute
- `timeout` (optional): Timeout in seconds (1-60, default: 10)
- `apiKey` (required): API key for authentication

**Behavior:**
- Creates a new directory: `tmp/YYYYMMDD_HHMMSS/`
- Writes script to `script.py` in that directory
- Executes script with the specified timeout
- Returns stdout, stderr, exit code, and list of files created by the script
- `createdFiles` contains filenames relative to `scriptDir`

### 2. Read File

**GET** `/api/read-file?path=tmp/20260120_145900/output.txt&apiKey=z9-local-file-access-key-2026`

Read a file from within the server's working directory.

**Query Parameters:**
- `path` (required): Relative path to the file
- `apiKey` (required): API key for authentication

**Response:**
```json
{
  "success": true,
  "content": "file contents here"
}
```

**Security:**
- Path must be within the server's working directory
- Directory traversal attempts are blocked

### 3. Health Check

**GET** `/health`

Check if the server is running.

**Response:**
```json
{
  "status": "ok",
  "workingDir": "/path/to/working/directory"
}
```

## Development

### Project Structure

```
python/chatgeneral/
├── pyproject.toml           # Package configuration
├── README.md                # This file
└── chatgeneral/
    ├── __init__.py         # Package initialization
    ├── cli.py              # CLI entry point
    └── server.py           # FastAPI server implementation
```

### Requirements

- Python 3.8+
- FastAPI
- Uvicorn
- Pydantic

## Security

- API key authentication required for all script execution and file reading endpoints
- Default API key: `z9-local-file-access-key-2026`
- Path validation prevents directory traversal attacks
- Script execution is sandboxed to timestamped directories
- Timeout enforcement prevents runaway scripts

## Example Client Usage

```python
import requests

response = requests.post(
    "http://localhost:3339/api/run-python-script",
    json={
        "script": "import math\nprint(f'Pi = {math.pi}')",
        "timeout": 5,
        "apiKey": "z9-local-file-access-key-2026"
    }
)

result = response.json()
print(result["stdout"])  # Pi = 3.141592653589793
```

## License

MIT
