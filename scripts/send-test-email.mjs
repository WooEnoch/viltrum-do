import postgres from 'postgres';
import { welcomeEmailContent } from '../src/lib/email-content.js';
import { getMailgunEvents, mailgunConfigured, sendMailgunMessage } from '../src/lib/mailgun.js';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
if (!mailgunConfigured()) throw new Error('MAILGUN_API_KEY, MAILGUN_DOMAIN and EMAIL_FROM are required.');

const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
try {
  const recipients = await sql`SELECT email, display_name FROM customers ORDER BY updated_at DESC LIMIT 1`;
  if (!recipients[0]?.email) throw new Error('No customer email is available for the test.');
  const content = welcomeEmailContent({ name: recipients[0].display_name });
  const sent = await sendMailgunMessage({ to: recipients[0].email, subject: 'NikkiBee Mailgun delivery test', ...content, tag: 'integration-test' });
  if (!sent.id) throw new Error('Mailgun did not return a message ID.');
  console.log(JSON.stringify({ accepted: true, messageIdReceived: true }));
  for (let attempt = 0; attempt < 6; attempt += 1) {
    if (attempt) await new Promise((resolve) => setTimeout(resolve, 5000));
    const events = await getMailgunEvents({ messageId: sent.id });
    if (events.length) {
      console.log(JSON.stringify({ delivered: true, event: events[0].event }));
      process.exit(0);
    }
  }
  console.log(JSON.stringify({ delivered: false, reason: 'No delivered event appeared within 25 seconds.' }));
  process.exitCode = 2;
} finally {
  await sql.end();
}
