'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LiveMapProps {
  restaurant: { lat: number; lng: number; name: string };
  delivery: { lat: number; lng: number; address: string };
  rider: { lat: number; lng: number; heading?: number | null } | null;
}

export default function LiveMap({ restaurant, delivery, rider }: LiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const restaurantMarkerRef = useRef<L.Marker | null>(null);
  const deliveryMarkerRef = useRef<L.Marker | null>(null);
  const riderMarkerRef = useRef<L.Marker | null>(null);

  // Setup Leaflet marker icons
  const createCustomIcon = (emoji: string, color: string) => {
    return L.divIcon({
      html: `
        <div class="flex items-center justify-center shadow-lg rounded-full border-2 border-white w-10 h-10 ${color} text-lg animate-fade-in">
          ${emoji}
        </div>
      `,
      className: '',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet map
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false,
      }).setView([restaurant.lat, restaurant.lng], 13);

      // OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(mapRef.current);
    }

    const map = mapRef.current;

    // --- Update Restaurant Marker ---
    if (restaurantMarkerRef.current) {
      restaurantMarkerRef.current.setLatLng([restaurant.lat, restaurant.lng]);
    } else {
      restaurantMarkerRef.current = L.marker([restaurant.lat, restaurant.lng], {
        icon: createCustomIcon('🏪', 'bg-orange-500 text-white'),
      })
        .bindPopup(`<b>${restaurant.name}</b><br/>Restaurant Preparation`)
        .addTo(map);
    }

    // --- Update Delivery Marker ---
    if (deliveryMarkerRef.current) {
      deliveryMarkerRef.current.setLatLng([delivery.lat, delivery.lng]);
    } else {
      deliveryMarkerRef.current = L.marker([delivery.lat, delivery.lng], {
        icon: createCustomIcon('🏠', 'bg-amber-500 text-white'),
      })
        .bindPopup(`<b>Delivery Point</b><br/>${delivery.address}`)
        .addTo(map);
    }

    // --- Update Rider Marker ---
    if (rider) {
      if (riderMarkerRef.current) {
        riderMarkerRef.current.setLatLng([rider.lat, rider.lng]);
        // Update popup/heading description if present
        if (rider.heading !== undefined) {
          riderMarkerRef.current.setPopupContent(`<b>Rider courier</b><br/>Heading: ${rider.heading}°`);
        }
      } else {
        riderMarkerRef.current = L.marker([rider.lat, rider.lng], {
          icon: createCustomIcon('🚴', 'bg-emerald-500 text-white animate-bounce'),
        })
          .bindPopup('<b>Rider courier</b><br/>On the way to destination')
          .addTo(map);
      }
    } else {
      // Remove rider marker if not assigned
      if (riderMarkerRef.current) {
        riderMarkerRef.current.remove();
        riderMarkerRef.current = null;
      }
    }

    // --- Fit Map Bounds dynamically ---
    const coordinates: L.LatLngExpression[] = [
      [restaurant.lat, restaurant.lng],
      [delivery.lat, delivery.lng],
    ];
    if (rider) {
      coordinates.push([rider.lat, rider.lng]);
    }

    const bounds = L.latLngBounds(coordinates);
    map.fitBounds(bounds, { padding: [50, 50] });

    return () => {
      // Cleanup is handled by keeping markers references
    };
  }, [restaurant, delivery, rider]);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-3xl border border-zinc-100 dark:border-zinc-900 shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full z-10" />
      <div className="absolute top-4 left-4 z-20 rounded-2xl bg-zinc-900/90 backdrop-blur-md px-3.5 py-2 text-[10px] font-bold text-white shadow-md border border-zinc-800 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
        OSM LIVE TRACKING ACTIVE
      </div>
    </div>
  );
}
