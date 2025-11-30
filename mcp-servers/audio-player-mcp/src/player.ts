import { spawn, ChildProcess } from 'child_process';
import { existsSync } from 'fs';
import { platform } from 'os';

export type PlaybackState = 'idle' | 'playing' | 'paused' | 'stopped';

export interface PlayerStatus {
  state: PlaybackState;
  currentAudioPath: string | null;
  startTime: number | null;
  pauseTime: number | null;
}

export interface PlayResult {
  success: boolean;
  message: string;
}

/**
 * Cross-platform audio player with pause/resume support
 */
export class AudioPlayer {
  private process: ChildProcess | null = null;
  private state: PlaybackState = 'idle';
  private currentAudioPath: string | null = null;
  private startTime: number | null = null;
  private pauseTime: number | null = null;
  private pausePosition: number = 0;

  /**
   * Get the appropriate play command for the current platform
   */
  private getPlayCommand(): { command: string; args: string[] } {
    const os = platform();

    switch (os) {
      case 'darwin':
        // macOS: afplay supports various formats including WAV
        return { command: 'afplay', args: [] };
      case 'linux':
        // Linux: try aplay first (ALSA), fallback to mpv
        return { command: 'aplay', args: ['-q'] };
      case 'win32':
        // Windows: use PowerShell to play audio
        return {
          command: 'powershell',
          args: ['-c', '(New-Object Media.SoundPlayer'],
        };
      default:
        // Fallback to mpv which is cross-platform
        return { command: 'mpv', args: ['--no-video', '--really-quiet'] };
    }
  }

  /**
   * Play an audio file
   */
  async play(audioPath: string): Promise<PlayResult> {
    // Stop any currently playing audio
    if (this.process) {
      await this.stop();
    }

    // Check if file exists
    if (!existsSync(audioPath)) {
      return {
        success: false,
        message: `Audio file not found: ${audioPath}`,
      };
    }

    const { command, args } = this.getPlayCommand();
    const fullArgs = [...args, audioPath];

    console.error(`[Audio] Playing: ${command} ${fullArgs.join(' ')}`);

    return new Promise((resolve) => {
      try {
        this.process = spawn(command, fullArgs, {
          stdio: ['ignore', 'pipe', 'pipe'],
        });

        this.state = 'playing';
        this.currentAudioPath = audioPath;
        this.startTime = Date.now();
        this.pauseTime = null;

        this.process.on('close', (code) => {
          console.error(`[Audio] Playback finished with code ${code}`);
          if (this.state === 'playing') {
            this.state = 'idle';
          }
          this.process = null;
        });

        this.process.on('error', (error) => {
          console.error(`[Audio] Playback error: ${error.message}`);
          this.state = 'idle';
          this.process = null;
          resolve({
            success: false,
            message: `Failed to play audio: ${error.message}`,
          });
        });

        // Wait a bit to ensure playback started
        setTimeout(() => {
          if (this.state === 'playing') {
            resolve({
              success: true,
              message: `Playing: ${audioPath}`,
            });
          }
        }, 100);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        resolve({
          success: false,
          message: `Failed to start playback: ${errorMessage}`,
        });
      }
    });
  }

  /**
   * Pause the currently playing audio
   */
  pause(): PlayResult {
    if (!this.process || this.state !== 'playing') {
      return {
        success: false,
        message: 'No audio is currently playing',
      };
    }

    try {
      // Send SIGSTOP to pause the process (Unix-like systems)
      if (platform() !== 'win32') {
        this.process.kill('SIGSTOP');
        this.state = 'paused';
        this.pauseTime = Date.now();

        // Calculate approximate position
        if (this.startTime) {
          this.pausePosition = Date.now() - this.startTime;
        }

        console.error(`[Audio] Paused at ~${this.pausePosition}ms`);

        return {
          success: true,
          message: `Paused at ~${this.pausePosition}ms`,
        };
      } else {
        // Windows doesn't support SIGSTOP, would need different approach
        return {
          success: false,
          message: 'Pause not supported on Windows',
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `Failed to pause: ${errorMessage}`,
      };
    }
  }

  /**
   * Resume paused audio
   */
  resume(): PlayResult {
    if (!this.process || this.state !== 'paused') {
      return {
        success: false,
        message: 'No audio is currently paused',
      };
    }

    try {
      // Send SIGCONT to resume the process (Unix-like systems)
      if (platform() !== 'win32') {
        this.process.kill('SIGCONT');
        this.state = 'playing';

        // Adjust start time to account for pause duration
        if (this.pauseTime && this.startTime) {
          const pauseDuration = Date.now() - this.pauseTime;
          this.startTime += pauseDuration;
        }
        this.pauseTime = null;

        console.error('[Audio] Resumed playback');

        return {
          success: true,
          message: 'Resumed playback',
        };
      } else {
        return {
          success: false,
          message: 'Resume not supported on Windows',
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `Failed to resume: ${errorMessage}`,
      };
    }
  }

  /**
   * Stop the currently playing audio
   */
  async stop(): Promise<PlayResult> {
    if (!this.process) {
      this.state = 'idle';
      return {
        success: true,
        message: 'No audio is playing',
      };
    }

    return new Promise((resolve) => {
      try {
        // If paused, resume first (otherwise SIGTERM might not work)
        if (this.state === 'paused' && platform() !== 'win32') {
          this.process?.kill('SIGCONT');
        }

        this.process?.kill('SIGTERM');

        // Wait for process to terminate
        const timeout = setTimeout(() => {
          this.process?.kill('SIGKILL');
          this.cleanup();
          resolve({
            success: true,
            message: 'Stopped playback (force)',
          });
        }, 1000);

        this.process?.on('close', () => {
          clearTimeout(timeout);
          this.cleanup();
          resolve({
            success: true,
            message: 'Stopped playback',
          });
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.cleanup();
        resolve({
          success: false,
          message: `Failed to stop: ${errorMessage}`,
        });
      }
    });
  }

  private cleanup(): void {
    this.process = null;
    this.state = 'stopped';
    this.currentAudioPath = null;
    this.startTime = null;
    this.pauseTime = null;
    this.pausePosition = 0;
  }

  /**
   * Get current playback status
   */
  getStatus(): PlayerStatus {
    return {
      state: this.state,
      currentAudioPath: this.currentAudioPath,
      startTime: this.startTime,
      pauseTime: this.pauseTime,
    };
  }

  /**
   * Get estimated current position in milliseconds
   */
  getPositionMs(): number {
    if (this.state === 'paused') {
      return this.pausePosition;
    }
    if (this.state === 'playing' && this.startTime) {
      return Date.now() - this.startTime;
    }
    return 0;
  }

  /**
   * Check if audio is currently playing
   */
  isPlaying(): boolean {
    return this.state === 'playing';
  }

  /**
   * Check if audio is currently paused
   */
  isPaused(): boolean {
    return this.state === 'paused';
  }
}
