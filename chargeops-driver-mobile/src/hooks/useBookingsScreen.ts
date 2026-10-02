import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@/navigation/types';
import {
  getActiveBookings,
  getBookingNowMs,
} from '@/services/bookingService';
import type { Booking, BookingStatus } from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
export type BookingsTab = 'charging' | 'upcoming';

const CHARGING_STATUSES: BookingStatus[] = ['CHECKED_IN'];
const UPCOMING_STATUSES: BookingStatus[] = ['PENDING', 'CONFIRMED'];

export function useBookingsScreen() {
  const navigation = useNavigation<Nav>();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<BookingsTab>('upcoming');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [now, setNow] = useState(getBookingNowMs());

  useEffect(() => {
    const id = setInterval(() => setNow(getBookingNowMs()), 1000);
    return () => clearInterval(id);
  }, []);

  // Live polling: auto-refresh when user has active PENDING or CHARGING bookings
  useEffect(() => {
    const hasLive = bookings.some((b) => b.status === 'PENDING' || b.status === 'CHARGING');
    if (!hasLive) return;

    const interval = setInterval(() => {
      getActiveBookings()
        .then((data) => {
          setBookings(data);
        })
        .catch(() => {});
    }, 6000);

    return () => clearInterval(interval);
  }, [bookings]);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await getActiveBookings();
      setBookings(data);
      setNow(getBookingNowMs());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getActiveBookings().then((data) => {
        if (active) {
          setBookings(data);
          setNow(getBookingNowMs());
          setLoading(false);
        }
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const charging = useMemo(
    () =>
      bookings
        .filter((b) => CHARGING_STATUSES.includes(b.status))
        .sort((a, b) => (a.startAt < b.startAt ? -1 : 1)),
    [bookings],
  );

  const upcoming = useMemo(
    () =>
      bookings
        .filter((b) => UPCOMING_STATUSES.includes(b.status))
        .sort((a, b) => (a.startAt < b.startAt ? -1 : 1)),
    [bookings],
  );

  const hero = useMemo(
    () => (tab === 'upcoming' ? upcoming.find((b) => b.status === 'CONFIRMED') : undefined),
    [tab, upcoming],
  );

  const chargingHero = useMemo(
    () => (tab === 'charging' ? charging[0] : undefined),
    [tab, charging],
  );

  const list = tab === 'charging'
    ? charging.filter((b) => b.id !== chargingHero?.id)
    : upcoming.filter((b) => b.id !== hero?.id);

  const onAction = useCallback(
    (b: Booking) => {
      if (b.status === 'CONFIRMED') {
        if (b.actions?.canCheckIn) {
          navigation.navigate('QRCheckIn', { bookingId: b.id });
        } else {
          navigation.navigate('BookingDetail', { bookingId: b.id });
        }
      } else if (b.status === 'CHECKED_IN') {
        navigation.navigate('ChargingSession', { bookingId: b.id });
      } else {
        navigation.navigate('BookingDetail', { bookingId: b.id });
      }
    },
    [navigation],
  );

  const goToDetail = useCallback(
    (bookingId: string) => {
      navigation.navigate('BookingDetail', { bookingId });
    },
    [navigation],
  );

  const goToChargingSession = useCallback(
    (bookingId: string) => {
      navigation.navigate('ChargingSession', { bookingId });
    },
    [navigation],
  );

  const goToQRCheckIn = useCallback(
    (bookingId: string) => {
      navigation.navigate('QRCheckIn', { bookingId });
    },
    [navigation],
  );

  const goToHistory = useCallback(() => {
    navigation.navigate('Tabs', { screen: 'BookingHistory' });
  }, [navigation]);

  const isEmpty = !hero && !chargingHero && list.length === 0;

  return {
    bookings,
    loading,
    refreshing,
    tab,
    setTab,
    settingsOpen,
    setSettingsOpen,
    now,
    charging,
    upcoming,
    hero,
    chargingHero,
    list,
    isEmpty,
    loadData,
    onAction,
    goToDetail,
    goToChargingSession,
    goToQRCheckIn,
    goToHistory,
  };
}
