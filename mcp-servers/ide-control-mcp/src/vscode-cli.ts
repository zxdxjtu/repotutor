import { spawn, execSync } from 'child_process';
import { existsSync } from 'fs';

export type IDEType = 'vscode' | 'cursor' | 'qoder' | 'unknown';

export interface IDEInfo {
  type: IDEType;
  command: string;
  version: string | null;
  path: string | null;
}

export interface GotoResult {
  success: boolean;
  message: string;
}

// Store the current workspace folder for session
let currentWorkspaceFolder: string | null = null;

/**
 * Set the workspace folder for this session
 * This helps IDE reuse the correct window
 */
export function setWorkspaceFolder(folder: string): void {
  if (existsSync(folder)) {
    currentWorkspaceFolder = folder;
    console.error(`[IDE] Workspace folder set to: ${folder}`);
  }
}

/**
 * Get the current workspace folder
 */
export function getWorkspaceFolder(): string | null {
  return currentWorkspaceFolder;
}

/**
 * Detect which IDE is available on the system
 */
export function detectIDE(): IDEInfo {
  const ides: { type: IDEType; commands: string[] }[] = [
    { type: 'cursor', commands: ['cursor'] },
    { type: 'qoder', commands: ['qoder'] },
    { type: 'vscode', commands: ['code'] },
  ];

  for (const ide of ides) {
    for (const cmd of ide.commands) {
      try {
        const version = execSync(`${cmd} --version`, {
          encoding: 'utf-8',
          timeout: 5000,
          stdio: ['pipe', 'pipe', 'pipe'],
        }).trim().split('\n')[0];

        // Try to get the path
        let path: string | null = null;
        try {
          path = execSync(`which ${cmd}`, {
            encoding: 'utf-8',
            timeout: 5000,
          }).trim();
        } catch {
          // Ignore path detection errors
        }

        return {
          type: ide.type,
          command: cmd,
          version,
          path,
        };
      } catch {
        // This IDE is not available, try next
        continue;
      }
    }
  }

  return {
    type: 'unknown',
    command: 'code',
    version: null,
    path: null,
  };
}

/**
 * Open a file in the IDE at the specified location
 * Uses --reuse-window to open in an existing window when possible
 */
export async function gotoLocation(
  file: string,
  line: number,
  column?: number,
  ideCommand?: string,
  workspaceFolder?: string
): Promise<GotoResult> {
  // Detect IDE if not specified
  const ide = detectIDE();
  const command = ideCommand || ide.command;
  const workspace = workspaceFolder || currentWorkspaceFolder;

  // Check if file exists
  if (!existsSync(file)) {
    return {
      success: false,
      message: `File not found: ${file}`,
    };
  }

  // Build the goto argument
  // Format: file:line:column
  let gotoArg = file;
  if (line > 0) {
    gotoArg = `${file}:${line}`;
    if (column && column > 0) {
      gotoArg = `${file}:${line}:${column}`;
    }
  }

  // Build command args
  // -r: reuse window, -g: goto line
  const args: string[] = ['-r', '-g', gotoArg];

  // If workspace is set, add it to ensure correct window is used
  if (workspace && existsSync(workspace)) {
    args.unshift(workspace);
  }

  return new Promise((resolve) => {
    console.error(`[IDE] Executing: ${command} ${args.join(' ')}`);

    const proc = spawn(command, args, {
      detached: true,
      stdio: 'ignore',
    });

    proc.unref();

    // Give it a moment to start
    setTimeout(() => {
      resolve({
        success: true,
        message: `Opened ${file} at line ${line}${column ? `, column ${column}` : ''}`,
      });
    }, 500);

    proc.on('error', (error) => {
      resolve({
        success: false,
        message: `Failed to open IDE: ${error.message}`,
      });
    });
  });
}

/**
 * Open a file in reuse window mode
 */
export async function openFileReuse(
  file: string,
  ideCommand?: string,
  workspaceFolder?: string
): Promise<GotoResult> {
  const ide = detectIDE();
  const command = ideCommand || ide.command;
  const workspace = workspaceFolder || currentWorkspaceFolder;

  if (!existsSync(file)) {
    return {
      success: false,
      message: `File not found: ${file}`,
    };
  }

  const args: string[] = ['-r', file];
  if (workspace && existsSync(workspace)) {
    args.unshift(workspace);
  }

  return new Promise((resolve) => {
    console.error(`[IDE] Executing: ${command} ${args.join(' ')}`);

    const proc = spawn(command, args, {
      detached: true,
      stdio: 'ignore',
    });

    proc.unref();

    setTimeout(() => {
      resolve({
        success: true,
        message: `Opened ${file} in current window`,
      });
    }, 500);

    proc.on('error', (error) => {
      resolve({
        success: false,
        message: `Failed to open file: ${error.message}`,
      });
    });
  });
}

/**
 * Open diff view for two files
 */
export async function openDiff(
  file1: string,
  file2: string,
  ideCommand?: string
): Promise<GotoResult> {
  const ide = detectIDE();
  const command = ideCommand || ide.command;

  if (!existsSync(file1)) {
    return { success: false, message: `File not found: ${file1}` };
  }
  if (!existsSync(file2)) {
    return { success: false, message: `File not found: ${file2}` };
  }

  return new Promise((resolve) => {
    console.error(`[IDE] Executing: ${command} --diff "${file1}" "${file2}"`);

    const proc = spawn(command, ['-r', '--diff', file1, file2], {
      detached: true,
      stdio: 'ignore',
    });

    proc.unref();

    setTimeout(() => {
      resolve({
        success: true,
        message: `Opened diff view for ${file1} and ${file2}`,
      });
    }, 500);

    proc.on('error', (error) => {
      resolve({
        success: false,
        message: `Failed to open diff: ${error.message}`,
      });
    });
  });
}
