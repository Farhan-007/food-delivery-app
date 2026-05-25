import type { Server as SocketIOServer } from 'socket.io';

// ============================================================
// Socket.io Real-time Handlers
// ============================================================

export function setupSocketHandlers(io: SocketIOServer): void {
  // Namespace: /orders — customer tracks their live order
  const ordersNs = io.of('/orders');
  ordersNs.on('connection', (socket) => {
    console.log(`[Socket] Customer connected to /orders: ${socket.id}`);

    // Subscribe to a specific order room (order status updates)
    socket.on('subscribe:order', (orderId: string) => {
      void socket.join(`order:${orderId}`);
      console.log(`[Socket] ${socket.id} subscribed to order ${orderId}`);
    });

    socket.on('unsubscribe:order', (orderId: string) => {
      void socket.leave(`order:${orderId}`);
    });

    // Subscribe to a specific rider's live GPS location
    socket.on('subscribe:rider', (riderId: string) => {
      void socket.join(`rider:tracking:${riderId}`);
      console.log(`[Socket] ${socket.id} subscribed to rider ${riderId} location`);
    });

    socket.on('unsubscribe:rider', (riderId: string) => {
      void socket.leave(`rider:tracking:${riderId}`);
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
}
