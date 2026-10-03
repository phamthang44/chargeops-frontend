import type { NavigatorScreenParams } from '@react-navigation/native';

/**
 * Bottom tab routes (5 tabs, matching the design):
 * Bản đồ / Tìm trạm / Đặt chỗ / Lịch sử / Hồ sơ.
 */
export type BottomTabParamList = {
  Map: undefined; // Bản đồ (màn hình mặc định)
  StationList: undefined; // Tìm trạm (danh sách)
  Bookings: undefined; // Đặt chỗ (upcoming/active bookings)
  BookingHistory: undefined; // Lịch sử
  Profile: undefined; // Hồ sơ
};

/**
 * Root native-stack routes. The visible stack is chosen by auth state
 * (see RootNavigator): the auth stack when signed out, the app stack when signed in.
 *
 * Auth flow: Welcome -> Login -> Register -> OtpVerification -> (sign in) -> Tabs.
 * Booking flow: StationList/Map -> StationDetail -> TimeRangePicker ->
 *   BookingConfirmation -> PaymentProcessing -> BookingSuccess -> BookingDetail
 *   -> QRCheckIn -> ChargingSession.
 */
export type RootStackParamList = {
  // Auth stack (signed out)
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  OtpVerification: { channel: 'phone' | 'email'; target: string };
  CompleteProfile: undefined;
  // App stack (signed in)
  Tabs: NavigatorScreenParams<BottomTabParamList> | undefined;
  StationDetail: { stationId: string; distanceKm?: number };
  // Pick a date, a start time and a duration on one Connector (FR05/FR11).
  TimeRangePicker: { stationId: string; connectorId?: string; isFromFastTrack?: boolean };
  // Review the chosen window + pick a payment method, then create the booking.
  BookingConfirmation: {
    stationId: string;
    connectorId: string;
    startAt: string;
    durationMin: number;
    priceRanges?: { startAt: string; endAt: string; rateVndPerKwh: number; periodCode?: string }[];
    isFastTrack?: boolean;
  };
  // "Waiting for payment" — booking is PENDING until the gateway confirms.
  PaymentProcessing: { bookingId: string };
  // Post-payment confirmation screen.
  BookingSuccess: { bookingId: string };
  // A single booking (upcoming countdown / payment breakdown / cancel).
  BookingDetail: { bookingId: string };
  QRCheckIn: { bookingId?: string };
  // Live charging session after a successful check-in.
  ChargingSession: { bookingId?: string };
  // Support & Issue Ticket screens (FE-13)
  CreateTicket: {
    bookingId?: string;
    stationId?: string;
    stationName?: string;
    defaultCategory?: 'CHARGING_ISSUE' | 'BOOKING' | 'PAYMENT' | 'ACCOUNT' | 'OTHER';
  };
  MyTickets: undefined;
  TicketDetail: { ticketId: string };
};
