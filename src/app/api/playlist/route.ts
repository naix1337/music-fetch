import { type NextRequest, NextResponse } from 'next/server';
import { spawnSync } from 'child_process';

interface YtDlpEntry {
  id?: string;
  title?: string;
  duration?: number;
  channel?: string;
  uploader?: string;
  thumbnail?: string;
  url?: string;
  webpage_url?: string;
}

interface PlaylistTrack {
  id: string;
  title: string;
  duration: number;
  duration_str: string;
  channel: string;
  url: string;
  thumbnail: string;
}

interface PlaylistRequestBody {
  url?: string;
}

function formatDuration(duration: number): string {
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: PlaylistRequestBody = await request.json();
    const url = body.url?.trim();

    if (!url || !url.startsWith('http')) {
      return NextResponse.json({ error: 'Ungultige URL' }, { status: 400 });
    }

    const result = spawnSync('yt-dlp', [
      '--dump-json',
      '--flat-playlist',
      '--no-download',
      url,
    ], {
      timeout: 30000,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    });

    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`yt-dlp exited with code ${result.status}`);

    const stdout = result.stdout?.toString('utf-8') || '';

    const tracks: PlaylistTrack[] = stdout
      .trim()
      .split('\n')
      .filter((line) => line.length > 0)
      .map((line) => {
        const data: YtDlpEntry = JSON.parse(line);
        const duration = data.duration ?? 0;
        return {
          id: data.id ?? '',
          title: data.title ?? 'Unknown',
          duration,
          duration_str: formatDuration(duration),
          channel: data.channel ?? data.uploader ?? 'Unknown',
          url: data.webpage_url ?? data.url ?? '',
          thumbnail: data.thumbnail ?? '',
        };
      });

    return NextResponse.json({ tracks });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Playlist fetch error:', message);
    return NextResponse.json(
      { error: 'Playlist konnte nicht geladen werden', tracks: [] },
      { status: 500 }
    );
  }
}
