import type { NavigatorScreenParams } from '@react-navigation/native';

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
 * Booking flow: StationList/Map -> StationDetail -> SlotPicker -> QRCheckIn.
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
  QRCheckIn: { bookingId?: string };
};
