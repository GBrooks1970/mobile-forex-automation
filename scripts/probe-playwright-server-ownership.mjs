import { spawn } from 'node:child_process';
import { log } from 'node:console';
import { createServer } from 'node:http';
import process from 'node:process';
import { clearTimeout, setTimeout } from 'node:timers';
import { fileURLToPath, URL } from 'node:url';

const port = 4173;
const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const playwrightCli = fileURLToPath(
  new URL('../node_modules/@playwright/test/cli.js', import.meta.url),
);
const unrelatedServer = createServer((_request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  response.end('<!doctype html><title>unrelated responder</title>');
});

await new Promise((resolve, reject) => {
  unrelatedServer.once('error', reject);
  unrelatedServer.listen(port, resolve);
});

const environment = { ...process.env };
delete environment.PLAYWRIGHT_REUSE_SERVER;

let output = '';
let timedOut = false;

try {
  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [playwrightCli, 'test', 'tests/e2e/smoke.spec.ts', '--project=chromium-desktop'],
      {
        cwd: projectRoot,
        env: environment,
        windowsHide: true,
      },
    );

    child.stdout.on('data', chunk => {
      output += chunk.toString();
    });
    child.stderr.on('data', chunk => {
      output += chunk.toString();
    });
    child.once('error', reject);

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, 30_000);

    child.once('close', code => {
      clearTimeout(timeout);
      resolve(code);
    });
  });

  if (timedOut) {
    throw new Error('Playwright did not reject the unrelated responder within 30 seconds.');
  }
  if (exitCode === 0) {
    throw new Error('Playwright silently reused the unrelated responder on port 4173.');
  }
  if (!/already used/i.test(output)) {
    throw new Error(`Playwright failed for an unexpected reason:\n${output}`);
  }

  log('Server-ownership probe passed: canonical Playwright refused port 4173 reuse.');
} finally {
  await new Promise((resolve, reject) => {
    unrelatedServer.close(error => (error ? reject(error) : resolve()));
  });
}
