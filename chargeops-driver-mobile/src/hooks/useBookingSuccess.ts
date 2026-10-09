import { useEffect, useState } from 'react';
import { CommonActions, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@/navigation/types';
import { getBookingById } from '@/services/bookingService';
import type { Booking } from '@/types';
import { copyText } from '@/utils/clipboard';

type Nav = NativeStackNavigationProp<RootStackParamList, 'BookingSuccess'>;
type Route = RouteProp<RootStackParamList, 'BookingSuccess'>;

export function useBookingSuccess() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    getBookingById(params.bookingId).then((b) => {
      if (active) setBooking(b);
    });
    return () => {
      active = false;
    };
  }, [params.bookingId]);

  function handleCopyCode() {
    if (!booking?.code) return;
    copyText(booking.code).then((ok) => {
      if (!ok) return;
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    });
  }

  function goHome() {
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'Tabs' }] }),
    );
  }

  function viewDetail() {
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [{ name: 'Tabs' }, { name: 'BookingDetail', params: { bookingId: params.bookingId } }],
      }),
    );
  }

  return {
    booking,
    copied,
    handleCopyCode,
    goHome,
    viewDetail,
  };
}
