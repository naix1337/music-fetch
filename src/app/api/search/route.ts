import { type NextRequest, NextResponse } from 'next/server';
import { spawnSync } from 'child_process';
import { writeFileSync, unlinkSync, mkdtempSync, readFileSync } from 'fs';
import { join } from 'path';

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
};

function formatDuration(duration: number): string {
  const totalSec = Math.round(duration);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
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
  const tmpDir = mkdtempSync('/tmp/mf-');
  const tmpFile = join(tmpDir, 'results.json');

  try {
    const result = spawnSync('yt-dlp', [
      '--dump-json',
      '--flat-playlist',
      `${prefix}10:${q}`,
    ], {
      timeout: 30000,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    });

    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`yt-dlp exit code ${result.status}`);

    const stdout = result.stdout?.toString('utf-8') || '';

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
          url: data.webpage_url ?? data.url ?? '',
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
