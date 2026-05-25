import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { getServerEnv } from '@repo/config';

// ============================================================
// BullMQ — Notification Job Queue
// ============================================================

export type NotificationJobData =
  | {
      type: 'order_status';
      userId: string;
      orderId: string;
      orderNumber: string;
      status: string;
      restaurantName: string;
    }
  | {
      type: 'new_order';
      restaurantId: string;
      ownerId: string;
      orderId: string;
      orderNumber: string;
    }
  | {
      type: 'rider_assigned';
      userId: string;
      orderId: string;
      orderNumber: string;
      riderName: string;
    }
  | {
      type: 'push';
      userId: string;
      title: string;
      body: string;
      data?: Record<string, string>;
    };

let redisConnection: IORedis | null = null;

export function getRedisConnection(): IORedis {
  if (redisConnection) return redisConnection;
  const env = getServerEnv();
  redisConnection = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
  });
  return redisConnection;
}

// ---- Queue ----

export const notificationQueue = new Queue<NotificationJobData>('notifications', {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
});

// ---- Helpers to enqueue common jobs ----

export async function enqueueOrderStatusNotification(
  userId: string,
  orderId: string,
  orderNumber: string,
  status: string,
  restaurantName: string,
): Promise<void> {
  await notificationQueue.add('order_status', {
    type: 'order_status',
    userId,
    orderId,
    orderNumber,
    status,
    restaurantName,
  });
}

export async function enqueueNewOrderNotification(
  restaurantId: string,
  ownerId: string,
  orderId: string,
  orderNumber: string,
): Promise<void> {
  await notificationQueue.add('new_order', {
    type: 'new_order',
    restaurantId,
    ownerId,
    orderId,
    orderNumber,
  });
}

export async function enqueuePushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  await notificationQueue.add('push', {
    type: 'push',
    userId,
    title,
    body,
    ...(data ? { data } : {}),
  });
}
