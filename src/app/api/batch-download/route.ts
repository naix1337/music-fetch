import { type NextRequest, NextResponse } from 'next/server';
import { spawn, spawnSync } from 'child_process';

function safePath(s: string): string {
  return s
    .replace(/[\\/*?:"<>|$;`(){}[\]!&#~]/g, '_')
    .replace(/\.\./g, '_')
    .replace(/\//g, '_')
    .trim()
    .substring(0, 120) || 'Unknown';
}
import {
  type DownloadTask,
  type BatchTrack,
  type BatchRequestBody,
  getDownloadTasks,
  incrementActive,
  decrementActive,
  generateTaskId,
  canStartDownload,
} from '@/lib/download-state';

interface BatchTaskInfo {
  task_id: string;
  title: string;
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

  let stdout = '';

  ytProcess.stdout?.on('data', (data: Buffer) => {
    stdout += data.toString();
    task.progress = Math.min(task.progress + 10, 90);
  });

  ytProcess.stderr?.on('data', (_data: Buffer) => {
    task.progress = Math.min(task.progress + 5, 80);
  });

  ytProcess.on('error', (err: Error) => {
    task.status = 'error';
    task.error = err.message;
    decrementActive();
    processQueue();
  });

  ytProcess.on('close', (code: number | null) => {
    if (code === 0) {
      const lines = stdout.trim().split('\n');
      const filename = lines.length > 0 ? lines[lines.length - 1] : '';
      task.status = 'completed';
      task.progress = 100;
      task.result = {
        title: task.title,
        channel: task.channel,
        url: task.url,
        file: filename,
      };

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
      timeout: 10000, stdio: 'ignore',
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
    const body: BatchRequestBody = await request.json();
    const tracks: BatchTrack[] = body.tracks ?? [];

    if (tracks.length === 0) {
      return NextResponse.json(
        { error: 'Keine Tracks angegeben' },
        { status: 400 }
      );
    }

    const tasksInfo: BatchTaskInfo[] = [];
    const downloadTasks = getDownloadTasks();

    for (const track of tracks) {
      const url = track.url?.trim();
      if (!url || !url.startsWith('http')) {
        continue;
      }

      const taskId = generateTaskId();
      const title = track.title?.trim() || 'Unknown';
      const channel = track.channel?.trim() || 'Unknown';

      const task: DownloadTask = {
        status: 'pending',
        progress: 0,
        url,
        title,
        channel,
      };

      downloadTasks.set(taskId, task);
      tasksInfo.push({ task_id: taskId, title });
    }

    processQueue();

    return NextResponse.json({ tasks: tasksInfo }, { status: 202 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Invalid request body';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
