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

interface TrackResult {
  id: string;
  title: string;
  duration: number;
  duration_str: string;
  channel: string;
  url: string;
  thumbnail: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { title, artist } = await request.json();
    if (!title) {
      return NextResponse.json({ error: 'Kein Titel' }, { status: 400 });
    }

    const query = `${title} ${artist || ''} similar`.trim();

    const result = spawnSync('yt-dlp', [
      '--dump-json', '--flat-playlist',
      `ytsearch10:${query}`,
    ], { timeout: 30000, stdio: ['ignore', 'pipe', 'pipe'], shell: false });

    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`yt-dlp exit code ${result.status}`);

    const stdout = result.stdout?.toString('utf-8') || '';

    const tracks: TrackResult[] = stdout.trim().split('\n').filter(Boolean).map(line => {
      const data: YtDlpEntry = JSON.parse(line);
      const duration = data.duration ?? 0;
      const id = data.id ?? '';
      return {
        id,
        title: data.title ?? 'Unknown',
        duration,
        duration_str: `${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, '0')}`,
        channel: data.channel ?? data.uploader ?? 'Unknown',
        url: `https://www.youtube.com/watch?v=${id}`,
        thumbnail: data.thumbnail ?? '',
      };
    });

    return NextResponse.json({ tracks });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('Recommendations error:', message);
    return NextResponse.json({ error: 'Fehler', tracks: [] }, { status: 500 });
  }
}
