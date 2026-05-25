'use client';

import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import { 
  ShoppingBag, 
  User, 
  MapPin, 
  Bike, 
  DollarSign, 
  Clock, 
  Loader2, 
  TrendingUp, 
  ShieldAlert, 
  CheckCircle, 
  XCircle,
  Truck,
  FileText
} from 'lucide-react';

type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready_for_pickup' | 'rider_assigned' | 'picked_up' | 'delivered' | 'cancelled' | 'refunded';

export function OrderManagement() {
  const [page, setPage] = useState(1);
  const [activeStatusTab, setActiveStatusTab] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isAssigningRider, setIsAssigningRider] = useState(false);
  const [selectedRiderId, setSelectedRiderId] = useState('');

  // Map status filters to backend query arrays
  const getStatusQuery = (): OrderStatus[] | undefined => {
    if (activeStatusTab === 'all') return undefined;
    if (activeStatusTab === 'active') {
      return ['pending', 'accepted', 'preparing', 'ready_for_pickup', 'rider_assigned', 'picked_up'];
    }
    if (activeStatusTab === 'completed') return ['delivered'];
    if (activeStatusTab === 'cancelled') return ['cancelled', 'refunded'];
    return undefined;
  };

  // Queries
  const { data: orders, isLoading: ordersLoading, refetch: refetchOrders } = trpc.order.adminList.useQuery({
    page,
    pageSize: 15,
    status: getStatusQuery(),
  });

  const { data: riders, isLoading: ridersLoading } = trpc.admin.listUsers.useQuery({
    role: 'rider',
    pageSize: 50,
  });

  // Mutations
  const assignRiderMutation = trpc.order.assignRider.useMutation({
    onSuccess: async (updatedOrder) => {
      await refetchOrders();
      setIsAssigningRider(false);
      setSelectedRiderId('');
      // Update selected order modal data locally
      if (selectedOrder) {
        const assignedRider = riders?.data.find((r: any) => r.id === updatedOrder.riderId);
        setSelectedOrder((prev: any) => ({
          ...prev,
          status: updatedOrder.status,
          riderId: updatedOrder.riderId,
          rider: assignedRider ? { id: assignedRider.id, name: assignedRider.name } : null
        }));
      }
    },
  });

  const handleAssignRiderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !selectedRiderId) return;

    try {
      await assignRiderMutation.mutateAsync({
        orderId: selectedOrder.id,
        riderId: selectedRiderId,
      });
    } catch (err) {
      console.error('Failed to manually assign rider:', err);
    }
  };

  // Status style helper
  const getStatusStyle = (status: OrderStatus) => {
    const map: Record<OrderStatus, { bg: string, text: string, border: string }> = {
      pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
      accepted: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
      preparing: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
      ready_for_pickup: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20' },
      rider_assigned: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20' },
      picked_up: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
      delivered: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
      cancelled: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
      refunded: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
    };
    return map[status] || { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' };
  };

  const formatUSD = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">
          Order <span className="text-orange-500">Telemetry</span>
        </h1>
        <p className="text-slate-400 mt-1">Audit active sales, override rider routing, and review receipts across the network.</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-slate-900/30 border border-slate-800/80 rounded-2xl p-2 max-w-lg">
        {([
          { key: 'all', label: 'All Orders' },
          { key: 'active', label: 'In Progress' },
          { key: 'completed', label: 'Delivered' },
          { key: 'cancelled', label: 'Cancelled' }
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveStatusTab(tab.key);
              setPage(1);
            }}
            className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeStatusTab === tab.key
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List Table */}
      {ordersLoading ? (
        <div className="h-[40vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : !orders || orders.length === 0 ? (
        <div className="h-[30vh] border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500 bg-slate-900/10">
          <ShoppingBag className="w-10 h-10 mb-2.5 text-slate-600" />
          <p className="text-sm">No transaction events recorded.</p>
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Invoice ID</th>
                  <th className="py-4 px-6">Store</th>
                  <th className="py-4 px-6">Customer</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Total Value</th>
                  <th className="py-4 px-6">Routing</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {orders.map((order: any) => {
                  const style = getStatusStyle(order.status);
                  return (
                    <tr key={order.id} className="hover:bg-slate-950/30 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-slate-400">{order.orderNumber}</td>
                      <td className="py-4 px-6 font-semibold text-slate-200">{order.restaurant?.name}</td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-200">{order.customer?.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{order.customer?.email}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-400">{new Date(order.createdAt).toLocaleDateString()} &middot; {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="py-4 px-6 font-bold text-slate-100">{formatUSD(order.total)}</td>
                      <td className="py-4 px-6">
                        {order.type === 'pickup' ? (
                          <span className="text-[10px] font-semibold text-slate-400">Self Pickup</span>
                        ) : order.rider ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                            <Bike className="w-3.5 h-3.5" /> {order.rider.name}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500 animate-pulse">
                            <ShieldAlert className="w-3.5 h-3.5" /> Unassigned
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${style.bg} ${style.text} ${style.border}`}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {orders.length === 15 && (
            <div className="flex items-center justify-between px-6 py-4 bg-slate-950/40 border-t border-slate-800 text-xs">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="bg-slate-900 border border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-700 text-slate-300 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer"
              >
                Previous Page
              </button>
              <span className="text-slate-400">Page <strong className="text-slate-200">{page}</strong></span>
              <button
                onClick={() => setPage((p) => p + 1)}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer"
              >
                Next Page
              </button>
            </div>
          )}
        </div>
      )}

      {/* Details & Intervention Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative animate-scaleUp max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-slate-950/60 p-6 border-b border-slate-800 shrink-0 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Order Telemetry Info</span>
                <h2 className="text-xl font-black text-slate-200 mt-1 flex items-center gap-2">
                  Invoice <span className="font-mono text-orange-500">{selectedOrder.orderNumber}</span>
                </h2>
              </div>
              <button 
                onClick={() => {
                  setSelectedOrder(null);
                  setIsAssigningRider(false);
                }}
                className="w-9 h-9 bg-slate-900 rounded-full flex items-center justify-center text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 transition-all cursor-pointer font-bold text-lg"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 overflow-y-auto flex-1 space-y-6">
              {/* Alert Notification */}
              {selectedOrder.status === 'ready_for_pickup' && !selectedOrder.riderId && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3 text-xs leading-relaxed text-amber-200">
                  <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <span className="font-black">Rider Intervention Required:</span> This order is marked as ready for pickup by the vendor but has no delivery agent. Click <span className="font-bold text-orange-400">Assign Courier</span> below to manually route a rider.
                  </div>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-500" /> Receipt Summary
                </h3>
                <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-4.5 divide-y divide-slate-900">
                  {Array.isArray(selectedOrder.items) && selectedOrder.items.map((item: any, idx: number) => (
                    <div key={idx} className="py-3 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-black text-slate-200">{item.quantity}x</span> &middot; <span className="font-bold text-slate-300">{item.foodItemName}</span>
                        {item.selectedVariations?.length > 0 && (
                          <div className="text-[10px] text-slate-500 mt-1 pl-5">
                            {item.selectedVariations.map((v: any) => v.optionLabel).join(', ')}
                          </div>
                        )}
                      </div>
                      <span className="font-mono text-slate-400">{formatUSD(item.totalPrice)}</span>
                    </div>
                  ))}

                  {/* Calculations */}
                  <div className="pt-4 mt-2 space-y-2 text-slate-400 text-xs">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-mono">{formatUSD(selectedOrder.subtotal)}</span>
                    </div>
                    {selectedOrder.deliveryFee > 0 && (
                      <div className="flex justify-between">
                        <span>Delivery Fee:</span>
                        <span className="font-mono">{formatUSD(selectedOrder.deliveryFee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Platform Fee:</span>
                      <span className="font-mono">{formatUSD(selectedOrder.platformFee)}</span>
                    </div>
                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between text-red-400">
                        <span>Discount Applied:</span>
                        <span className="font-mono">-{formatUSD(selectedOrder.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-slate-850 pt-2.5 text-slate-200 font-black text-sm">
                      <span>Total Invoice:</span>
                      <span className="font-mono text-orange-500">{formatUSD(selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stakeholders Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-b border-slate-800/80 py-6">
                {/* Left side */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <User className="w-4 h-4 text-orange-500" /> Customer & Store
                  </h3>
                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Customer:</span>
                      <span className="font-bold text-slate-200">{selectedOrder.customer?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Contact:</span>
                      <span className="font-mono">{selectedOrder.customer?.phone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Store:</span>
                      <span className="font-bold text-slate-250">{selectedOrder.restaurant?.name}</span>
                    </div>
                  </div>
                </div>

                {/* Right side */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Truck className="w-4 h-4 text-orange-500" /> Delivery Agent
                  </h3>
                  <div className="space-y-2 text-xs text-slate-300">
                    {selectedOrder.type === 'pickup' ? (
                      <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl text-slate-400 text-center font-bold">
                        Self-Pickup Arrangement
                      </div>
                    ) : selectedOrder.rider ? (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Courier:</span>
                          <span className="font-bold text-slate-200">{selectedOrder.rider.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Contact:</span>
                          <span className="font-mono">{selectedOrder.rider.phone || 'N/A'}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="p-2.5 bg-red-950/30 border border-red-900/30 rounded-xl text-red-300 text-center font-bold">
                          No Courier Assigned
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Courier Assignment Section */}
              {selectedOrder.type === 'delivery' && (
                <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">Manual Route Override</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Assign or re-route delivery agents on the system.</p>
                    </div>
                    <button
                      onClick={() => setIsAssigningRider(!isAssigningRider)}
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      {isAssigningRider ? 'Cancel' : selectedOrder.rider ? 'Re-assign Courier' : 'Assign Courier'}
                    </button>
                  </div>

                  {isAssigningRider && (
                    <form onSubmit={handleAssignRiderSubmit} className="space-y-3 pt-3 border-t border-slate-900 flex items-end gap-3">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                          Select Delivery Agent
                        </label>
                        <select
                          required
                          value={selectedRiderId}
                          onChange={(e) => setSelectedRiderId(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none focus:border-orange-500"
                        >
                          <option value="">-- Choose Rider --</option>
                          {riders?.data.map((rider: any) => (
                            <option key={rider.id} value={rider.id}>
                              {rider.name} ({rider.email})
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="submit"
                        disabled={assignRiderMutation.isPending || !selectedRiderId}
                        className="bg-orange-500 hover:bg-orange-400 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-lg shadow-orange-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
                      >
                        {assignRiderMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Confirm Route'
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-950/60 p-6 border-t border-slate-800 shrink-0">
              <button
                onClick={() => {
                  setSelectedOrder(null);
                  setIsAssigningRider(false);
                }}
                className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold py-3.5 px-4 rounded-xl text-xs transition-colors cursor-pointer text-center"
              >
                Dismiss Modal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
