import { type NextRequest, NextResponse } from 'next/server';
import { spawn, spawnSync } from 'child_process';
import { broadcast } from '@/app/api/events/route';
import {
  type DownloadTask,
  type DownloadRequestBody,
  getDownloadTasks,
  incrementActive,
  decrementActive,
  incrementCompleted,
  generateTaskId,
  canStartDownload,
} from '@/lib/download-state';

function safePath(s: string): string {
  return s
    .replace(/[\\/*?:"<>|$;`(){}[\]!&#~]/g, '_')
    .replace(/\.\./g, '_')
    .replace(/\//g, '_')
    .trim()
    .substring(0, 120) || 'Unknown';
}

function startDownload(taskId: string): void {
  const tasks = getDownloadTasks();
  const task = tasks.get(taskId);
  if (!task) return;

  task.status = 'downloading';
  task.progress = 0;
  incrementActive();

  const artist = safePath(task.channel || 'Unknown Artist');
  const outputDir = `/opt/navidrome/music/${artist}`;

  const ytProcess = spawn(
    'yt-dlp',
    [
      '-x',
      '--audio-format', 'mp3',
      '--audio-quality', '0',
      '--embed-metadata',
      '--embed-thumbnail',
      '--parse-metadata', 'uploader:%(artist)s',
      '--parse-metadata', '%(title)s:%(album)s',
      '-o', `${outputDir}/%(title)s.%(ext)s`,
      '--no-playlist',
      task.url,
    ],
    {
      shell: false,
      timeout: 300000,
    }
  );

  ytProcess.stdout?.on('data', () => {
    task.progress = Math.min(task.progress + 10, 90);
    broadcast('download-update', { taskId, status: 'downloading', progress: task.progress });
  });

  ytProcess.stderr?.on('data', (data: Buffer) => {
    const line = data.toString('utf-8');
    // Parse yt-dlp progress: [download]  45.3% of 3.45MiB at 1.23MiB/s ETA 00:02
    const match = line.match(/(\d+(?:\.\d+)?)%/);
    if (match) {
      const pct = Math.min(Math.round(parseFloat(match[1])), 99);
      task.progress = pct;
      broadcast('download-update', { taskId, status: 'downloading', progress: pct });
    }
  });

  ytProcess.on('error', (err: Error) => {
    task.status = 'error';
    task.error = err.message;
    broadcast('download-update', { taskId, status: 'error', error: err.message });
    decrementActive();
    processQueue();
  });

  ytProcess.on('close', (code: number | null) => {
    if (code === 0) {
      task.status = 'completed';
      task.progress = 100;
      broadcast('download-update', { taskId, status: 'completed', progress: 100 });
      task.result = {
        title: task.title,
        channel: task.channel,
        url: task.url,
        file: outputDir,
      };

      incrementCompleted();
      runPostDownload(outputDir);
    } else {
      task.status = 'error';
      task.error = `yt-dlp exited with code ${code}`;
    }

    decrementActive();
    processQueue();
  });
}

function runPostDownload(dir: string): void {
  try {
    spawnSync('chown', ['-R', 'navidrome:navidrome', dir], {
      timeout: 10000,
      stdio: 'ignore',
    });
  } catch (err) {
    console.error('chown error:', err);
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    spawnSync('su', [
      '-s', '/bin/sh', 'navidrome', '-c',
      `touch /opt/navidrome/music/.scan-${timestamp}`,
    ], { timeout: 10000, stdio: 'ignore' });
  } catch (err) {
    console.error('scan trigger error:', err);
  }
}

function processQueue(): void {
  if (!canStartDownload()) return;

  const tasks = getDownloadTasks();
  let nextTaskId: string | null = null;

  for (const [id, task] of tasks) {
    if (task.status === 'pending') {
      nextTaskId = id;
      break;
    }
  }

  if (nextTaskId) {
    startDownload(nextTaskId);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: DownloadRequestBody = await request.json();
    const url = body.url?.trim();
    const title = body.title?.trim() || 'Unknown';
    const channel = body.channel?.trim() || 'Unknown';

    if (!url || !url.startsWith('http')) {
      return NextResponse.json({ error: 'Ungultige URL' }, { status: 400 });
    }

    const taskId = generateTaskId();
    const tasks = getDownloadTasks();

    const task: DownloadTask = {
      status: 'pending',
      progress: 0,
      url,
      title,
      channel,
    };

    tasks.set(taskId, task);
    processQueue();

    return NextResponse.json({ task_id: taskId }, { status: 202 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Invalid request body';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
