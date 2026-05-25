'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { trpc } from '@/utils/trpc';
import { 
  Map, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Undo2, 
  Save, 
  DollarSign, 
  Loader2, 
  Activity, 
  MapPin, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// Import Leaflet Map dynamically with SSR disabled
const ZoneMap = dynamic(() => import('./zone-map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[450px] bg-slate-950/40 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500 gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      <span className="text-xs">Initializing GIS Map Module...</span>
    </div>
  )
});

export function ZoneEditor() {
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<[number, number][]>([]);
  const [zoneName, setZoneName] = useState('');
  const [baseFee, setBaseFee] = useState(3.99);
  const [perKmFee, setPerKmFee] = useState(1.50);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');

  // Queries
  const { data: zones, isLoading, refetch } = trpc.admin.listZones.useQuery();

  // Mutations
  const createZoneMutation = trpc.admin.createZone.useMutation({
    onSuccess: () => {
      refetch();
      resetDrawing();
    },
  });

  const deleteZoneMutation = trpc.admin.deleteZone.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handlePointAdd = (lat: number, lng: number) => {
    setDrawingPoints((prev) => [...prev, [lat, lng]]);
  };

  const handleUndo = () => {
    setDrawingPoints((prev) => prev.slice(0, -1));
  };

  const resetDrawing = () => {
    setIsDrawing(false);
    setDrawingPoints([]);
    setZoneName('');
    setBaseFee(3.99);
    setPerKmFee(1.50);
    setIsActive(true);
    setError('');
  };

  const handleDeleteZone = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete the delivery zone "${name}"?`)) return;
    try {
      await deleteZoneMutation.mutateAsync({ id });
    } catch (err) {
      console.error('Failed to delete zone:', err);
    }
  };

  const handleSaveZone = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (drawingPoints.length < 3) {
      setError('A delivery polygon requires at least 3 vertices to define an area.');
      return;
    }

    try {
      // 1. Close the loop by adding the first point coordinates to the end of the polygon
      const closedPoints = [...drawingPoints, drawingPoints[0]];
      
      // 2. Convert coordinates format from Leaflet [lat, lng] to GeoJSON [lng, lat]
      const geoJsonPoints: [number, number][] = closedPoints.map(([lat, lng]) => [lng, lat]);

      // 3. Invoke mutation
      await createZoneMutation.mutateAsync({
        name: zoneName,
        baseDeliveryFee: Number(baseFee),
        perKmFee: Number(perKmFee),
        polygon: {
          type: 'Polygon',
          coordinates: [geoJsonPoints],
        },
        isActive,
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to save delivery zone.');
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
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">
          Delivery <span className="text-orange-500">Zones</span>
        </h1>
        <p className="text-slate-400 mt-1">Draw interactive GeoJSON polygons to determine rider dispatch scopes and automate fee algorithms.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Map column (Large) */}
        <div className="lg:col-span-2 h-[500px] flex flex-col space-y-3">
          <div className="flex items-center justify-between text-xs bg-slate-950/40 border border-slate-850 p-3 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse" />
              <span className="text-slate-400">
                {isDrawing 
                  ? `Drawing Zone Mode: Click map to place vertices (${drawingPoints.length} added)`
                  : 'Map Telemetry: Active polygon areas highlighted below'}
              </span>
            </div>
            {isDrawing && drawingPoints.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={handleUndo}
                  className="flex items-center gap-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  <Undo2 className="w-3.5 h-3.5" /> Undo
                </button>
                <button
                  onClick={resetDrawing}
                  className="flex items-center gap-1 bg-red-950/20 border border-red-900/30 hover:bg-red-950/40 text-red-400 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  Clear Draft
                </button>
              </div>
            )}
          </div>
          
          <ZoneMap
            existingZones={zones || []}
            drawingPoints={drawingPoints}
            onPointAdd={handlePointAdd}
            isDrawing={isDrawing}
          />
        </div>

        {/* Sidebar Controls Column */}
        <div className="space-y-6">
          {/* Drawing Config Panel */}
          {isDrawing ? (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4 animate-scaleUp">
              <div className="flex items-center justify-between pb-3 border-b border-slate-850">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Map className="w-4 h-4 text-orange-500 animate-spin" /> Drafting New Zone
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">{drawingPoints.length} Points</span>
              </div>

              {error && (
                <div className="p-3.5 bg-red-950/30 border border-red-900/40 rounded-xl text-red-300 text-xs flex gap-2">
                  <AlertCircle className="w-4.5 h-4.5 text-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSaveZone} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Zone Area Name
                  </label>
                  <input
                    type="text"
                    required
                    value={zoneName}
                    onChange={(e) => setZoneName(e.target.value)}
                    placeholder="Downtown Core"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                      Base Fee ($)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        step="0.01"
                        min="0"
                        value={baseFee}
                        onChange={(e) => setBaseFee(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500 pl-8"
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">$</div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                      Per KM Rate ($)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        step="0.01"
                        min="0"
                        value={perKmFee}
                        onChange={(e) => setPerKmFee(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500 pl-8"
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">$</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-950/40 p-3.5 border border-slate-850 rounded-xl">
                  <input
                    type="checkbox"
                    id="isZoneActiveToggle"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-orange-500 focus:ring-0 rounded border-slate-850 bg-slate-900 focus:ring-offset-0"
                  />
                  <label htmlFor="isZoneActiveToggle" className="text-xs font-bold text-slate-200 cursor-pointer select-none">
                    Active on platform
                  </label>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={resetDrawing}
                    className="flex-1 bg-slate-900 border border-slate-850 hover:border-slate-750 text-slate-400 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createZoneMutation.isPending || drawingPoints.length < 3}
                    className="flex-1 bg-orange-500 hover:bg-orange-400 text-white font-black py-2.5 rounded-xl text-xs shadow-lg shadow-orange-500/10 hover:shadow-orange-500/25 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {createZoneMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-4 h-4" /> Save Zone
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <button
              onClick={() => setIsDrawing(true)}
              className="w-full bg-orange-500 hover:bg-orange-400 text-white font-black py-3 px-4 rounded-2xl shadow-lg shadow-orange-500/10 hover:shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
            >
              <Plus className="w-4.5 h-4.5" /> Draw New Delivery Zone
            </button>
          )}

          {/* Zones List Container */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center justify-between pb-3 border-b border-slate-850">
              <span>Active Coverage Area</span>
              <span className="text-[10px] text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded-md border border-slate-850">{zones?.length || 0} zones</span>
            </h3>

            {isLoading ? (
              <div className="h-28 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
              </div>
            ) : !zones || zones.length === 0 ? (
              <div className="text-center text-slate-500 text-xs py-6">
                No delivery zones defined. Get started by drawing one above!
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                {zones.map((zone: any) => (
                  <div 
                    key={zone.id}
                    className="bg-slate-950/50 border border-slate-850 hover:border-slate-800 rounded-xl p-3.5 flex items-center justify-between text-xs group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">{zone.name}</span>
                        {zone.isActive ? (
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        ) : (
                          <span className="w-1.5 h-1.5 bg-slate-600 rounded-full" />
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-3 text-[10px] text-slate-500 mt-1 font-medium">
                        <span>Base: {formatUSD(zone.baseDeliveryFee)}</span>
                        <span>Per KM: {formatUSD(zone.perKmFee)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteZone(zone.id, zone.name)}
                      disabled={deleteZoneMutation.isPending && deleteZoneMutation.variables?.id === zone.id}
                      className="p-2 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-400 rounded-lg opacity-40 group-hover:opacity-100 transition-opacity cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                    >
                      {deleteZoneMutation.isPending && deleteZoneMutation.variables?.id === zone.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
