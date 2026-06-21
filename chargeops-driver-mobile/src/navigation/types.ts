import type { NavigatorScreenParams } from '@react-navigation/native';

import type { BookingSlotInput } from '@/types';

/**
 * Bottom tab routes (5 tabs, matching the design):
 * Tìm trạm / Bản đồ / Đặt chỗ / Lịch sử / Hồ sơ.
 */
export type BottomTabParamList = {
  StationList: undefined; // Tìm trạm (home / discovery)
  Map: undefined; // Bản đồ
  Bookings: undefined; // Đặt chỗ (upcoming/active bookings)
  BookingHistory: undefined; // Lịch sử
  Profile: undefined; // Hồ sơ
};

/**
 * Root native-stack routes. The visible stack is chosen by auth state
 * (see RootNavigator): the auth stack when signed out, the app stack when signed in.
 *
 * Auth flow: Welcome -> Login -> Register -> OtpVerification -> (sign in) -> Tabs.
 * Booking flow: StationList/Map -> StationDetail -> SlotPicker ->
 *   BookingConfirmation -> PaymentProcessing -> BookingSuccess -> BookingDetail
 *   -> QRCheckIn -> ChargingSession.
 */
export type RootStackParamList = {
  // Auth stack (signed out)
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  OtpVerification: { channel: 'phone' | 'email'; target: string };
  // App stack (signed in)
  Tabs: NavigatorScreenParams<BottomTabParamList> | undefined;
  StationDetail: { stationId: string };
  SlotPicker: { stationId: string; chargerId?: string };
  // Review the chosen slots + pick a payment method, then create the booking.
  BookingConfirmation: { stationId: string; chargerId: string; slots: BookingSlotInput[] };
  // "Waiting for payment" — booking is PENDING until the gateway confirms.
  PaymentProcessing: { bookingId: string };
  // Post-payment confirmation screen.
  BookingSuccess: { bookingId: string };
  // A single booking (upcoming countdown / payment breakdown / cancel).
  BookingDetail: { bookingId: string };
  QRCheckIn: { bookingId?: string };
  // Live charging session after a successful check-in.
  ChargingSession: { bookingId?: string };
};
