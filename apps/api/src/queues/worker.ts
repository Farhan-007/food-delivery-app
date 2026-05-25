import { Worker, type Job } from 'bullmq';
import { db } from '@repo/db/client';
import { notifications } from '@repo/db';
import { getServerEnv } from '@repo/config';
import { ORDER_STATUS_LABELS } from '@repo/config';
import { type NotificationJobData, getRedisConnection } from './index.js';

// ============================================================
// BullMQ Notification Worker
// ============================================================

type DBNotificationType =
  | 'order_placed'
  | 'order_accepted'
  | 'order_preparing'
  | 'order_ready'
  | 'order_picked_up'
  | 'order_delivered'
  | 'order_cancelled'
  | 'promo'
  | 'system';

function getNotificationType(status: string): DBNotificationType {
  switch (status) {
    case 'pending':
      return 'order_placed';
    case 'accepted':
      return 'order_accepted';
    case 'preparing':
      return 'order_preparing';
    case 'ready_for_pickup':
    case 'rider_assigned':
      return 'order_ready';
    case 'picked_up':
      return 'order_picked_up';
    case 'delivered':
      return 'order_delivered';
    case 'cancelled':
      return 'order_cancelled';
    default:
      return 'system';
  }
}

async function insertNotification(
  userId: string,
  title: string,
  body: string,
  type: DBNotificationType,
  data?: Record<string, unknown>,
): Promise<void> {
  try {
    await db.insert(notifications).values({
      userId,
      title,
      body,
      type,
      data: data ?? null,
    });
  } catch (err) {
    console.error('[Worker] Failed to insert notification:', err);
    throw err; // Re-throw to trigger BullMQ retry
  }
}

async function sendExpoPush(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  const env = getServerEnv();
  if (!env.EXPO_ACCESS_TOKEN) {
    console.log('[Worker] No EXPO_ACCESS_TOKEN — skipping push for', userId);
    return;
  }
  // In production, fetch user's Expo push token from DB and send
  console.log(`[Worker] Would send Expo push to ${userId}: ${title} — ${body} (data: ${JSON.stringify(data)})`);
}

async function processJob(job: Job<NotificationJobData>): Promise<void> {
  const { data } = job;

  switch (data.type) {
    case 'order_status': {
      const label =
        ORDER_STATUS_LABELS[data.status as keyof typeof ORDER_STATUS_LABELS] ?? data.status;
      const title = `Order Update`;
      const body = `Your order #${data.orderNumber} from ${data.restaurantName}: ${label}`;

      await insertNotification(data.userId, title, body, getNotificationType(data.status), {
        orderId: data.orderId,
        orderNumber: data.orderNumber,
        status: data.status,
      });

      await sendExpoPush(data.userId, title, body, {
        orderId: data.orderId,
        screen: 'order-tracking',
      });
      break;
    }

    case 'new_order': {
      const title = `New Order! 🎉`;
      const body = `Order #${data.orderNumber} has arrived. Tap to accept.`;

      await insertNotification(data.ownerId, title, body, 'order_placed', {
        orderId: data.orderId,
        orderNumber: data.orderNumber,
        restaurantId: data.restaurantId,
      });

      await sendExpoPush(data.ownerId, title, body, {
        orderId: data.orderId,
        screen: 'store-orders',
      });
      break;
    }

    case 'rider_assigned': {
      const title = `Rider on the way! 🛵`;
      const body = `${data.riderName} has been assigned to order #${data.orderNumber}`;

      await insertNotification(data.userId, title, body, 'system', {
        orderId: data.orderId,
        orderNumber: data.orderNumber,
      });

      await sendExpoPush(data.userId, title, body, {
        orderId: data.orderId,
        screen: 'order-tracking',
      });
      break;
    }

    case 'push': {
      await insertNotification(data.userId, data.title, data.body, 'system', data.data);
      await sendExpoPush(data.userId, data.title, data.body, data.data);
      break;
    }

    default: {
      console.warn('[Worker] Unknown job type:', (data as { type: string }).type);
    }
  }
}

export function startNotificationWorker(): Worker<NotificationJobData> {
  const worker = new Worker<NotificationJobData>('notifications', processJob, {
    connection: getRedisConnection(),
    concurrency: 10,
  });

  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} (${job.data.type}) completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} (${job?.data?.type}) failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('[Worker] Worker error:', err.message);
  });

  console.log('🔔 Notification worker started');
  return worker;
}
