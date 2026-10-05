import 'server-only';
import crypto from 'node:crypto';
import { headers } from 'next/headers';
import { OAuth2Client } from 'google-auth-library';
import { getSql } from '@/db/client';
import { appError } from '@/lib/http';
import { sendWelcomeEmail } from '@/lib/email';

const google = new OAuth2Client();
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

function publicCustomer(row) {
  return { id: row.id, email: row.email, name: row.display_name, image: row.image_url };
}

export async function authenticateGoogleMobile(idToken) {
  const audience = [process.env.AUTH_GOOGLE_ID, process.env.MOBILE_GOOGLE_CLIENT_ID].filter(Boolean);
  if (!audience.length) throw appError('Google sign-in is not configured.', 503);
  const ticket = await google.verifyIdToken({ idToken, audience });
  const profile = ticket.getPayload();
  if (!profile?.sub || !profile.email || !profile.email_verified) throw appError('Google could not verify this account.', 401);

  const email = profile.email.toLowerCase();
  const sql = getSql();
  const result = await sql.begin(async (tx) => {
    let linked = await tx`
      SELECT u.id FROM auth_accounts a
      JOIN auth_users u ON u.id = a.user_id
      WHERE a.provider = 'google' AND a.provider_account_id = ${profile.sub}
      LIMIT 1
    `;
    if (!linked[0]) linked = await tx`SELECT id FROM auth_users WHERE lower(email) = ${email} LIMIT 1`;

    let isNew = false;
    let userId = linked[0]?.id;
    if (!userId) {
      isNew = true;
      const users = await tx`
        INSERT INTO auth_users (name, email, email_verified, image)
        VALUES (${profile.name || email}, ${email}, now(), ${profile.picture || null})
        RETURNING id
      `;
      userId = users[0].id;
    } else {
      await tx`UPDATE auth_users SET name = ${profile.name || email}, image = ${profile.picture || null}, email_verified = COALESCE(email_verified, now()) WHERE id = ${userId}`;
    }

    await tx`
      INSERT INTO auth_accounts (user_id, type, provider, provider_account_id)
      VALUES (${userId}, 'oidc', 'google', ${profile.sub})
      ON CONFLICT (provider, provider_account_id) DO NOTHING
    `;
    const customers = await tx`
      INSERT INTO customers (auth_user_id, email, display_name, image_url)
      VALUES (${userId}, ${email}, ${profile.name || email}, ${profile.picture || null})
      ON CONFLICT (auth_user_id) DO UPDATE
      SET email = EXCLUDED.email, display_name = EXCLUDED.display_name, image_url = EXCLUDED.image_url, updated_at = now()
      RETURNING id, email, display_name, image_url
    `;
    return { customer: customers[0], isNew };
  });

  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 90);
  await sql`
    INSERT INTO mobile_sessions (customer_id, token_hash, expires_at)
    VALUES (${result.customer.id}, ${hashToken(token)}, ${expiresAt})
  `;
  if (result.isNew) {
    try { await sendWelcomeEmail({ email, name: profile.name }); } catch (error) { console.error('Welcome email failed', error); }
  }
  return { token, expiresAt: expiresAt.toISOString(), user: publicCustomer(result.customer) };
}

export async function getMobileSession() {
  const authorization = (await headers()).get('authorization');
  if (!authorization?.startsWith('Bearer ')) return null;
  const token = authorization.slice(7).trim();
  if (!token) return null;
  const sql = getSql();
  const rows = await sql`
    SELECT ms.id AS session_id, c.id, c.email, c.display_name, c.image_url
    FROM mobile_sessions ms
    JOIN customers c ON c.id = ms.customer_id
    WHERE ms.token_hash = ${hashToken(token)} AND ms.expires_at > now()
    LIMIT 1
  `;
  if (!rows[0]) return null;
  await sql`UPDATE mobile_sessions SET last_used_at = now() WHERE id = ${rows[0].session_id}`;
  return { customer: rows[0], user: publicCustomer(rows[0]) };
}

export async function revokeMobileSession() {
  const authorization = (await headers()).get('authorization');
  if (!authorization?.startsWith('Bearer ')) return;
  await getSql()`DELETE FROM mobile_sessions WHERE token_hash = ${hashToken(authorization.slice(7).trim())}`;
}
