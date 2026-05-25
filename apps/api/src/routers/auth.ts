import { router, publicProcedure } from '../trpc.js';

// ============================================================
// Auth Router Helper (tRPC side)
// ============================================================

export const authRouter = router({
  // Helper to query session status from tRPC (Better-Auth handles routes via Hono endpoint)
  session: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user || !ctx.session) {
      return {
        user: null,
        session: null,
      };
    }

    return {
      user: ctx.user,
      session: ctx.session,
    };
  }),
});
