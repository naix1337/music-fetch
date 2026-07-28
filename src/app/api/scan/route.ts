import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export async function POST(): Promise<NextResponse> {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    execSync(
      `su -s /bin/sh navidrome -c "touch /opt/navidrome/music/.scan-${timestamp}"`,
      { timeout: 10000, shell: '/bin/sh' }
    );
    return NextResponse.json({ scanned: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Scan trigger error:', message);
    return NextResponse.json({ scanned: false, error: message }, { status: 500 });
  }
}
