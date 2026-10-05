import { z } from 'zod';
import { authenticateGoogleMobile } from '@/lib/mobile-auth';
import { jsonError } from '@/lib/http';

const schema = z.object({ idToken: z.string().min(100).max(10000) });

export async function POST(request) {
  try {
    return Response.json(await authenticateGoogleMobile(schema.parse(await request.json()).idToken), { status: 201 });
  } catch (error) {
    return jsonError(error, 'Google sign-in could not be completed.');
  }
}
