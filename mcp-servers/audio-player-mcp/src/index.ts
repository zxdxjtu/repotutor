#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { AudioPlayer } from './player.js';

// Initialize audio player
const player = new AudioPlayer();

// Define available tools
const TOOLS: Tool[] = [
  {
    name: 'play',
    description: '播放音频文件',
    inputSchema: {
      type: 'object',
      properties: {
        audioPath: {
          type: 'string',
          description: '音频文件的路径',
        },
      },
      required: ['audioPath'],
    },
  },
  {
    name: 'pause',
    description: '暂停当前播放的音频',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'resume',
    description: '继续播放暂停的音频',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'stop',
    description: '停止播放音频',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_status',
    description: '获取当前播放状态',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: 'repotutor-audio-player',
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
      case 'play': {
        const { audioPath } = args as { audioPath: string };
        const result = await player.play(audioPath);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: result.success,
                message: result.message,
                status: player.getStatus(),
              }),
            },
          ],
        };
      }

      case 'pause': {
        const result = player.pause();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: result.success,
                message: result.message,
                positionMs: player.getPositionMs(),
                status: player.getStatus(),
              }),
            },
          ],
        };
      }

      case 'resume': {
        const result = player.resume();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: result.success,
                message: result.message,
                status: player.getStatus(),
              }),
            },
          ],
        };
      }

      case 'stop': {
        const result = await player.stop();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: result.success,
                message: result.message,
                status: player.getStatus(),
              }),
            },
          ],
        };
      }

      case 'get_status': {
        const status = player.getStatus();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                state: status.state,
                currentAudioPath: status.currentAudioPath,
                positionMs: player.getPositionMs(),
                isPlaying: player.isPlaying(),
                isPaused: player.isPaused(),
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
  console.error('[Audio Player MCP] Server started');
}

main().catch((error) => {
  console.error('[Audio Player MCP] Fatal error:', error);
  process.exit(1);
});
