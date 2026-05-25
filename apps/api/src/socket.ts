import type { Server as SocketIOServer } from 'socket.io';
import type { OrderStatusEvent, RiderLocationEvent, NewOrderEvent } from '@repo/types';

// ============================================================
// Socket.io Real-time Handlers
// ============================================================

export function setupSocketHandlers(io: SocketIOServer): void {
  // Namespace: /orders — customer tracks their live order
  const ordersNs = io.of('/orders');
  ordersNs.on('connection', (socket) => {
    console.log(`[Socket] Customer connected to /orders: ${socket.id}`);

    socket.on('subscribe:order', (orderId: string) => {
      void socket.join(`order:${orderId}`);
      console.log(`[Socket] ${socket.id} subscribed to order ${orderId}`);
    });

    socket.on('unsubscribe:order', (orderId: string) => {
      void socket.leave(`order:${orderId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Customer disconnected: ${socket.id}`);
    });
  });

  // Namespace: /rider — rider receives assignments + broadcasts location
  const riderNs = io.of('/rider');
  riderNs.on('connection', (socket) => {
    console.log(`[Socket] Rider connected: ${socket.id}`);

    socket.on('rider:join', (riderId: string) => {
      void socket.join(`rider:${riderId}`);
    });

    socket.on('rider:location', (data: RiderLocationEvent) => {
      // Broadcast to the specific order room
      ordersNs.to(`order:active:${data.riderId}`).emit('rider:location:update', data);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Rider disconnected: ${socket.id}`);
    });
  });

  // Namespace: /restaurant — restaurant receives new orders
  const restaurantNs = io.of('/restaurant');
  restaurantNs.on('connection', (socket) => {
    console.log(`[Socket] Restaurant connected: ${socket.id}`);

    socket.on('restaurant:join', (restaurantId: string) => {
      void socket.join(`restaurant:${restaurantId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Restaurant disconnected: ${socket.id}`);
    });
  });

  // Namespace: /admin — admin dashboard live feed
  const adminNs = io.of('/admin');
  adminNs.on('connection', (socket) => {
    console.log(`[Socket] Admin connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`[Socket] Admin disconnected: ${socket.id}`);
    });
  });

  // ---- Event emission helpers (called from routers) ----
  io.on('internal:order:status', (event: OrderStatusEvent) => {
    ordersNs.to(`order:${event.orderId}`).emit('order:status:update', event);
    adminNs.emit('order:status:update', event);
  });

  io.on('internal:order:new', (event: NewOrderEvent) => {
    restaurantNs
      .to(`restaurant:${event.restaurantId}`)
      .emit('order:new', event);
    adminNs.emit('order:new', event);
  });
}
