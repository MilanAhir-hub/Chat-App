import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const run = (workspace, args) => {
  const result = spawnSync(process.execPath, args, {
    cwd: resolve(root, workspace),
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
};

run('server', ['./node_modules/typescript/bin/tsc']);
run('client', ['./scripts/build.mjs']);
