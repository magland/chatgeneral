import type { Tool, ToolContext } from "react-ai-chat";
import type { ToolExecutionContext } from "../types";
import { fetchUrlTool } from "./fetchUrl";
import { runPythonScriptTool } from "./runPythonScript";

export const fetchUrl: Tool = {
  toolFunction: fetchUrlTool.toolFunction,
  execute: async (params: unknown, context: ToolContext) => {
    return fetchUrlTool.execute(params, context as unknown as ToolExecutionContext);
  },
  getDetailedDescription: fetchUrlTool.getDetailedDescription,
};

/**
 * All available tools for the chat
 */
export const tools: Tool[] = [
  fetchUrl,
  runPythonScriptTool,
];
