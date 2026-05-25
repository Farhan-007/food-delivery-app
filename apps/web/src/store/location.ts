import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LocationState {
  lat: number | null;
  lng: number | null;
  address: string | null;
  setLocation: (lat: number, lng: number, address: string) => void;
  clearLocation: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      lat: 28.6139, // Default to New Delhi or some reasonable starting coordinate
      lng: 77.2090,
      address: 'Connaught Place, New Delhi, Delhi, India',

      setLocation: (lat, lng, address) => {
        set({ lat, lng, address });
      },

      clearLocation: () => {
        set({ lat: null, lng: null, address: null });
      },
    }),
    {
      name: 'foodhub-location',
    }
  )
);
