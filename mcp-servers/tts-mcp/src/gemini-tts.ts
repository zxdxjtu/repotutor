import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { createHash } from 'crypto';
import { ProxyAgent, fetch as undiciFetch } from 'undici';

// Available voices for Gemini TTS (30 total)
// Reference: https://ai.google.dev/gemini-api/docs/speech-generation
export const AVAILABLE_VOICES = [
  { name: 'Kore', description: '坚定、专业 - 推荐用于技术讲解' },
  { name: 'Zephyr', description: '明亮' },
  { name: 'Puck', description: '积极向上' },
  { name: 'Charon', description: '信息丰富' },
  { name: 'Fenrir', description: '兴奋' },
  { name: 'Leda', description: '年轻' },
  { name: 'Orus', description: '坚定' },
  { name: 'Aoede', description: '活泼' },
  { name: 'Callirrhoe', description: '悠扬' },
  { name: 'Autonoe', description: '温和' },
  { name: 'Enceladus', description: '轻柔' },
  { name: 'Iapetus', description: '清晰' },
  { name: 'Umbriel', description: '轻松' },
  { name: 'Algieba', description: '流畅' },
  { name: 'Despina', description: '流畅' },
  { name: 'Erinome', description: '清晰' },
  { name: 'Algenib', description: '稳重' },
  { name: 'Rasalgethi', description: '沉稳' },
  { name: 'Laomedeia', description: '柔美' },
  { name: 'Achernar', description: '柔和' },
  { name: 'Alnilam', description: '明朗' },
  { name: 'Schedar', description: '典雅' },
  { name: 'Gacrux', description: '深沉' },
  { name: 'Pulcherrima', description: '优美' },
  { name: 'Achird', description: '清澈' },
  { name: 'Zubenelgenubi', description: '悠长' },
  { name: 'Vindemiatrix', description: '温暖' },
  { name: 'Sadachbia', description: '平和' },
  { name: 'Sadaltager', description: '稳健' },
  { name: 'Sulafat', description: '舒缓' },
] as const;

export type VoiceName = typeof AVAILABLE_VOICES[number]['name'];

export interface TTSConfig {
  voice: VoiceName;
  style: string;
  language: string;
}

export interface SynthesizeResult {
  audioId: string;
  audioPath: string;
  durationMs: number;
}

interface GeminiTTSResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        inlineData?: {
          mimeType: string;
          data: string;
        };
      }>;
    };
  }>;
}

export class GeminiTTS {
  private apiKey: string;
  private config: TTSConfig;
  private cacheDir: string;
  private cacheEnabled: boolean;
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
  private readonly model = 'gemini-2.5-flash-preview-tts';

  constructor(apiKey: string, cacheDir: string = '.repotutor/audio_cache') {
    this.apiKey = apiKey;
    this.cacheDir = cacheDir;
    this.cacheEnabled = true;
    this.config = {
      voice: 'Kore',
      style: '专业、清晰、有吸引力',
      language: 'zh-CN',
    };
  }

  setConfig(config: Partial<TTSConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): TTSConfig {
    return { ...this.config };
  }

  setCacheEnabled(enabled: boolean): void {
    this.cacheEnabled = enabled;
  }

  private generateAudioId(text: string): string {
    const hash = createHash('md5')
      .update(`${text}_${this.config.voice}_${this.config.style}`)
      .digest('hex')
      .substring(0, 12);
    return `audio_${hash}`;
  }

  private async ensureCacheDir(): Promise<void> {
    if (!existsSync(this.cacheDir)) {
      await mkdir(this.cacheDir, { recursive: true });
    }
  }

