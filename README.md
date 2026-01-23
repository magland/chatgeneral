# ChatGeneral

A customizable AI chat interface for prototyping domain-specific AI assistants. The AI can execute Python and shell scripts locally (with your approval) for data analysis, visualizations, and automation tasks.

## Features

- **Custom Instructions**: Load instructions from URLs or create local instruction sets to define specialized AI assistants
- **Parameterized Instructions**: Create reusable instruction templates with URL query parameters
- **AI-Driven Script Execution**: The AI assistant can write and submit Python/shell scripts for execution (you approve each script for security)
- **Rich Output Display**: Automatic rendering of generated images, interactive visualizations (.figpack), and script results
- **Multi-Model Support**: Choose from multiple AI models via OpenRouter (GPT, Claude, Gemini, etc.)

## Quick Start

### Option 1: Use the Hosted Version

1. Visit [magland.github.io/chatgeneral](https://magland.github.io/chatgeneral)
2. Provide instructions via URL or create local instructions
3. Chat with your AI assistant

### Option 2: Run Locally (Development)

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Example

**ClusterLens Assistant**: An AI assistant that helps create ClusterLens visualizations using figpack.

[Try it here](https://magland.github.io/chatgeneral/?instructions=https://github.com/magland/guides/blob/main/assistants/clusterlens_assistant.md)

## Script Execution Setup

To enable the AI assistant to execute scripts locally:

1. **Install the Python server**:
```bash
pip install -e python/chatgeneral
```

2. **Start the server**:
```bash
chatgeneral start-server --working-dir ~/chatgeneral-workspace
```

The server runs on `http://127.0.0.1:3339` by default.

### How Script Execution Works

1. The AI assistant writes a Python or shell script based on your request
2. The script is displayed to you for review
3. You approve or reject the script execution
4. If approved, the script runs in a timestamped temporary directory
5. Output (stdout, stderr, generated files) is automatically displayed

For example, if you ask "Create a plot of sin(x)", the AI will:
- Write a Python script using matplotlib
- Submit it for your approval
- Execute it after approval
- Display the generated image automatically

## Creating Instruction Sets

### From a URL

Add `?instructions=<url>` to the app URL. GitHub URLs are automatically converted to raw content URLs.

Example:
```
https://magland.github.io/chatgeneral/?instructions=https://github.com/user/repo/blob/main/instructions.md
```

### Local Instructions

1. Click "Use local instructions" on the welcome page
2. Enter a name for your instruction set
3. Edit the instructions in the dialog
4. Instructions are stored in browser localStorage

### Parameterized Instructions

Create reusable instruction templates with URL query parameters.

**Define parameters** in your instruction file:
```markdown
parameters: dataset_name, analysis_type

You are a ${analysis_type} assistant for the ${dataset_name} dataset.

Welcome: Ready to analyze ${dataset_name}!
```

**Use with URL parameters**:
```
?instructions=https://example.com/instructions.md&dataset_name=iris&analysis_type=statistical
```

Parameters work with both remote and local instructions. Missing required parameters show an error.

## API Keys

You'll need an OpenRouter API key to use the chat functionality:

1. Get a key from [openrouter.ai](https://openrouter.ai)
2. Enter it in the chat settings dialog
3. The key is stored locally in your browser

## Development

### Frontend (React + TypeScript + Vite)

```bash
npm install
npm run dev
npm run build
```

### Backend (Python FastAPI Server)

```bash
cd python/chatgeneral
pip install -e .
chatgeneral start-server --help
```

## License

MIT
