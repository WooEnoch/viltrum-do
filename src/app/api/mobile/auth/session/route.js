import { getMobileSession, revokeMobileSession } from '@/lib/mobile-auth';
import { jsonError } from '@/lib/http';

export async function GET() {
  try {
    const session = await getMobileSession();
    if (!session) return Response.json({ error: 'Your session has expired.' }, { status: 401 });
    return Response.json({ user: session.user });
  } catch (error) {
    return jsonError(error, 'Your session could not be loaded.');
  }
}

export async function DELETE() {
  try {
    await revokeMobileSession();
    return new Response(null, { status: 204 });
  } catch (error) {
    return jsonError(error, 'Sign out could not be completed.');
  }
}
