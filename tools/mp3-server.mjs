// Local MP3 download helper for the music-app.
//
// Why this exists: a browser tab is sandboxed and cannot run yt-dlp/ffmpeg or
// write files to disk. This tiny Node process (started automatically with
// `npm start`) resolves a YouTube video with yt-dlp, transcodes it to MP3 with
// ffmpeg, and streams it back so the browser can save it. Uses only Node
// built-ins — nothing to install, works fully offline.
//
// Requires `yt-dlp` and `ffmpeg` to be available on PATH.

import http from 'node:http';
import { spawn } from 'node:child_process';
import { URL } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PORT = 4300;

const isWin = process.platform === 'win32';

function isFile(p) {
  try {
    return !!p && fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

// Look up an executable on the current PATH (adding Windows extensions).
function findOnPath(name) {
  const exts = isWin
    ? (process.env.PATHEXT ?? '.EXE;.CMD;.BAT').split(';')
    : [''];
  for (const dir of (process.env.PATH ?? '').split(path.delimiter)) {
    if (!dir) continue;
    for (const ext of ['', ...exts]) {
      const candidate = path.join(dir, name + ext);
      if (isFile(candidate)) return candidate;
    }
  }
  return null;
}

// Breadth-first search under a directory for a file (bounded depth) so we can
// find binaries installed by winget into per-package folders that are not on
// PATH (e.g. %LOCALAPPDATA%\Microsoft\WinGet\Packages\...).
function findInDir(root, filename, maxDepth = 6) {
  if (!root) return null;
  const queue = [{ dir: root, depth: 0 }];
  while (queue.length) {
    const { dir, depth } = queue.shift();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isFile() && entry.name.toLowerCase() === filename.toLowerCase()) {
        return full;
      }
      if (entry.isDirectory() && depth < maxDepth) {
        queue.push({ dir: full, depth: depth + 1 });
      }
    }
  }
  return null;
}

// Resolve a tool via env override → PATH → common winget install locations.
function resolveTool(exeName, envVar) {
  const override = process.env[envVar];
  if (override && isFile(override)) return override;

  const onPath = findOnPath(exeName);
  if (onPath) return onPath;

  if (isWin) {
    const localAppData =
      process.env.LOCALAPPDATA ?? path.join(os.homedir(), 'AppData', 'Local');
    const wingetPackages = path.join(
      localAppData,
      'Microsoft',
      'WinGet',
      'Packages',
    );
    const wingetLinks = path.join(localAppData, 'Microsoft', 'WinGet', 'Links');
    return (
      findInDir(wingetLinks, `${exeName}.exe`, 1) ??
      findInDir(wingetPackages, `${exeName}.exe`)
    );
  }
  return null;
}

const YT_DLP = resolveTool('yt-dlp', 'YT_DLP_PATH');
const FFMPEG = resolveTool('ffmpeg', 'FFMPEG_PATH');

if (YT_DLP) console.log(`[mp3] using yt-dlp: ${YT_DLP}`);
else
  console.error(
    '[mp3] yt-dlp not found. Install it (winget install yt-dlp.yt-dlp) or ' +
      'set YT_DLP_PATH to the yt-dlp executable.',
  );
if (FFMPEG) console.log(`[mp3] using ffmpeg: ${FFMPEG}`);
else
  console.warn(
    '[mp3] ffmpeg not found. MP3 transcoding needs it — install it ' +
      '(winget install yt-dlp.FFmpeg) or set FFMPEG_PATH.',
  );

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);

  if (url.pathname !== '/api/download') {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }

  const videoId = url.searchParams.get('videoId') ?? '';
  if (!/^[\w-]{11}$/.test(videoId)) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Invalid videoId');
    return;
  }

  const rawTitle = url.searchParams.get('title') ?? videoId;
  const safeTitle =
    rawTitle.replace(/[\\/:*?"<>|]+/g, '_').trim().slice(0, 120) || videoId;
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  console.log(`[mp3] downloading ${videoId} — "${safeTitle}"`);

  if (!YT_DLP) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(
      'yt-dlp is not installed or not found. Install it with ' +
        '"winget install yt-dlp.yt-dlp" (restart the server after), or set ' +
        'the YT_DLP_PATH environment variable.',
    );
    return;
  }

  // yt-dlp: extract best audio, transcode to mp3, write to stdout ("-o -").
  const ytArgs = [
    '--no-playlist',
    '-f',
    'bestaudio/best',
    '-x',
    '--audio-format',
    'mp3',
    '--audio-quality',
    '0',
  ];
  // Point yt-dlp at ffmpeg when it isn't on PATH (needed for transcoding).
  if (FFMPEG) ytArgs.push('--ffmpeg-location', path.dirname(FFMPEG));
  ytArgs.push('-o', '-', videoUrl);

  const yt = spawn(YT_DLP, ytArgs, { windowsHide: true });

  res.writeHead(200, {
    'Content-Type': 'audio/mpeg',
    'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(
      safeTitle,
    )}.mp3`,
    'Cache-Control': 'no-store',
  });

  yt.stdout.pipe(res);

  // yt-dlp/ffmpeg progress + errors go to stderr; surface them in the console.
  yt.stderr.on('data', (chunk) => process.stderr.write(chunk));

  yt.on('error', (err) => {
    console.error('[mp3] failed to start yt-dlp:', err.message);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
    }
    res.end(`yt-dlp error: ${err.message}`);
  });

  yt.on('close', (code) => {
    if (code !== 0) console.error(`[mp3] yt-dlp exited with code ${code}`);
    res.end();
  });

  // If the browser cancels the download, stop the process.
  req.on('close', () => yt.kill());
});

server.listen(PORT, () => {
  console.log(`[mp3] helper listening on http://localhost:${PORT}`);
});
