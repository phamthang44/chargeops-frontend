import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Ionicons } from '@expo/vector-icons';

import type { RootStackParamList } from '@/navigation/types';
import { getActiveBookings, getBookingHistory } from '@/services/bookingService';
import { createTicket, getLocalizedTicketErrorMessage } from '@/services/ticketService';
import type { Booking, TicketCategory, TicketPriority } from '@/types';

type Route = RouteProp<RootStackParamList, 'CreateTicket'>;
type Nav = NativeStackNavigationProp<RootStackParamList, 'CreateTicket'>;

export interface CategoryOption {
  key: TicketCategory;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export interface PriorityOption {
  key: TicketPriority;
  label: string;
  color: string;
}

export function useCreateTicket() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();

  const { bookingId, stationId, stationName, defaultCategory } = route.params || {};

  const categories = useMemo<CategoryOption[]>(
    () => [
      { key: 'CHARGING_ISSUE', label: t('ticket.category.CHARGING_ISSUE', 'Sự cố sạc pin'), icon: 'flash-outline', color: '#EF4444' },
      { key: 'BOOKING', label: t('ticket.category.BOOKING', 'Lỗi đặt chỗ'), icon: 'calendar-outline', color: '#3B82F6' },
      { key: 'PAYMENT', label: t('ticket.category.PAYMENT', 'Thanh toán & Phí'), icon: 'wallet-outline', color: '#F59E0B' },
      { key: 'ACCOUNT', label: t('ticket.category.ACCOUNT', 'Tài khoản'), icon: 'person-outline', color: '#8B5CF6' },
      { key: 'OTHER', label: t('ticket.category.OTHER', 'Vấn đề khác'), icon: 'help-circle-outline', color: '#6B7280' },
    ],
    [t],
  );

  const priorities = useMemo<PriorityOption[]>(
    () => [
      { key: 'LOW', label: t('ticket.priority.LOW', 'Thấp'), color: '#10B981' },
      { key: 'MEDIUM', label: t('ticket.priority.MEDIUM', 'Bình thường'), color: '#F59E0B' },
      { key: 'HIGH', label: t('ticket.priority.HIGH', 'Khẩn cấp'), color: '#EF4444' },
    ],
    [t],
  );

  const quickChips = useMemo<string[]>(
    () => [
      t('ticket.quickSubjects.CHARGING_ISSUE_1', 'Súng sạc không cấp điện khi cắm'),
      t('ticket.quickSubjects.CHARGING_ISSUE_2', 'Trụ sạc báo lỗi đèn đỏ liên tục'),
      t('ticket.quickSubjects.CHARGING_ISSUE_3', 'Sạc bị tự ngắt giữa chừng'),
      t('ticket.quickSubjects.BOOKING_1', 'Không check-in QR được tại trạm'),
      t('ticket.quickSubjects.BOOKING_2', 'Chỗ đỗ sạc bị xe khác chiếm giữ'),
      t('ticket.quickSubjects.PAYMENT_1', 'Bị trừ tiền hai lần cho một phiên'),
    ],
    [t],
  );

