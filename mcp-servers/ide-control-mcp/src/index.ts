#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import {
  detectIDE,
  gotoLocation,
  openFileReuse,
  openDiff,
  setWorkspaceFolder,
  getWorkspaceFolder,
} from './vscode-cli.js';

// Cache detected IDE
let cachedIDE: ReturnType<typeof detectIDE> | null = null;

function getIDE() {
  if (!cachedIDE) {
    cachedIDE = detectIDE();
    console.error(`[IDE Control] Detected IDE: ${cachedIDE.type} (${cachedIDE.command})`);
  }
  return cachedIDE;
}

// Define available tools
const TOOLS: Tool[] = [
  {
    name: 'goto_location',
    description: '在 IDE 中打开文件并定位到指定行/列。支持 VSCode、Cursor、Qoder。',
    inputSchema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          description: '文件的绝对路径',
        },
        line: {
          type: 'number',
          description: '行号 (从 1 开始)',
        },
        column: {
          type: 'number',
          description: '列号 (可选，从 1 开始)',
        },
      },
      required: ['file', 'line'],
    },
  },
  {
    name: 'open_file',
    description: '在当前 IDE 窗口中打开文件',
    inputSchema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          description: '文件的绝对路径',
        },
      },
      required: ['file'],
    },
  },
  {
    name: 'open_diff',
    description: '在 IDE 中打开两个文件的对比视图',
    inputSchema: {
      type: 'object',
      properties: {
        file1: {
          type: 'string',
          description: '第一个文件的绝对路径',
        },
        file2: {
          type: 'string',
          description: '第二个文件的绝对路径',
        },
      },
      required: ['file1', 'file2'],
    },
  },
  {
    name: 'detect_ide',
    description: '检测当前系统上可用的 IDE',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'highlight_range',
    description: '高亮代码范围 (需要 VSCode 扩展支持，当前仅定位到起始行)',
    inputSchema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          description: '文件的绝对路径',
        },
        startLine: {
          type: 'number',
          description: '起始行号',
        },
        endLine: {
          type: 'number',
          description: '结束行号',
        },
      },
      required: ['file', 'startLine', 'endLine'],
    },
  },
  {
    name: 'set_workspace',
    description: '设置当前工作目录，用于确保文件在正确的 IDE 窗口中打开。在开始讲解前应先调用此工具。',
    inputSchema: {
      type: 'object',
      properties: {
        folder: {
          type: 'string',
          description: '工作目录的绝对路径（通常是仓库根目录）',
        },
      },
      required: ['folder'],
    },
  },
  {
    name: 'get_workspace',
    description: '获取当前设置的工作目录',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: 'repotutor-ide-control',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'goto_location': {
        const { file, line, column } = args as {
          file: string;
          line: number;
          column?: number;
        };

        const result = await gotoLocation(file, line, column);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: result.success,
                message: result.message,
                ide: getIDE().type,
              }),
            },
          ],
        };
      }

      case 'open_file': {
        const { file } = args as { file: string };
        const result = await openFileReuse(file);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: result.success,
                message: result.message,
                ide: getIDE().type,
              }),
            },
          ],
        };
      }

      case 'open_diff': {
        const { file1, file2 } = args as { file1: string; file2: string };
        const result = await openDiff(file1, file2);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: result.success,
                message: result.message,
                ide: getIDE().type,
              }),
            },
          ],
        };
      }

      case 'detect_ide': {
        const ide = getIDE();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                ide: {
                  type: ide.type,
                  command: ide.command,
                  version: ide.version,
                  path: ide.path,
                },
              }),
            },
          ],
        };
      }

      case 'highlight_range': {
        const { file, startLine, endLine } = args as {
          file: string;
          startLine: number;
          endLine: number;
        };

        // For now, just goto the start line
        // Full highlighting requires VSCode extension
        const result = await gotoLocation(file, startLine);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: result.success,
                message: `${result.message} (highlight range: ${startLine}-${endLine})`,
                note: '完整的代码高亮功能需要 VSCode 扩展支持',
                ide: getIDE().type,
              }),
            },
          ],
        };
      }

      case 'set_workspace': {
        const { folder } = args as { folder: string };
        setWorkspaceFolder(folder);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `工作目录已设置为: ${folder}`,
                workspace: folder,
                ide: getIDE().type,
              }),
            },
          ],
        };
      }

      case 'get_workspace': {
        const workspace = getWorkspaceFolder();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                workspace: workspace,
                ide: getIDE().type,
              }),
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: `Unknown tool: ${name}`,
              }),
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: errorMessage,
          }),
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[IDE Control MCP] Server started');
}

main().catch((error) => {
  console.error('[IDE Control MCP] Fatal error:', error);
  process.exit(1);
});
