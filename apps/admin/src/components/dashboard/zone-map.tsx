'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Polyline, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon asset issue in Next.js
useEffectMarkerFix();

function useEffectMarkerFix() {
  if (typeof window !== 'undefined') {
    // Delete the default icon options from prototype to allow custom overrides
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });
  }
}

// Map Click Listener
function MapClickEvents({ onMapClick, enabled }: { onMapClick: (lat: number, lng: number) => void; enabled: boolean }) {
  useMapEvents({
    click(e) {
      if (enabled) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

interface ZoneMapProps {
  existingZones: any[];
  drawingPoints: [number, number][];
  onPointAdd: (lat: number, lng: number) => void;
  isDrawing: boolean;
}

export default function ZoneMap({
  existingZones,
  drawingPoints,
  onPointAdd,
  isDrawing
}: ZoneMapProps) {
  // Center around first zone or default to Manhattan NYC
  const [center, setCenter] = useState<[number, number]>([40.7128, -74.0060]);

  useEffect(() => {
    if (existingZones && existingZones.length > 0) {
      try {
        const firstZone = existingZones[0];
        const coord = firstZone.polygon.coordinates[0][0];
        if (coord) {
          setCenter([coord[1], coord[0]]); // GeoJSON [lng, lat] -> Leaflet [lat, lng]
        }
      } catch (err) {
        console.error('Failed to parse zone coordinates for centering:', err);
      }
    }
  }, [existingZones]);

  // Leaflet custom marker dots for drawing points
  const dotIcon = typeof window !== 'undefined' ? L.divIcon({
    className: 'bg-orange-500 w-3 h-3 rounded-full border-2 border-white shadow-md',
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  }) : null;

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
      <MapContainer 
        center={center} 
        zoom={13} 
        style={{ width: '100%', height: '100%', background: '#090d16' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Existing Zones */}
        {existingZones?.map((zone) => {
          try {
            // GeoJSON coordinates array: [lng, lat] -> Leaflet expects: [lat, lng]
            const positions = zone.polygon.coordinates[0].map(([lng, lat]: [number, number]) => [lat, lng]);
            return (
              <Polygon
                key={zone.id}
                positions={positions}
                pathOptions={{
                  fillColor: zone.isActive ? '#f97316' : '#64748b',
                  fillOpacity: 0.25,
                  color: zone.isActive ? '#ea580c' : '#475569',
                  weight: 2,
                  dashArray: zone.isActive ? undefined : '5, 5'
                }}
              />
            );
          } catch (e) {
            console.error('Failed to parse polygon for zone:', zone.name, e);
            return null;
          }
        })}

        {/* Dynamic polyline for current drawing */}
        {drawingPoints.length > 0 && (
          <>
            <Polyline
              positions={drawingPoints}
              pathOptions={{ color: '#f97316', weight: 3, dashArray: '5, 10' }}
            />
            {/* Display markers on clicked coordinates */}
            {drawingPoints.map((pt, idx) => (
              <Marker 
                key={idx} 
                position={pt} 
                icon={dotIcon || undefined}
              />
            ))}
          </>
        )}

        {/* Map Click Handler */}
        <MapClickEvents onMapClick={onPointAdd} enabled={isDrawing} />
      </MapContainer>
    </div>
  );
}