  const [category, setCategory] = useState<TicketCategory>(
    defaultCategory ?? (bookingId ? 'CHARGING_ISSUE' : 'BOOKING'),
  );
  const [priority, setPriority] = useState<TicketPriority>(bookingId ? 'HIGH' : 'MEDIUM');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Candidate sessions/bookings state
  const [candidateBookings, setCandidateBookings] = useState<Booking[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(bookingId ?? null);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(stationId ?? null);
  const [selectedStationName, setSelectedStationName] = useState<string | null>(stationName ?? null);

  const isStationCategory = category === 'CHARGING_ISSUE' || category === 'BOOKING';
  const isPlatformCategory = !isStationCategory;

  useEffect(() => {
    if (bookingId) return;

    let isMounted = true;
    async function loadCandidateBookings() {
      try {
        setLoadingCandidates(true);
        const [actives, history] = await Promise.all([
          getActiveBookings().catch(() => []),
          getBookingHistory({}, { pageIndex: 1, limit: 10 }).catch(() => ({ items: [] })),
        ]);
        if (!isMounted) return;

        const combined = [...actives, ...(history.items || [])];
        const unique = Array.from(new Map(combined.map((b) => [b.id, b])).values());
        setCandidateBookings(unique);

        if (unique.length > 0 && !selectedBookingId) {
          const defaultTarget =
            unique.find(
              (b) => b.status === 'CHARGING' || b.status === 'CHECKED_IN' || b.status === 'CONFIRMED',
            ) || unique[0];
          if (defaultTarget) {
            setSelectedBookingId(defaultTarget.id);
            setSelectedStationId(defaultTarget.stationId);
            setSelectedStationName(defaultTarget.stationName || null);
          }
        }
      } finally {
        if (isMounted) setLoadingCandidates(false);
      }
    }

    loadCandidateBookings();
    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  const handleSelectBooking = useCallback((booking: Booking) => {
    setSelectedBookingId(booking.id);
    setSelectedStationId(booking.stationId);
    setSelectedStationName(booking.stationName || null);
  }, []);

  const applyQuickChip = useCallback(
    (chip: string) => {
      setSubject(chip);
      setDescription((prev) => (prev ? prev : `${chip}.`));
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    if (!subject.trim()) {
      Alert.alert(
        t('ticket.create.errorNoSubjectTitle', 'Chưa nhập tiêu đề'),
        t('ticket.create.errorNoSubjectBody', 'Vui lòng nhập tóm tắt sự cố bạn đang gặp phải.'),
      );
      return;
    }
    if (!description.trim()) {
      Alert.alert(
        t('ticket.create.errorNoDescTitle', 'Chưa nhập mô tả'),
        t('ticket.create.errorNoDescBody', 'Vui lòng mô tả chi tiết để kỹ thuật viên có thể hỗ trợ nhanh nhất.'),
      );
      return;
    }

    const effectiveBookingId = selectedBookingId || bookingId || null;
    const effectiveStationId = selectedStationId || stationId || null;

    // Scope Validation (BR-TKT-SCOPE)
    if (category === 'CHARGING_ISSUE' && !effectiveBookingId) {
      Alert.alert(
        t('ticket.create.errorBookingRequiredTitle', 'Cần chọn phiên sạc'),
        t('ticket.create.errorBookingRequiredBody', 'Sự cố sạc pin yêu cầu liên kết với phiên sạc cụ thể để kỹ thuật viên kiểm tra trụ sạc và kích hoạt bồi hoàn cọc.'),
      );
      return;
    }

    if (category === 'BOOKING' && !effectiveBookingId && !effectiveStationId) {
      Alert.alert(
        t('ticket.create.errorStationRequiredTitle', 'Cần chọn trạm hoặc đơn đặt chỗ'),
        t('ticket.create.errorStationRequiredBody', 'Lỗi đặt chỗ yêu cầu chọn trạm sạc hoặc đơn đặt chỗ gặp sự cố.'),
      );
      return;
    }

    try {
      setSubmitting(true);
      const created = await createTicket({
        category,
        priority,
        subject: subject.trim(),
        description: description.trim(),
        bookingId: isStationCategory ? effectiveBookingId : null,
        stationId: isStationCategory ? effectiveStationId : null,
      });

      // Navigate immediately to ticket thread
      navigation.replace('TicketDetail', { ticketId: created.ticketId });
    } catch (err: any) {
      const localizedMsg = getLocalizedTicketErrorMessage(err, t);
      Alert.alert(t('common.error', 'Lỗi'), localizedMsg);
    } finally {
      setSubmitting(false);
    }
  }, [
    subject,
    description,
    selectedBookingId,
    bookingId,
    selectedStationId,
    stationId,
    category,
    priority,
    isStationCategory,
    navigation,
    t,
  ]);

  return {
    // Route info
    bookingId,
    stationId,
    stationName,
    selectedStationName,

    // Categories & priorities
    categories,
    priorities,
    quickChips,
    category,
    setCategory,
    priority,
    setPriority,
    subject,
    setSubject,
    description,
    setDescription,
    submitting,

    // Scope & candidate sessions
    candidateBookings,
    loadingCandidates,
    selectedBookingId,
    handleSelectBooking,
    isStationCategory,
    isPlatformCategory,

    // Actions
    handleSubmit,
    applyQuickChip,
    goBack: () => navigation.goBack(),
  };
}
