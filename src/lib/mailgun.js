const US_API = 'https://api.mailgun.net';

export function mailgunConfigured() {
  return Boolean(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN && process.env.EMAIL_FROM);
}

export async function sendMailgunMessage({ to, subject, html, text, tag }) {
  if (!mailgunConfigured() || !to) return { skipped: true };
  const apiBase = (process.env.MAILGUN_API_BASE_URL || US_API).replace(/\/$/, '');
  const form = new FormData();
  form.set('from', process.env.EMAIL_FROM);
  form.set('to', to);
  form.set('subject', subject);
  form.set('html', html);
  form.set('text', text);
  form.set('o:require-tls', 'yes');
  if (tag) form.set('o:tag', tag);
  const response = await fetch(`${apiBase}/v3/${encodeURIComponent(process.env.MAILGUN_DOMAIN)}/messages`, {
    method: 'POST',
    headers: { Authorization: `Basic ${Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString('base64')}` },
    body: form,
    cache: 'no-store',
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.message || `Mailgun rejected the message (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return { id: body.id, message: body.message };
}

export async function getMailgunEvents({ messageId, event = 'delivered' }) {
  if (!mailgunConfigured()) return [];
  const apiBase = (process.env.MAILGUN_API_BASE_URL || US_API).replace(/\/$/, '');
  const query = new URLSearchParams({ 'message-id': messageId.replace(/^<|>$/g, ''), event, limit: '10' });
  const response = await fetch(`${apiBase}/v3/${encodeURIComponent(process.env.MAILGUN_DOMAIN)}/events?${query}`, {
    headers: { Authorization: `Basic ${Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString('base64')}` },
    cache: 'no-store',
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || `Mailgun events request failed (${response.status}).`);
  return body.items || [];
}
