import { NextResponse } from 'next/server';
import { readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

interface TrackInfo {
  path: string;
  title: string;
  artist: string;
  album: string;
  size_mb: number;
}

const AUDIO_EXTENSIONS = new Set([
  '.mp3',
  '.m4a',
  '.flac',
  '.ogg',
  '.opus',
  '.wav',
]);

const MUSIC_DIR = '/opt/navidrome/music';

function parseTitle(filename: string): string {
  const withoutExt = filename.replace(/\.[^/.]+$/, '');
  return withoutExt.replace(/[_-]/g, ' ').trim() || filename;
}

function extractTags(filepath: string): {
  title: string;
  artist: string;
  album: string;
} {
  const parts = filepath.replace(MUSIC_DIR, '').split('/').filter(Boolean);

  let title = parseTitle(filepath.split('/').pop() || filepath);
  let artist = 'Unknown';
  let album = 'Unknown';

  if (parts.length >= 2) {
    artist = parts[parts.length - 2] || 'Unknown';
  }
  if (parts.length >= 3) {
    album = parts[parts.length - 3] || 'Unknown';
  }

  return { title, artist, album };
}

function scanDirectory(dir: string, maxDepth: number = 5): TrackInfo[] {
  const tracks: TrackInfo[] = [];

  try {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory() && maxDepth > 0) {
        tracks.push(...scanDirectory(fullPath, maxDepth - 1));
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase();
        if (AUDIO_EXTENSIONS.has(ext)) {
          try {
            const stats = statSync(fullPath);
            const tags = extractTags(fullPath);
            tracks.push({
              path: fullPath,
              title: tags.title,
              artist: tags.artist,
              album: tags.album,
              size_mb: parseFloat((stats.size / (1024 * 1024)).toFixed(2)),
            });
          } catch {
            console.error('Could not read file:', fullPath);
          }
        }
      }
    }
  } catch (err) {
    console.error('Error scanning directory:', dir, err);
  }

  return tracks;
}

export async function GET(): Promise<NextResponse> {
  try {
    const tracks = scanDirectory(MUSIC_DIR);
    return NextResponse.json({ tracks });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Library scan error:', message);
    return NextResponse.json(
      { error: 'Library scan fehlgeschlagen', tracks: [] },
      { status: 500 }
    );
  }
}
