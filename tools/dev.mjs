// Dev orchestrator: runs the Angular dev server and the MP3 helper together so
// `npm start` is the single command you need. Dependency-free (Node built-ins).

import { spawn } from 'node:child_process';

const commands = [
  { name: 'ng', command: 'npm run serve' },
  { name: 'mp3', command: 'npm run mp3' },
];

const children = commands.map(({ name, command }) => {
  const child = spawn(command, { stdio: 'inherit', shell: true });
  child.on('exit', (code) => {
    console.log(`[dev] "${name}" exited (${code}); shutting down.`);
    shutdown();
  });
  return child;
});

let shuttingDown = false;
function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) child.kill();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
