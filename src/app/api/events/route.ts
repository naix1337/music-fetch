import { NextRequest } from 'next/server';

// Store connected SSE clients
const clients = new Set<(data: string) => void>();

export function broadcast(event: string, data: any): void {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const send of clients) {
    try { send(msg); } catch { clients.delete(send); }
  }
}

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(encoder.encode('event: connected\ndata: {}\n\n'));

      const send = (msg: string) => {
        try {
          controller.enqueue(encoder.encode(msg));
        } catch {
          clients.delete(send);
        }
      };

      clients.add(send);

      // Keep-alive every 30s
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(':keepalive\n\n'));
        } catch {
          clearInterval(keepAlive);
          clients.delete(send);
        }
      }, 30000);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(keepAlive);
        clients.delete(send);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
