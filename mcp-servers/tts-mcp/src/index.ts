#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { GeminiTTS, AVAILABLE_VOICES, VoiceName } from './gemini-tts.js';

// Get API key from environment
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const CACHE_DIR = process.env.TTS_CACHE_DIR || '.repotutor/audio_cache';

if (!GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

// Initialize TTS client
const tts = new GeminiTTS(GEMINI_API_KEY, CACHE_DIR);

// Apply default config from environment
if (process.env.TTS_DEFAULT_VOICE) {
  tts.setConfig({ voice: process.env.TTS_DEFAULT_VOICE as VoiceName });
}
if (process.env.TTS_DEFAULT_STYLE) {
  tts.setConfig({ style: process.env.TTS_DEFAULT_STYLE });
}

// Define available tools
const TOOLS: Tool[] = [
  {
    name: 'synthesize_speech',
    description: '将文本转换为语音。返回音频文件路径和时长。',
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: '要转换为语音的文本',
        },
        voice: {
          type: 'string',
          description: '语音名称 (可选，如 Kore, Zephyr 等)',
        },
        style: {
          type: 'string',
          description: '语音风格描述 (可选，如 "专业、清晰")',
        },
      },
      required: ['text'],
    },
  },
  {
    name: 'list_voices',
    description: '获取所有可用的语音列表',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'set_default_config',
    description: '设置默认的语音配置',
    inputSchema: {
      type: 'object',
      properties: {
        voice: {
          type: 'string',
          description: '默认语音名称',
        },
        style: {
          type: 'string',
          description: '默认语音风格',
        },
        language: {
          type: 'string',
          description: '默认语言 (如 zh-CN, en-US)',
        },
      },
    },
  },
  {
    name: 'get_config',
    description: '获取当前的语音配置',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'clear_cache',
    description: '清除音频缓存',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: 'repotutor-tts',
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
      case 'synthesize_speech': {
        const { text, voice, style } = args as {
          text: string;
          voice?: string;
          style?: string;
        };

        // Temporarily apply voice/style if provided
        const originalConfig = tts.getConfig();
        if (voice) {
          tts.setConfig({ voice: voice as VoiceName });
        }
        if (style) {
          tts.setConfig({ style });
        }

        try {
          const result = await tts.synthesize(text);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  audioId: result.audioId,
                  audioPath: result.audioPath,
                  durationMs: result.durationMs,
                }),
              },
            ],
          };
        } finally {
          // Restore original config
          tts.setConfig(originalConfig);
        }
      }

      case 'list_voices': {
        const voices = tts.listVoices();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                voices: voices.map((v) => ({
                  name: v.name,
                  description: v.description,
                })),
              }),
            },
          ],
        };
      }

      case 'set_default_config': {
        const { voice, style, language } = args as {
          voice?: string;
          style?: string;
          language?: string;
        };

        const config: Partial<{ voice: VoiceName; style: string; language: string }> = {};
        if (voice) config.voice = voice as VoiceName;
        if (style) config.style = style;
        if (language) config.language = language;

        tts.setConfig(config);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: 'Configuration updated',
                config: tts.getConfig(),
              }),
            },
          ],
        };
      }

      case 'get_config': {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                config: tts.getConfig(),
              }),
            },
          ],
        };
      }

      case 'clear_cache': {
        await tts.clearCache();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: 'Audio cache cleared',
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
  console.error('[TTS MCP] Server started');
}

main().catch((error) => {
  console.error('[TTS MCP] Fatal error:', error);
  process.exit(1);
});
