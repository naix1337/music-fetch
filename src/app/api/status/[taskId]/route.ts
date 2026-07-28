import { type NextRequest, NextResponse } from 'next/server';
import { getDownloadTasks } from '@/lib/download-state';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
): Promise<NextResponse> {
  const { taskId } = await params;
  const tasks = getDownloadTasks();
  const task = tasks.get(taskId);

  if (!task) {
    return NextResponse.json(
      { error: 'Task nicht gefunden' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    status: task.status,
    progress: task.progress,
    error: task.error,
    result: task.result,
  });
}
