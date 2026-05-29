'use client';

import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import { 
  Ticket, 
  Plus, 
  Trash2, 
  Edit3, 
  Calendar, 
  TrendingUp, 
  Loader2, 
  Percent, 
  DollarSign, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';

export function CouponManagement() {
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);
  
  // Form fields
  const [code, setCode] = useState('');
  const [type, setType] = useState<'flat' | 'percent'>('percent');
  const [value, setValue] = useState(10);
  const [minOrderAmount, setMinOrderAmount] = useState(0);
  const [maxDiscount, setMaxDiscount] = useState<number | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [usageLimit, setUsageLimit] = useState<number | null>(null);
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');

  // Queries
  const { data: coupons, isLoading, refetch } = trpc.admin.listCoupons.useQuery({
    page,
    pageSize: 15,
  });

  const { data: restaurants } = trpc.restaurant.adminList.useQuery({
    pageSize: 100,
  });

  // Mutations
  const createMutation = trpc.admin.createCoupon.useMutation({
    onSuccess: () => {
      refetch();
      closeModal();
    },
  });

  const updateMutation = trpc.admin.updateCoupon.useMutation({
    onSuccess: () => {
      refetch();
      closeModal();
    },
  });

  const deleteMutation = trpc.admin.deleteCoupon.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const openCreateModal = () => {
    setError('');
    setEditingCoupon(null);
    setCode('');
    setType('percent');
    setValue(10);
    setMinOrderAmount(0);
    setMaxDiscount(null);
    setRestaurantId(null);
    setUsageLimit(null);
    
    // Set default dates (today & next week)
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    setValidFrom(today.toISOString().slice(0, 16));
    setValidUntil(nextWeek.toISOString().slice(0, 16));
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: any) => {
    setError('');
    setEditingCoupon(coupon);
    setCode(coupon.code);
    setType(coupon.type);
    setValue(coupon.value);
    setMinOrderAmount(coupon.minOrderAmount);
    setMaxDiscount(coupon.maxDiscount);
    setRestaurantId(coupon.restaurantId);
    setUsageLimit(coupon.usageLimit);
    
    setValidFrom(new Date(coupon.validFrom).toISOString().slice(0, 16));
    setValidUntil(new Date(coupon.validUntil).toISOString().slice(0, 16));
    setIsActive(coupon.isActive);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCoupon(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Zod validation constraints helper
    if (!/^[A-Z0-9_-]+$/.test(code.toUpperCase())) {
      setError('Code must be uppercase alphanumeric, dashes, or underscores.');
      return;
    }

    const fromDate = new Date(validFrom);
    const untilDate = new Date(validUntil);
    if (fromDate >= untilDate) {
      setError('Start date must be strictly before expiration date.');
      return;
    }

    const payload: any = {
      code: code.toUpperCase(),
      type,
      value: Number(value),
      minOrderAmount: Number(minOrderAmount),
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      restaurantId: restaurantId || null,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      validFrom: fromDate.toISOString(),
      validUntil: untilDate.toISOString(),
      isActive,
    };

    try {
      if (editingCoupon) {
        await updateMutation.mutateAsync({
          id: editingCoupon.id,
          ...payload,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }
    } catch (err: any) {
      setError(err?.message || 'Error occurred while saving coupon schema.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this coupon campaign?')) return;
    try {
      await deleteMutation.mutateAsync({ id });
    } catch (err) {
      console.error('Failed to delete coupon:', err);
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">
            Campaign <span className="text-orange-500">Manager</span>
          </h1>
          <p className="text-slate-400 mt-1">Configure system discounts, regulate promo codes, and review coupon usage rates.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-orange-500 hover:bg-orange-400 text-white font-black py-2.5 px-4.5 rounded-xl shadow-lg shadow-orange-500/10 hover:shadow-orange-500/25 transition-all flex items-center gap-2 cursor-pointer shrink-0 text-xs self-start sm:self-center"
        >
          <Plus className="w-4 h-4" /> Create Promo
        </button>
      </div>

      {/* Grid coupons */}
      {isLoading ? (
        <div className="h-[40vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : !coupons || coupons.length === 0 ? (
        <div className="h-[30vh] border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500 bg-slate-900/10">
          <Ticket className="w-10 h-10 mb-2.5 text-slate-600" />
          <p className="text-sm">No promotional campaigns configured.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((coupon: any) => {
            const isExpired = new Date() > new Date(coupon.validUntil);
            return (
              <div 
                key={coupon.id}
                className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700/60 transition-all flex flex-col justify-between shadow-lg relative group"
              >
                {/* Coupon accent line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-t-2xl" />

                <div>
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono font-black text-base text-slate-100 bg-slate-950 px-3 py-1 rounded-lg border border-slate-850 tracking-wider group-hover:text-orange-500 transition-colors">
                      {coupon.code}
                    </span>
                    {isExpired ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
                        Expired
                      </span>
                    ) : coupon.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-500/10 text-slate-400 border border-slate-500/20">
                        Paused
                      </span>
                    )}
                  </div>

                  {/* Value */}
                  <div className="my-4 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-100 tracking-tight">
                      {coupon.type === 'percent' ? `${coupon.value}%` : formatUSD(coupon.value)}
                    </span>
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">OFF</span>
                  </div>

                  {/* Criteria details */}
                  <div className="space-y-2 mt-4 text-xs text-slate-400 border-t border-slate-800/80 pt-4">
                    <div className="flex justify-between">
                      <span>Requirement:</span>
                      <span className="text-slate-300 font-medium">Min order {formatUSD(coupon.minOrderAmount)}</span>
                    </div>
                    {coupon.maxDiscount && (
                      <div className="flex justify-between">
                        <span>Max Cap:</span>
                        <span className="text-slate-300 font-medium">{formatUSD(coupon.maxDiscount)} max discount</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Scope:</span>
                      <span className="text-slate-300 font-medium truncate max-w-[150px]">
                        {coupon.restaurant?.name || 'Platform Wide'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Usage Stats:</span>
                      <span className="text-slate-300 font-medium">
                        {coupon.usedCount} used {coupon.usageLimit ? `/ ${coupon.usageLimit} max` : '(Unlimited)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dates & Actions */}
                <div className="border-t border-slate-800/80 pt-4 mt-5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>Exp: {new Date(coupon.validUntil).toLocaleDateString()}</span>
                  </div>

                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => openEditModal(coupon)}
                      className="p-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
                      title="Edit Campaign"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(coupon.id)}
                      className="p-1.5 bg-red-950/20 border border-red-900/30 hover:bg-red-950/40 text-red-400 rounded-lg transition-colors cursor-pointer"
                      title="Delete Campaign"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative animate-scaleUp max-h-[95vh] flex flex-col">
            {/* Header */}
            <div className="bg-slate-950/60 p-6 border-b border-slate-800 shrink-0 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Campaign Configuration</span>
                <h2 className="text-xl font-black text-slate-200 mt-1">
                  {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Configure New Coupon'}
                </h2>
              </div>
              <button 
                onClick={closeModal}
                className="w-9 h-9 bg-slate-900 rounded-full flex items-center justify-center text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 transition-all cursor-pointer font-bold text-lg"
              >
                &times;
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-8 overflow-y-auto flex-1 space-y-5">
                {error && (
                  <div className="p-4 bg-red-950/40 border border-red-900/50 rounded-xl text-red-200 text-xs">
                    {error}
                  </div>
                )}

                {/* Code & Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                      Coupon Code
                    </label>
                    <input
                      type="text"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="WINTER50"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                      Type
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-350 focus:outline-none focus:border-orange-500"
                    >
                      <option value="percent">Percentage Off (%)</option>
                      <option value="flat">Flat Dollar Off ($)</option>
                    </select>
                  </div>
                </div>

                {/* Value & Min order */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                      Discount Value
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min="1"
                        value={value}
                        onChange={(e) => setValue(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500 pl-8"
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                        {type === 'percent' ? '%' : '$'}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                      Min Order Requirement
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={minOrderAmount}
                        onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500 pl-8"
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">$</div>
                    </div>
                  </div>
                </div>

                {/* Max discount & Usage limits */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                      Max Discount Cap
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="Unlimited"
                        value={maxDiscount || ''}
                        onChange={(e) => setMaxDiscount(e.target.value ? Number(e.target.value) : null)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500 pl-8"
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">$</div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                      Usage Quantity Limit
                    </label>
                    <input
                      type="number"
                      placeholder="Unlimited"
                      value={usageLimit || ''}
                      onChange={(e) => setUsageLimit(e.target.value ? Number(e.target.value) : null)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* Scope restriction */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Restaurant Restriction
                  </label>
                  <select
                    value={restaurantId || ''}
                    onChange={(e) => setRestaurantId(e.target.value || null)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-350 focus:outline-none focus:border-orange-500"
                  >
                    <option value="">Platform Wide (All Restaurants)</option>
                    {restaurants?.data.map((r: any) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.city})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Validity Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                      Valid From
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={validFrom}
                      onChange={(e) => setValidFrom(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                      Valid Until
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-3 bg-slate-950/40 p-4 border border-slate-850 rounded-2xl">
                  <input
                    type="checkbox"
                    id="isActiveToggle"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4.5 h-4.5 text-orange-500 focus:ring-0 rounded border-slate-850 bg-slate-900 focus:ring-offset-0"
                  />
                  <div>
                    <label htmlFor="isActiveToggle" className="text-xs font-bold text-slate-200 cursor-pointer select-none">
                      Active immediately
                    </label>
                    <p className="text-[10px] text-slate-500 mt-0.5">Toggle off to create a paused coupon campaign.</p>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="bg-slate-950/60 p-6 border-t border-slate-800 shrink-0 flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold py-3.5 px-4 rounded-xl text-xs transition-colors cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-orange-500 hover:bg-orange-400 text-white font-black py-3.5 px-4 rounded-xl text-xs shadow-lg shadow-orange-500/10 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Save Campaign'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
