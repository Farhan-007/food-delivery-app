import type { HonoRequest } from 'hono';
import type { Server as SocketIOServer } from 'socket.io';
import { eq } from 'drizzle-orm';
import { auth } from '@repo/auth';
import { db } from '@repo/db/client';
import { users } from '@repo/db';
import type { User } from '@repo/types';

// ============================================================
// tRPC Context
// ============================================================

export interface Context {
  req: HonoRequest;
  user: (User & { id: string }) | null;
  session: { id: string; userId: string; expiresAt: Date } | null;
  db: typeof db;
  io: SocketIOServer | null;
}

export function createContextFactory(io: SocketIOServer) {
  return async function createContext(req: HonoRequest): Promise<Context> {
    let user: Context['user'] = null;
    let session: Context['session'] = null;

    try {
      // Better-Auth session from request
      const authSession = await auth.api.getSession({
        headers: req.raw.headers,
      });

      if (authSession?.user && authSession?.session) {
        // Fetch real user role + status from our DB (Better-Auth only stores basic fields)
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, authSession.user.id),
          columns: {
            id: true,
            email: true,
            phone: true,
            name: true,
            avatarUrl: true,
            role: true,
            isActive: true,
            emailVerified: true,
            phoneVerified: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        user = {
          id: authSession.user.id,
          email: authSession.user.email,
          name: authSession.user.name,
          phone: dbUser?.phone ?? null,
          avatarUrl: dbUser?.avatarUrl ?? authSession.user.image ?? null,
          // Use DB role — defaults to 'customer' if user not yet synced
          role: dbUser?.role ?? 'customer',
          isActive: dbUser?.isActive ?? true,
          emailVerified: authSession.user.emailVerified,
          phoneVerified: dbUser?.phoneVerified ?? false,
          createdAt: dbUser?.createdAt ?? new Date(),
          updatedAt: dbUser?.updatedAt ?? new Date(),
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

    return { req, user, session, db, io };
  };
}

// Backwards-compatible alias (used before io was available)
export async function createContext(req: HonoRequest): Promise<Context> {
  return createContextFactory(null as unknown as SocketIOServer)(req);
}
