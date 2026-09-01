import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

export interface UserCoordinates {
  latitude: number;
  longitude: number;
}

/** Fallback coordinates (TP. Hồ Chí Minh center: Bến Thành) */
export const DEFAULT_HCMC_COORDS: UserCoordinates = {
  latitude: 10.7721,
  longitude: 106.6982,
};

/**
 * Hook to retrieve the driver's current GPS location via expo-location.
 * Gracefully handles permission requests, platform differences (Web & Mobile),
 * and provides fallback coordinates if permission is denied.
 */
export function useUserLocation() {
  const [coords, setCoords] = useState<UserCoordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const fetchLocation = useCallback(async () => {
    try {
      setLoading(true);

      // On Web, navigator.geolocation is also supported through expo-location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionGranted(false);
        // Fallback to default coordinates so discovery distance calculations still work
        setCoords(DEFAULT_HCMC_COORDS);
        return;
      }

      setPermissionGranted(true);
      const loc = await Location.getCurrentPositionAsync({
        accuracy:
          Platform.OS === 'web'
            ? Location.Accuracy.Balanced
            : Location.Accuracy.Balanced,
      });

      setCoords({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch {
      // If hardware GPS fails or times out, fallback to default center
      setCoords(DEFAULT_HCMC_COORDS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return {
    coords,
    loading,
    permissionGranted,
    refreshLocation: fetchLocation,
  };
}
