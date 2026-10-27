// Starts the built app for this computer only: bound to localhost, so nothing on the network can reach it.
// adapter-node assumes https unless a header says otherwise, and SvelteKit then rejects every form save
// from http://localhost as cross-site — so this server sets that header itself, on every request.
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';

const DEFAULT_PORT = 3000;
const HOST = 'localhost';
const PROTOCOL_HEADER = 'x-forwarded-proto';
// A screenshot can be up to 10 MB (POSTING_LIMITS.imageBytes), plus the form around it; adapter-node allows 512 KB
const BODY_SIZE_LIMIT = '11M';

const port = Number(process.env.PORT) || DEFAULT_PORT;

// Read by the handler when it is imported, so they are set first
process.env.PROTOCOL_HEADER = PROTOCOL_HEADER;
process.env.BODY_SIZE_LIMIT ??= BODY_SIZE_LIMIT;
const { handler } = await import('./build/handler.js');

const server = createServer((request, response) => {
  request.headers[PROTOCOL_HEADER] = 'http';
  handler(request, response);
});

server.on('error', (error) => {
  const reason = error.code === 'EADDRINUSE' ? `port ${port} is already in use (set PORT to another one)` : error.message;
  process.stderr.write(`Merit could not start: ${reason}\n`);
  process.exit(1);
});

// The start files (Start Merit.bat, .command, .sh) ask for the browser to open once Merit is ready
const OPEN_COMMANDS = { win32: ['cmd', ['/c', 'start', '']], darwin: ['open', []] };

function openBrowser(url) {
  const [command, args] = OPEN_COMMANDS[process.platform] ?? ['xdg-open', []];
  const child = spawn(command, [...args, url], { detached: true, stdio: 'ignore' });
  // No browser to open is no reason to stop: the address is printed above
  child.on('error', () => {});
  child.unref();
}

server.listen(port, HOST, () => {
  const url = `http://${HOST}:${port}`;
  process.stdout.write(`Merit is running at ${url}\nClose this window to stop it.\n`);
  if (process.env.MERIT_OPEN_BROWSER) openBrowser(url);
});
