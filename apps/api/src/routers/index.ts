import { router } from '../trpc.js';
import { restaurantRouter } from './restaurant.js';
import { menuRouter } from './menu.js';
import { orderRouter } from './order.js';
import { userRouter } from './user.js';
import { riderRouter } from './rider.js';
import { adminRouter } from './admin.js';
import { couponRouter } from './coupon.js';
import { uploadRouter } from './upload.js';

// ============================================================
// Root tRPC Router
// ============================================================

export const appRouter = router({
  restaurant: restaurantRouter,
  menu: menuRouter,
  order: orderRouter,
  user: userRouter,
  rider: riderRouter,
  admin: adminRouter,
  coupon: couponRouter,
  upload: uploadRouter,
});

export type AppRouter = typeof appRouter;
