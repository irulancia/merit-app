import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { EngineError } from './errors.js';

const TIMEOUT_MS = 180_000;
const COMMAND = 'claude';

interface RunOptions {
  prompt: string;
  schema: Record<string, unknown>;
  /** The folder Claude Code runs in; for a screenshot, the folder that holds it (so Read can open it). */
  cwd: string;
  /** A screenshot to read, by its file name in `cwd`. */
  imageFile?: string;
}

/** The arguments for one isolated, answer-only run: no session kept, no MCP servers, no slash commands,
    no tools — except Read, for a screenshot, so it can look at the image. */
function argumentsFor({ schema, imageFile }: RunOptions): string[] {
  return [
    '-p',
    '--output-format', 'json',
    '--json-schema', JSON.stringify(schema),
    '--tools', imageFile ? 'Read' : '',
    '--no-session-persistence',
    '--disable-slash-commands',
    '--strict-mcp-config'
  ];
}

/** Starts claude directly (claude.exe, or the script on macOS/Linux). Only an npm install on Windows is a
    claude.cmd, which needs the shell; then the fixed arguments are quoted for cmd.exe. */
function start(args: string[], cwd: string, viaShell: boolean): ChildProcessWithoutNullStreams {
  return viaShell
    ? spawn(COMMAND, args.map((arg) => JSON.stringify(arg)), { cwd, shell: true, windowsHide: true })
    : spawn(COMMAND, args, { cwd, windowsHide: true });
}

function run(options: RunOptions, viaShell = false): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = start(argumentsFor(options), options.cwd, viaShell);
    let stdout = '';
    let stderr = '';
    // A process that couldn't start also emits "close"; only the "error" handler decides then
    let failedToStart = false;
    const timer = setTimeout(() => {
      child.kill();
      reject(new EngineError('timeout'));
    }, TIMEOUT_MS);
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.stderr.on('data', (chunk) => (stderr += chunk));
    child.on('error', (error: NodeJS.ErrnoException) => {
      failedToStart = true;
      clearTimeout(timer);
      const retry = error.code === 'ENOENT' && process.platform === 'win32' && !viaShell;
      if (retry) run(options, true).then(resolve, reject);
      else reject(new EngineError('notInstalled'));
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (failedToStart) return;
      if (code === 0) resolve(stdout);
      else reject(new EngineError(code === 127 || code === 9009 ? 'notInstalled' : 'failed', stderr));
    });
    const imageLine = options.imageFile ? `\n\nThe posting image is the file ./${options.imageFile}. Read it.` : '';
    child.stdin.on('error', () => undefined); // the process may exit before reading (not installed): handled above
    child.stdin.end(options.prompt + imageLine);
  });
}

/** Asks Claude Code (the user's own installation and sign-in) and returns its structured answer. */
export async function askClaudeCode(options: RunOptions): Promise<unknown> {
  const output = await run(options);
  let parsed: unknown;
  try {
    parsed = JSON.parse(output);
  } catch {
    throw new EngineError('badAnswer', output.slice(0, 500));
  }
  const result = parsed as { is_error?: boolean; structured_output?: unknown; result?: string };
  if (result.is_error) throw new EngineError('failed', result.result);
  if (result.structured_output === undefined) throw new EngineError('badAnswer');
  return result.structured_output;
}

/** The installed version, or null when claude can't be run here (for the Settings page). */
export function claudeCodeVersion(viaShell = false): Promise<string | null> {
  return new Promise((resolve) => {
    const child = start(['--version'], process.cwd(), viaShell);
    let out = '';
    let failedToStart = false;
    child.stdout.on('data', (chunk) => (out += chunk));
    child.on('error', (error: NodeJS.ErrnoException) => {
      failedToStart = true;
      const retry = error.code === 'ENOENT' && process.platform === 'win32' && !viaShell;
      resolve(retry ? claudeCodeVersion(true) : null);
    });
    child.on('close', (code) => {
      if (!failedToStart) resolve(code === 0 ? out.trim() : null);
    });
  });
}
