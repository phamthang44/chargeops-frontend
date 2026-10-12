import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@/navigation/types';
import type { AppNotification } from '@/services/notificationService';

export type NotificationNavigation = NativeStackNavigationProp<RootStackParamList>;

/**
 * Single source of truth for "tap a notification → open the related screen".
 * Used by the notification sheets (map, station list, settings fallback).
 */
export function navigateFromNotification(
  n: AppNotification,
  navigation: NotificationNavigation,
): void {
  if (!n.referenceId && !n.target) return;

  // Prefer typed target from backend (#57)
  const targetType = n.target?.type;

  if (targetType === 'OPEN_BOOKING' || n.type === 'charging' || n.type === 'booking') {
    const bookingId = n.target?.bookingId ?? n.referenceId;
    if (bookingId) {
      if (n.type === 'charging') navigation.navigate('ChargingSession', { bookingId });
      else navigation.navigate('BookingDetail', { bookingId });
    }
  } else if (targetType === 'OPEN_TICKET' || targetType === 'OPEN_CASE' || n.type === 'ticket') {
    const ticketId = n.target?.ticketId ?? n.referenceId;
    if (ticketId) navigation.navigate('TicketDetail', { ticketId });
    else navigation.navigate('MyTickets');
  } else if (targetType === 'OPEN_REFUND' || n.type === 'finance') {
    const bookingId = n.target?.bookingId ?? n.referenceId;
    if (bookingId) navigation.navigate('BookingDetail', { bookingId });
    else navigation.navigate('Tabs', { screen: 'BookingHistory' });
  } else if (n.type === 'wallet') {
    navigation.navigate('Tabs', { screen: 'Profile' });
  }
}
