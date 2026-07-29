import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { readdirSync } from 'fs';

const MUSIC_DIR = '/opt/navidrome/music';

export async function GET() {
  try {
    // Disk usage
    let diskTotal = '0';
    let diskUsed = '0';
    let diskFree = '0';
    let diskPercent = '0%';

    try {
      const df = execSync(`df -h ${MUSIC_DIR}`, { encoding: 'utf-8' });
      const dfLines = df.trim().split('\n');
      const dfData = dfLines[dfLines.length - 1].split(/\s+/);
      diskTotal = dfData[1] ?? '0';
      diskUsed = dfData[2] ?? '0';
      diskFree = dfData[3] ?? '0';
      diskPercent = dfData[4] ?? '0%';
    } catch {
      // df may not be available in some environments
    }

    // Track count
    let trackCount = 0;
    function countFiles(dir: string): void {
      try {
        const entries = readdirSync(dir, { withFileTypes: true });
        for (const e of entries) {
          const full = dir + '/' + e.name;
          if (e.isDirectory()) {
            countFiles(full);
          } else if (e.name.endsWith('.mp3')) {
            trackCount++;
          }
        }
      } catch {
        // Permission errors etc.
      }
    }
    countFiles(MUSIC_DIR);

    // Active downloads (from global)
    const activeDownloads = (globalThis as any).__activeDownloads ?? 0;

    // Total completed downloads (from global)
    const totalDownloads = (globalThis as any).__totalDownloads ?? 0;

    return NextResponse.json({
      diskTotal,
      diskUsed,
      diskFree,
      diskPercent,
      trackCount,
      activeDownloads,
      totalDownloads,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Stats fehlgeschlagen';
    console.error('Admin stats error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
