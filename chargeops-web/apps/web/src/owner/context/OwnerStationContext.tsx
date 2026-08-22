import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApi, type Station } from '@chargeops/api';

interface OwnerStationContextValue {
  stations: Station[];
  selectedStationId: string;
  setSelectedStationId: (id: string) => void;
  currentStation: Station | null;
  isLoading: boolean;
}

const OwnerStationContext = createContext<OwnerStationContextValue | null>(null);

const STORAGE_KEY = 'chargeops_owner_selected_station';

export function OwnerStationProvider({ children }: { children: ReactNode }) {
  const api = useApi();

  const stationsQuery = useQuery({
    queryKey: ['stations', 'mine'],
    queryFn: () => api.stations.mine(),
  });

  const stations: Station[] = useMemo(() => {
    const raw = stationsQuery.data;
    if (Array.isArray(raw)) return raw;
    return (raw as { items?: Station[] } | undefined)?.items ?? [];
  }, [stationsQuery.data]);

  const [selectedStationId, setSelectedStationIdState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  // Ensure selectedStationId matches an existing station, fallback to first
  useEffect(() => {
    if (stations.length > 0) {
      const exists = stations.some((s) => s.id === selectedStationId);
      if (!exists && stations[0]) {
        setSelectedStationIdState(stations[0].id);
        try {
          localStorage.setItem(STORAGE_KEY, stations[0].id);
        } catch {
          // ignore
        }
      }
    }
  }, [stations, selectedStationId]);

  const setSelectedStationId = (id: string) => {
    setSelectedStationIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore
    }
  };

  const currentStation = useMemo(() => {
    if (!stations.length) return null;
    return stations.find((s) => s.id === selectedStationId) ?? stations[0] ?? null;
  }, [stations, selectedStationId]);

  const value = useMemo(
    () => ({
      stations,
      selectedStationId: currentStation?.id ?? selectedStationId,
      setSelectedStationId,
      currentStation,
      isLoading: stationsQuery.isLoading,
    }),
    [stations, currentStation, selectedStationId, stationsQuery.isLoading],
  );

  return <OwnerStationContext.Provider value={value}>{children}</OwnerStationContext.Provider>;
}

export function useOwnerStation() {
  const ctx = useContext(OwnerStationContext);
  if (!ctx) {
    throw new Error('useOwnerStation must be used within an OwnerStationProvider');
  }
  return ctx;
}
