import 'server-only';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { getDb } from '@/db/client';
import { customers } from '@/db/schema';
import { getMobileSession } from '@/lib/mobile-auth';

export async function getCurrentCustomer() {
  const mobile = await getMobileSession();
  if (mobile?.customer) return mobile.customer;
  const session = await auth();
  if (!session?.user?.id || !session.user.email) return null;
  const db = getDb();
  let [customer] = await db.select().from(customers).where(eq(customers.authUserId, session.user.id)).limit(1);
  if (!customer) {
    [customer] = await db.insert(customers).values({
      authUserId: session.user.id,
      email: session.user.email.toLowerCase(),
      displayName: session.user.name,
      imageUrl: session.user.image,
    }).onConflictDoUpdate({
      target: customers.authUserId,
      set: { email: session.user.email.toLowerCase(), displayName: session.user.name, imageUrl: session.user.image, updatedAt: new Date() },
    }).returning();
  }
  return customer;
}

export async function requireCustomer() {
  const customer = await getCurrentCustomer();
  if (!customer) {
    const error = new Error('Sign in is required.');
    error.status = 401;
    throw error;
  }
  return customer;
}
