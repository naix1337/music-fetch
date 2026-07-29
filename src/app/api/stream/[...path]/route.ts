import { type NextRequest, NextResponse } from 'next/server';
import { statSync, createReadStream, existsSync } from 'fs';
import { join, normalize, relative } from 'path';

const MUSIC_DIR = '/opt/navidrome/music';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  try {
    const { path: pathSegments } = await params;
    if (!pathSegments || pathSegments.length === 0) {
      return NextResponse.json({ error: 'Kein Dateipfad angegeben' }, { status: 400 });
    }

    // Security: ensure path stays within MUSIC_DIR
    const requestedPath = '/' + pathSegments.join('/');
    const normalized = normalize(requestedPath);
    const fullPath = join(MUSIC_DIR, normalized);
    const relativePath = relative(MUSIC_DIR, fullPath);

    if (relativePath.startsWith('..') || relativePath.startsWith('/')) {
      return NextResponse.json({ error: 'Ungultiger Pfad' }, { status: 403 });
    }

    if (!existsSync(fullPath)) {
      return NextResponse.json({ error: 'Datei nicht gefunden' }, { status: 404 });
    }

    const stats = statSync(fullPath);
    const fileSize = stats.size;
    const ext = pathSegments[pathSegments.length - 1]?.toLowerCase() ?? '';

    const mimeTypes: Record<string, string> = {
      mp3: 'audio/mpeg',
      m4a: 'audio/mp4',
      flac: 'audio/flac',
      ogg: 'audio/ogg',
      opus: 'audio/ogg',
      wav: 'audio/wav',
    };

    const mimeType = mimeTypes[ext] || 'audio/mpeg';

    // Handle Range headers for seeking/scrubbing
    const rangeHeader = _request.headers.get('range');

    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            'Content-Range': `bytes */${fileSize}`,
          },
        });
      }

      const chunkSize = end - start + 1;
      const stream = createReadStream(fullPath, { start, end });

      return new NextResponse(stream as unknown as ReadableStream, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(chunkSize),
          'Content-Type': mimeType,
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Full file stream
    const stream = createReadStream(fullPath);
    return new NextResponse(stream as unknown as ReadableStream, {
      status: 200,
      headers: {
        'Content-Length': String(fileSize),
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Streaming fehlgeschlagen';
    console.error('Stream error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
