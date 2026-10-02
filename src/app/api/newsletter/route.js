import { z } from 'zod';
import { jsonError } from '@/lib/http';
import { subscribeToNewsletter } from '@/lib/newsletter';

const schema = z.object({ email: z.string().trim().email().max(254), marketingConsent: z.literal(true) });

export async function POST(request) {
  try {
    const { email } = schema.parse(await request.json());
    return Response.json(await subscribeToNewsletter(email), { status: 201 });
  } catch (error) { return jsonError(error, 'Newsletter signup failed.'); }
}
