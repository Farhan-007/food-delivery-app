'use client';

import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import { 
  Search, 
  Utensils, 
  CheckCircle, 
  XCircle, 
  MapPin, 
  User, 
  Mail, 
  DollarSign, 
  Clock, 
  Star, 
  Loader2,
  Calendar,
  AlertTriangle
} from 'lucide-react';

export function RestaurantManagement() {
  const [page, setPage] = useState(1);
  const [cityFilter, setCityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [selectedRest, setSelectedRest] = useState<any | null>(null);

  // Queries
  const { data: listData, isLoading, refetch } = trpc.restaurant.adminList.useQuery({
    page,
    pageSize: 12,
    isApproved: statusFilter === 'all' ? undefined : statusFilter === 'approved',
    city: cityFilter || undefined,
  });

  // Mutations
  const approveMutation = trpc.restaurant.approve.useMutation({
    onSuccess: () => {
      refetch();
      if (selectedRest) {
        setSelectedRest((prev: any) => prev ? { ...prev, isApproved: !prev.isApproved } : null);
      }
    },
  });

  const handleApproveToggle = async (restaurantId: string, currentApproved: boolean) => {
    try {
      await approveMutation.mutateAsync({
        restaurantId,
        isApproved: !currentApproved,
      });
    } catch (err) {
      console.error('Failed to change restaurant status:', err);
    }
  };

  const cuisinesList = (cuisineType: any) => {
    if (Array.isArray(cuisineType)) return cuisineType.join(', ');
    return String(cuisineType);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">
          Restaurant <span className="text-orange-500">Registry</span>
        </h1>
        <p className="text-slate-400 mt-1">Review vendor details, verify opening logs, and issue or revoke platform credentials.</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/30 border border-slate-800/80 rounded-2xl p-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 rounded-xl p-1 w-full md:w-auto">
          {(['all', 'approved', 'pending'] as const).map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className={`flex-1 md:flex-initial px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                statusFilter === status
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* City Filter */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={cityFilter}
            onChange={(e) => {
              setCityFilter(e.target.value);
              setPage(1);
            }}
            placeholder="Filter by city..."
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-orange-500/80 transition-all text-xs"
          />
        </div>
      </div>

      {/* Grid List */}
      {isLoading ? (
        <div className="h-[40vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : !listData?.data || listData.data.length === 0 ? (
        <div className="h-[30vh] border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500 bg-slate-900/10">
          <Utensils className="w-10 h-10 mb-2.5 text-slate-600" />
          <p className="text-sm">No restaurants matching these parameters.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listData.data.map((rest: any) => (
              <div 
                key={rest.id}
                className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden hover:border-slate-700/60 transition-all flex flex-col shadow-lg hover:shadow-black/25 relative group"
              >
                {/* Header Cover fallback */}
                <div className="h-28 w-full bg-gradient-to-r from-orange-950/40 to-slate-900 border-b border-slate-800 relative">
                  {rest.coverUrl && (
                    <img 
                      src={rest.coverUrl} 
                      alt={rest.name} 
                      className="w-full h-full object-cover opacity-60 group-hover:scale-102 transition-transform duration-300"
                    />
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    {rest.isApproved ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm backdrop-blur-md">
                        <CheckCircle className="w-3.5 h-3.5" /> Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/20 shadow-sm backdrop-blur-md animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5" /> Review Pending
                      </span>
                    )}
                  </div>
                </div>

                {/* Logo & Info */}
                <div className="p-6 pt-0 flex-1 flex flex-col relative">
                  {/* Logo overlay */}
                  <div className="w-16 h-16 bg-slate-950 border-2 border-slate-800 rounded-xl overflow-hidden -mt-8 mb-4 relative z-10 shadow-lg flex items-center justify-center text-orange-500">
                    {rest.logoUrl ? (
                      <img src={rest.logoUrl} alt={rest.name} className="w-full h-full object-cover" />
                    ) : (
                      <Utensils className="w-7 h-7" />
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-100 group-hover:text-orange-500 transition-colors line-clamp-1">
                    {rest.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{cuisinesList(rest.cuisineType)}</p>

                  <div className="space-y-2 mt-4 text-xs text-slate-400 flex-1">
                    <div className="flex items-center gap-2 text-slate-300">
                      <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="line-clamp-1">{rest.address}, {rest.city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="text-slate-300 font-medium">{rest.owner?.name || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="line-clamp-1 font-mono text-[10px] text-slate-500">{rest.owner?.email || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Pricing and rating details */}
                  <div className="border-t border-slate-800/80 pt-4 mt-5 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="font-bold text-slate-200">{rest.ratingAvg?.toFixed(1) || '0.0'}</span>
                      <span>({rest.ratingCount || 0})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      <span className="font-bold text-slate-200">${rest.minOrderAmount}</span>
                      <span>Min Order</span>
                    </div>
                  </div>
                </div>

                {/* Card Action bar */}
                <div className="bg-slate-950/40 border-t border-slate-800/60 p-4 flex gap-2">
                  <button 
                    onClick={() => setSelectedRest(rest)}
                    className="flex-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold py-2 px-3 rounded-lg text-xs transition-colors cursor-pointer text-center"
                  >
                    Inspect Store
                  </button>
                  <button
                    onClick={() => handleApproveToggle(rest.id, rest.isApproved)}
                    disabled={approveMutation.isPending}
                    className={`px-3 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                      rest.isApproved
                        ? 'bg-red-950/40 border border-red-900/40 hover:bg-red-950/60 text-red-300'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-white font-black'
                    }`}
                  >
                    {approveMutation.isPending && approveMutation.variables?.restaurantId === rest.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : rest.isApproved ? (
                      'Deactivate'
                    ) : (
                      'Approve'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {listData.total > 12 && (
            <div className="flex items-center justify-center gap-3 pt-6 border-t border-slate-900">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="bg-slate-900 border border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Previous
              </button>
              <span className="text-slate-400 text-xs">Page <strong className="text-slate-200">{page}</strong> of {Math.ceil(listData.total / 12)}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!listData.hasNextPage}
                className="bg-slate-900 border border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Details Modal */}
      {selectedRest && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative animate-scaleUp max-h-[90vh] flex flex-col">
            {/* cover image details */}
            <div className="h-44 w-full bg-slate-950 relative border-b border-slate-800/80 shrink-0">
              {selectedRest.coverUrl && (
                <img src={selectedRest.coverUrl} alt={selectedRest.name} className="w-full h-full object-cover opacity-50" />
              )}
              <button 
                onClick={() => setSelectedRest(null)}
                className="absolute top-4 right-4 w-9 h-9 bg-slate-950/80 backdrop-blur-md rounded-full flex items-center justify-center text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 transition-all cursor-pointer font-bold text-lg"
              >
                &times;
              </button>
              {/* Logo floating */}
              <div className="absolute bottom-4 left-6 w-20 h-20 bg-slate-900 border-2 border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center text-orange-500 shadow-xl">
                {selectedRest.logoUrl ? (
                  <img src={selectedRest.logoUrl} alt={selectedRest.name} className="w-full h-full object-cover" />
                ) : (
                  <Utensils className="w-9 h-9" />
                )}
              </div>
            </div>

            {/* Info details */}
            <div className="p-8 pt-6 overflow-y-auto flex-1 space-y-6">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-black text-slate-100">{selectedRest.name}</h2>
                  {selectedRest.isApproved ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Pending Approval
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-400 mt-1">{selectedRest.description || 'No description supplied by vendor.'}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {Array.isArray(selectedRest.cuisineType) ? selectedRest.cuisineType.map((c: string, idx: number) => (
                    <span key={idx} className="text-[10px] font-semibold text-slate-400 bg-slate-950/60 border border-slate-850 px-2 py-0.5 rounded-md">
                      {c}
                    </span>
                  )) : (
                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-950/60 border border-slate-850 px-2 py-0.5 rounded-md">
                      {selectedRest.cuisineType}
                    </span>
                  )}
                </div>
              </div>

              {/* Grid of properties */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-b border-slate-800/80 py-6">
                {/* Details left */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <User className="w-4 h-4 text-orange-500" /> Vendor Information
                  </h3>
                  <div className="space-y-2 text-sm text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-xs">Owner:</span>
                      <span className="font-bold">{selectedRest.owner?.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-xs">Email:</span>
                      <span className="font-mono text-xs">{selectedRest.owner?.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-xs">Delivery Radius:</span>
                      <span className="font-bold text-slate-200">{selectedRest.deliveryRadiusKm} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-xs">Avg Prep Time:</span>
                      <span className="font-bold text-slate-200">{selectedRest.avgDeliveryTime} minutes</span>
                    </div>
                  </div>
                </div>

                {/* Details right */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-orange-500" /> Geography
                  </h3>
                  <div className="space-y-2 text-sm text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-xs">City:</span>
                      <span>{selectedRest.city}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-xs">Location:</span>
                      <span className="text-right truncate max-w-xs">{selectedRest.address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-xs">Coordinates:</span>
                      <span className="font-mono text-xs text-slate-400">{selectedRest.lat?.toFixed(5)}, {selectedRest.lng?.toFixed(5)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Opening hours slot */}
              {selectedRest.openingHours && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500" /> Operating Schedule
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                    {Object.entries(selectedRest.openingHours).map(([day, slot]: [string, any]) => (
                      <div key={day} className="bg-slate-950/60 border border-slate-850 p-2.5 rounded-xl text-center flex flex-col justify-between min-h-[70px]">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{day}</span>
                        {slot.isClosed ? (
                          <span className="text-[10px] font-bold text-red-500 mt-1">Closed</span>
                        ) : (
                          <span className="text-[9px] font-semibold text-emerald-400 mt-1">{slot.open} - {slot.close}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal footer actions */}
            <div className="bg-slate-950/60 border-t border-slate-800/80 p-6 flex gap-3 shrink-0">
              <button
                onClick={() => setSelectedRest(null)}
                className="flex-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold py-3 px-4 rounded-xl text-xs transition-colors cursor-pointer text-center"
              >
                Close View
              </button>
              <button
                onClick={() => handleApproveToggle(selectedRest.id, selectedRest.isApproved)}
                disabled={approveMutation.isPending}
                className={`flex-1 font-black py-3 px-4 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedRest.isApproved
                    ? 'bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/10'
                }`}
              >
                {approveMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : selectedRest.isApproved ? (
                  'Suspend Restaurant'
                ) : (
                  'Approve Restaurant'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
