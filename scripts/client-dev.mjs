import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const child = spawn(process.execPath, ['./node_modules/vite/bin/vite.js'], {
  cwd: resolve(root, 'client'),
  stdio: 'inherit',
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
