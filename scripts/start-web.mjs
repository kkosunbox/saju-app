import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Keep the local web bundle in one graph instead of retaining a graph per route.
// Set this only for this child process: exports, EAS and native development keep
// their normal Expo Router configuration.
const child = spawn(process.execPath, [
  require.resolve('expo/bin/cli'),
  'start', '--web', '--port', '4000', '--max-workers', '2',
  ...process.argv.slice(2),
], {
  stdio: 'inherit',
  env: { ...process.env, WOONPICK_LOCAL_WEB: '1' },
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}
child.on('error', (error) => {
  console.error(error);
  process.exitCode = 1;
});
child.on('exit', (code, signal) => {
  process.exitCode = code ?? (signal === 'SIGINT' ? 130 : 1);
});
