import 'server-only';
import crypto from 'node:crypto';
import { getSql } from '@/db/client';
import { getCurrentCustomer } from '@/lib/customer';
import { appError } from '@/lib/http';

export const NEWSLETTER_CONSENT_TEXT = 'I agree to receive NikkiBee style updates and marketing emails. I can unsubscribe at any time.';

export async function subscribeToNewsletter(email) {
  const { MAILCHIMP_API_KEY, MAILCHIMP_SERVER_PREFIX, MAILCHIMP_AUDIENCE_ID } = process.env;
  if (!MAILCHIMP_API_KEY || !MAILCHIMP_SERVER_PREFIX || !MAILCHIMP_AUDIENCE_ID) throw appError('Newsletter signup is not configured yet.', 503);
  const normalized = email.trim().toLowerCase();
  const hash = crypto.createHash('md5').update(normalized).digest('hex');
  const response = await fetch(`https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members/${hash}`, {
    method: 'PUT',
    headers: { Authorization: `Basic ${Buffer.from(`nikkibee:${MAILCHIMP_API_KEY}`).toString('base64')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email_address: normalized, status_if_new: 'pending' }),
    cache: 'no-store',
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw appError(body.detail || 'Mailchimp could not accept this subscription.', 502);
  }
  const customer = await getCurrentCustomer();
  await getSql()`
    INSERT INTO marketing_consents (customer_id, email, consented, consent_text, provider_status, metadata)
    VALUES (${customer?.id || null}, ${normalized}, true, ${NEWSLETTER_CONSENT_TEXT}, 'pending', ${{ doubleOptIn: true }})
  `;
  return { status: 'pending', message: 'Check your inbox to confirm your subscription.' };
}
