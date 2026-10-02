import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { eq } from 'drizzle-orm';
import { getDb, isDatabaseConfigured } from '@/db/client';
import { accounts, customers, sessions, users, verificationTokens } from '@/db/schema';
import { sendWelcomeEmail } from '@/lib/email';

const configured = isDatabaseConfigured();

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || (process.env.NODE_ENV === 'development' ? 'nikkibee-local-preview-only' : undefined),
  adapter: configured ? DrizzleAdapter(getDb(), {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }) : undefined,
  providers: [Google],
  session: { strategy: configured ? 'database' : 'jwt' },
  pages: { signIn: '/signin', error: '/signin' },
  trustHost: true,
  callbacks: {
    async session({ session, user, token }) {
      const authUserId = user?.id || token?.sub;
      if (session.user && authUserId) {
        session.user.id = authUserId;
        if (configured) {
          const [customer] = await getDb().select({ id: customers.id }).from(customers).where(eq(customers.authUserId, authUserId)).limit(1);
          session.user.customerId = customer?.id;
        }
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!configured || !user.email) return;
      await getDb().insert(customers).values({
        authUserId: user.id,
        email: user.email.toLowerCase(),
        displayName: user.name,
        imageUrl: user.image,
      }).onConflictDoNothing();
      try { await sendWelcomeEmail({ email: user.email, name: user.name }); } catch (error) { console.error('Welcome email failed', error); }
    },
  },
});
