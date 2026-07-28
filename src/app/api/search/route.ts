import { type NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';

interface YtDlpEntry {
  id?: string;
  title?: string;
  duration?: number;
  channel?: string;
  uploader?: string;
  thumbnail?: string;
  url?: string;
}

interface SearchResult {
  id: string;
  title: string;
  duration: number;
  duration_str: string;
  channel: string;
  url: string;
  thumbnail: string;
}

const SEARCH_SOURCES: Record<string, string> = {
  youtube: 'ytsearch',
  soundcloud: 'scsearch',
  bandcamp: 'bcsearch',
  vimeo: 'vimeosearch',
};

function formatDuration(duration: number): string {
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function buildUrl(id: string, source: string): string {
  switch (source) {
    case 'soundcloud':
      return `https://soundcloud.com/${id}`;
    case 'bandcamp':
      return `https://${id}`;
    case 'vimeo':
      return `https://vimeo.com/${id}`;
    default:
      return `https://www.youtube.com/watch?v=${id}`;
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const q = request.nextUrl.searchParams.get('q')?.trim();
  const source = request.nextUrl.searchParams.get('source') || 'youtube';

  if (!q || q.length < 2) {
    return NextResponse.json(
      { error: 'Mindestens 2 Zeichen eingeben' },
      { status: 400 }
    );
  }

  const prefix = SEARCH_SOURCES[source] || 'ytsearch';
  const escapedQuery = q.replace(/"/g, '\\"');

  try {
    const stdout = execSync(
      `yt-dlp --dump-json --flat-playlist "${prefix}10:${escapedQuery}"`,
      { timeout: 30000, encoding: 'utf-8' }
    );

    const results: SearchResult[] = stdout
      .trim()
      .split('\n')
      .filter((line) => line.length > 0)
      .map((line) => {
        const data: YtDlpEntry = JSON.parse(line);
        const duration = data.duration ?? 0;
        const id = data.id ?? '';
        return {
          id,
          title: data.title ?? 'Unknown',
          duration,
          duration_str: formatDuration(duration),
          channel: data.channel ?? data.uploader ?? 'Unknown',
          url: buildUrl(id, source),
          thumbnail: data.thumbnail ?? '',
        };
      });

    return NextResponse.json({ results, source });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Search error:', message);
    return NextResponse.json(
      { error: 'Suche fehlgeschlagen', results: [] },
      { status: 500 }
    );
  }
}
