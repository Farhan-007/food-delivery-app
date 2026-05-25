import type { HonoRequest } from 'hono';
import { auth } from '@repo/auth';
import { db } from '@repo/db/client';
import type { User } from '@repo/types';

// ============================================================
// tRPC Context
// ============================================================

export interface Context {
  req: HonoRequest;
  user: (User & { id: string }) | null;
  session: { id: string; userId: string; expiresAt: Date } | null;
  db: typeof db;
}

export async function createContext(req: HonoRequest): Promise<Context> {
  let user: Context['user'] = null;
  let session: Context['session'] = null;

  try {
    // Better-Auth session from request
    const authSession = await auth.api.getSession({
      headers: req.raw.headers,
    });

    if (authSession?.user && authSession?.session) {
      user = {
        id: authSession.user.id,
        email: authSession.user.email,
        name: authSession.user.name,
        // Map Better-Auth user to our User type
        // Additional fields come from DB if needed
        phone: null,
        avatarUrl: authSession.user.image ?? null,
        role: 'customer', // Will be enriched from DB in protectedProcedure
        isActive: true,
        emailVerified: authSession.user.emailVerified,
        phoneVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      session = {
        id: authSession.session.id,
        userId: authSession.session.userId,
        expiresAt: authSession.session.expiresAt,
      };
    }
  } catch {
    // Not authenticated — context will have null user/session
  }

  return { req, user, session, db };
}