  async synthesize(text: string): Promise<SynthesizeResult> {
    const audioId = this.generateAudioId(text);
    const audioPath = join(this.cacheDir, `${audioId}.wav`);

    // Check cache first
    if (this.cacheEnabled && existsSync(audioPath)) {
      console.error(`[TTS] Using cached audio: ${audioId}`);
      return {
        audioId,
        audioPath,
        durationMs: 0, // Duration unknown for cached files
      };
    }

    await this.ensureCacheDir();

    // Prepare the prompt with style instruction
    const styledText = this.config.style
      ? `请用${this.config.style}的语气朗读: ${text}`
      : text;

    console.error(`[TTS] Synthesizing: "${text.substring(0, 50)}..."`);
    console.error(`[TTS] Voice: ${this.config.voice}, Style: ${this.config.style}`);

    try {
      const url = `${this.baseUrl}/${this.model}:generateContent`;

      const requestBody = {
        contents: [
          {
            parts: [{ text: styledText }]
          }
        ],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: this.config.voice
              }
            }
          }
        },
        model: this.model
      };

      console.error(`[TTS] Sending request to: ${url}`);

      // Check for proxy settings
      const proxyUrl = process.env.https_proxy || process.env.HTTPS_PROXY ||
                       process.env.http_proxy || process.env.HTTP_PROXY;

      const fetchOptions: Parameters<typeof undiciFetch>[1] = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify(requestBody),
      };

      // Add proxy agent if proxy is configured
      if (proxyUrl) {
        console.error(`[TTS] Using proxy: ${proxyUrl}`);
        fetchOptions.dispatcher = new ProxyAgent(proxyUrl);
      }

      const response = await undiciFetch(url, fetchOptions);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini TTS API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as GeminiTTSResponse;

      // Extract audio data from response
      const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (!audioData) {
        throw new Error('No audio data in response');
      }

      // Gemini TTS returns PCM audio (audio/L16;codec=pcm;rate=24000)
      // We need to convert it to WAV format
      const pcmBuffer = Buffer.from(audioData, 'base64');
      const wavBuffer = this.pcmToWav(pcmBuffer, 24000, 1, 16);

      await writeFile(audioPath, wavBuffer);

      // Estimate duration from PCM data (samples / sample_rate)
      const durationMs = Math.round((pcmBuffer.length / 2) / 24000 * 1000);

      console.error(`[TTS] Saved audio to: ${audioPath} (${durationMs}ms)`);

      return {
        audioId,
        audioPath,
        durationMs,
      };
    } catch (error) {
      console.error('[TTS] Error synthesizing speech:', error);
      throw error;
    }
  }

  /**
   * Convert raw PCM data to WAV format
   */
  private pcmToWav(
    pcmData: Buffer,
    sampleRate: number,
    numChannels: number,
    bitsPerSample: number
  ): Buffer {
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const dataSize = pcmData.length;
    const headerSize = 44;
    const fileSize = headerSize + dataSize - 8;

    const header = Buffer.alloc(headerSize);
    let offset = 0;

    // RIFF header
    header.write('RIFF', offset); offset += 4;
    header.writeUInt32LE(fileSize, offset); offset += 4;
    header.write('WAVE', offset); offset += 4;

    // fmt subchunk
    header.write('fmt ', offset); offset += 4;
    header.writeUInt32LE(16, offset); offset += 4; // Subchunk1Size (16 for PCM)
    header.writeUInt16LE(1, offset); offset += 2; // AudioFormat (1 for PCM)
    header.writeUInt16LE(numChannels, offset); offset += 2;
    header.writeUInt32LE(sampleRate, offset); offset += 4;
    header.writeUInt32LE(byteRate, offset); offset += 4;
    header.writeUInt16LE(blockAlign, offset); offset += 2;
    header.writeUInt16LE(bitsPerSample, offset); offset += 2;

    // data subchunk
    header.write('data', offset); offset += 4;
    header.writeUInt32LE(dataSize, offset);

    return Buffer.concat([header, pcmData]);
  }

  listVoices(): typeof AVAILABLE_VOICES {
    return AVAILABLE_VOICES;
  }

  async clearCache(): Promise<void> {
    const { rm } = await import('fs/promises');
    if (existsSync(this.cacheDir)) {
      await rm(this.cacheDir, { recursive: true });
      await mkdir(this.cacheDir, { recursive: true });
    }
  }
}
