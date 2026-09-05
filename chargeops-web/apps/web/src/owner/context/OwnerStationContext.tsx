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

export function OwnerStationProvider({
  reduced = false,
  children,
}: {
  reduced?: boolean;
  children: ReactNode;
}) {
  const api = useApi();

  // Owner mode queries all owned stations; staff mode queries only the single assigned staff context
  const stationsQuery = useQuery({
    queryKey: ['stations', 'mine'],
    queryFn: () => api.stations.mine(),
    enabled: !reduced,
  });

  const staffContextQuery = useQuery({
    queryKey: ['staff', 'current-context'],
    queryFn: () => api.staff.currentContext(),
    enabled: reduced,
  });

  const [selectedStationId, setSelectedStationIdState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || '';
      // If we are in real API mode (VITE_USE_MOCKS === 'false'), mock IDs like 'ST-1001' are invalid
      if (import.meta.env.VITE_USE_MOCKS === 'false' && saved.startsWith('ST-')) {
        return '';
      }
      return saved;
    } catch {
      return '';
    }
  });

  const stations: Station[] = useMemo(() => {
    if (reduced) {
      const st = staffContextQuery.data?.station;
      if (!st) return [];
      return [
        {
          id: st.id,
          name: st.name,
          stationCode: st.stationCode,
          status: 'active',
          chargerCount: 0,
          onlineCount: 0,
        } as Station,
      ];
    }
    const raw = stationsQuery.data;
    if (Array.isArray(raw)) return raw;
    return (raw as { items?: Station[] } | undefined)?.items ?? [];
  }, [reduced, staffContextQuery.data?.station, stationsQuery.data]);

  const currentStation = useMemo(() => {
    if (!stations.length) return null;
    return stations.find((s) => s.id === selectedStationId) ?? stations[0] ?? null;
  }, [stations, selectedStationId]);

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
    } else if (!stationsQuery.isLoading && !staffContextQuery.isLoading) {
      if (selectedStationId) {
        setSelectedStationIdState('');
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          // ignore
        }
      }
    }
  }, [stations, selectedStationId, stationsQuery.isLoading, staffContextQuery.isLoading]);

  const setSelectedStationId = (id: string) => {
    if (reduced) return; // Staff assignment is fixed to single station
    setSelectedStationIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore
    }
  };

  const value = useMemo(
    () => ({
      stations,
      selectedStationId: currentStation?.id ?? '',
      setSelectedStationId,
      currentStation,
      isLoading: reduced ? staffContextQuery.isLoading : stationsQuery.isLoading,
    }),
    [stations, currentStation, reduced, staffContextQuery.isLoading, stationsQuery.isLoading],
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
