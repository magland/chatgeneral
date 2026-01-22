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

## License

MIT
