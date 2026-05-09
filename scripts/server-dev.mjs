import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const child = spawn(
  process.execPath,
  ['./node_modules/ts-node-dev/lib/bin.js', '--respawn', '--transpile-only', 'src/server.ts'],
  {
    cwd: resolve(root, 'server'),
    stdio: 'inherit',
  }
);

child.on('exit', (code) => {
  process.exit(code || 0);
});
