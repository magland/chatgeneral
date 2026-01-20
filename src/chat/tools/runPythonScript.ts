import { QPTool, ToolExecutionContext } from "../types";
import { getServerUrl } from "../../serverConfig";

const API_KEY = "z9-local-file-access-key-2026";

// Supported image file extensions
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.bmp', '.webp'];

// Get MIME type from file extension
function getMimeType(filename: string): string {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  const mimeTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.bmp': 'image/bmp',
    '.webp': 'image/webp',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// Check if filename has an image extension
function isImageFile(filename: string): boolean {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return IMAGE_EXTENSIONS.includes(ext);
}

/**
 * A tool that allows the AI to run Python scripts via the local file server.
 */
export const runPythonScriptTool: QPTool = {
  toolFunction: {
    name: "run_python_script",
    description:
      "Execute a Python script on the local system. The script will be written to a temporary directory with a timestamp and executed with a configurable timeout. Use this to perform data analysis, computations, or any Python-based tasks.",
    parameters: {
      type: "object",
      properties: {
        script: {
          type: "string",
          description:
            "The complete Python script to execute. Include all necessary imports and code. The script will be saved as 'script.py' in a timestamped temporary directory.",
        },
        timeout: {
          type: "number",
          description:
            "Maximum execution time in seconds (default: 10, max: 60). The script will be terminated if it runs longer than this.",
        },
      },
      required: ["script", "timeout"],
      additionalProperties: false,
    },
  },

  execute: async (
    params: { script: string; timeout?: number },
    context: ToolExecutionContext
  ) => {
    const { script, timeout = 10 } = params;

    // Validate script
    if (!script) {
      return {
        result: JSON.stringify({
          success: false,
          error: "Script content is required",
        }),
      };
    }

    // Emit the script as an output item and wait for user approval
    let approved = true; // Default to approved if no approval system

    if (context.outputEmitter && context.requestApproval) {
      // Emit the script with pending approval state and get the output ID
      const outputId = context.outputEmitter({
        type: 'python-script',
        content: script,
        metadata: {
          pendingApproval: true,
          serverHealthCheck: 'checking',
        },
      });

      // Check server health first
      if (context.updateServerHealth) {
        try {
          const healthResponse = await fetch(`${getServerUrl()}/health`, {
            method: "GET",
          });

          if (!healthResponse.ok) {
            // Server responded but not healthy
            context.updateServerHealth(outputId, 'unhealthy', `Server responded with status ${healthResponse.status}`);
          } else {
            // Server is healthy
            context.updateServerHealth(outputId, 'healthy');
          }
        } catch (error) {
          // Server is not running or unreachable
          context.updateServerHealth(outputId, 'unhealthy', error instanceof Error ? error.message : "Unknown error");
        }
      }

      // Wait for user approval (they can retry server check or cancel)
      try {
        approved = await context.requestApproval(outputId);
      } catch {
        approved = false;
      }

      if (!approved) {
        return {
          result: JSON.stringify({
            success: false,
            error: "Script execution cancelled by user",
          }),
        };
      }
    } else if (context.outputEmitter) {
      // Fallback: emit without approval if requestApproval not available
      context.outputEmitter({
        type: 'python-script',
        content: script,
      });
    }

    try {
      const response = await fetch(`${getServerUrl()}/api/run-python-script`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          script,
          timeout,
          apiKey: API_KEY,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          result: JSON.stringify({
            success: false,
            error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
            hint: "Make sure the local file server is running on port 3339. Start it with: cd server && npm start",
          }),
        };
      }

      const data = await response.json();

      if (!data.success) {
        return {
          result: JSON.stringify({
            success: false,
            error: data.error || "Unknown error from file server",
          }),
        };
      }

      // Emit image outputs for created image files
      if (context.outputEmitter && data.createdFiles && Array.isArray(data.createdFiles)) {
        for (const filename of data.createdFiles) {
          if (isImageFile(filename)) {
            try {
              // Construct the relative path to the image file
              const imagePath = `${data.scriptDir}/${filename}`;
              
              // Fetch the image content as binary
              const imageResponse = await fetch(
                `${getServerUrl()}/files/${imagePath}`
              );
              
              if (imageResponse.ok) {
                // Read as blob and convert to base64
                const blob = await imageResponse.blob();
                const arrayBuffer = await blob.arrayBuffer();
                const bytes = new Uint8Array(arrayBuffer);
                let binary = '';
                for (let i = 0; i < bytes.byteLength; i++) {
                  binary += String.fromCharCode(bytes[i]);
                }
                const base64Content = btoa(binary);
                
                // Emit the image output
                context.outputEmitter({
                  type: 'image',
                  content: base64Content,
                  metadata: {
                    relativePath: imagePath,
                    mimeType: getMimeType(filename),
                  },
                });
              }
            } catch (error) {
              console.error(`Failed to load image ${filename}:`, error);
            }
          }
        }
      }

      // Emit the output after execution
      if (context.outputEmitter) {
        const outputContent = data.stdout || '';
        const stderrContent = data.stderr || '';
        const combinedOutput = stderrContent
          ? `${outputContent}\n\n--- stderr ---\n${stderrContent}`
          : outputContent;

        context.outputEmitter({
          type: 'python-output',
          content: combinedOutput || '(no output)',
          metadata: {
            exitCode: data.exitCode,
            scriptPath: data.scriptPath,
            stderr: data.stderr,
          },
        });
      }

      return {
        result: JSON.stringify({
          success: true,
          scriptDir: data.scriptDir,
          scriptPath: data.scriptPath,
          exitCode: data.exitCode,
          stdout: data.stdout,
          stderr: data.stderr,
          timeout: data.timeout,
          message: data.message,
        }),
      };
    } catch (error) {
      return {
        result: JSON.stringify({
          success: false,
          error: `Failed to connect to file server: ${error instanceof Error ? error.message : "Unknown error"}`,
          hint: "Make sure the local file server is running on port 3339. Start it with: cd server && npm start",
        }),
      };
    }
  },

  getDetailedDescription: () => {
    return `Execute a Python script with a configurable timeout. The script is saved to a timestamped temporary directory.

Example: { "script": "print('Hello, World!')", "timeout": 10 }

If creating plots, write to image files rather than using .show()

Returns exit code, stdout, stderr, and the script location. Timeout defaults to 10 seconds (max 60).`;
  },
};