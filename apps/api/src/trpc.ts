import { initTRPC, TRPCError } from '@trpc/server';
import { type Context } from './context.js';
import superjson from 'superjson';

// ============================================================
// tRPC Initialization
// ============================================================

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof Error && 'flatten' in error.cause
            ? (error.cause as { flatten: () => unknown }).flatten()
            : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;

// ------ Auth middleware ------

const isAuthenticated = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }
  return next({ ctx: { ...ctx, session: ctx.session, user: ctx.user } });
});

// ------ Role-based middleware ------

function requireRole(...roles: string[]) {
  return t.middleware(({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    if (!roles.includes(ctx.user.role)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Access denied. Required role: ${roles.join(' or ')}`,
      });
    }
    return next({ ctx });
  });
}

export const protectedProcedure = t.procedure.use(isAuthenticated);

export const vendorProcedure = t.procedure
  .use(isAuthenticated)
  .use(requireRole('vendor', 'admin', 'super_admin'));

export const riderProcedure = t.procedure
  .use(isAuthenticated)
  .use(requireRole('rider', 'admin', 'super_admin'));

export const adminProcedure = t.procedure
  .use(isAuthenticated)
  .use(requireRole('admin', 'super_admin'));
