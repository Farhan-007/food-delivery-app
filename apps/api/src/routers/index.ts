import { router } from '../trpc.js';
import { authRouter } from './auth.js';
import { restaurantRouter } from './restaurant.js';
import { menuRouter } from './menu.js';
import { cartRouter } from './cart.js';
import { orderRouter } from './order.js';
import { userRouter } from './user.js';
import { riderRouter } from './rider.js';
import { storeRouter } from './store.js';
import { adminRouter } from './admin.js';
import { reviewRouter } from './review.js';
import { couponRouter } from './coupon.js';
import { notificationRouter } from './notification.js';
import { uploadRouter } from './upload.js';

// ============================================================
// Root tRPC Router
// ============================================================

export const appRouter = router({
  auth: authRouter,
  restaurant: restaurantRouter,
  menu: menuRouter,
  cart: cartRouter,
  order: orderRouter,
  user: userRouter,
  rider: riderRouter,
  store: storeRouter,
  admin: adminRouter,
  review: reviewRouter,
  coupon: couponRouter,
  notification: notificationRouter,
  upload: uploadRouter,
});

export type AppRouter = typeof appRouter;
