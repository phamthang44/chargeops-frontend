import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBackButton } from '@/components/AppBackButton';
import { AppButton } from '@/components/AppButton';
import { Card } from '@/components/Card';
import { usePreferences } from '@/context/PreferencesContext';
import type { RootStackParamList } from '@/navigation/types';
import { getActiveBookings, getBookingHistory } from '@/services/bookingService';
import { createTicket, getLocalizedTicketErrorMessage } from '@/services/ticketService';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { Booking, TicketCategory, TicketPriority } from '@/types';

type Route = RouteProp<RootStackParamList, 'CreateTicket'>;
type Nav = NativeStackNavigationProp<RootStackParamList, 'CreateTicket'>;

export function CreateTicketScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { themeColors, isDark } = usePreferences();

  const { bookingId, stationId, stationName, defaultCategory } = route.params || {};

  const categories = useMemo<{
    key: TicketCategory;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
  }[]>(() => [
    { key: 'CHARGING_ISSUE', label: t('ticket.category.CHARGING_ISSUE', 'Sự cố sạc pin'), icon: 'flash-outline', color: '#EF4444' },
    { key: 'BOOKING', label: t('ticket.category.BOOKING', 'Lỗi đặt chỗ'), icon: 'calendar-outline', color: '#3B82F6' },
    { key: 'PAYMENT', label: t('ticket.category.PAYMENT', 'Thanh toán & Phí'), icon: 'wallet-outline', color: '#F59E0B' },
    { key: 'ACCOUNT', label: t('ticket.category.ACCOUNT', 'Tài khoản'), icon: 'person-outline', color: '#8B5CF6' },
    { key: 'OTHER', label: t('ticket.category.OTHER', 'Vấn đề khác'), icon: 'help-circle-outline', color: '#6B7280' },
  ], [t]);

  const priorities = useMemo<{ key: TicketPriority; label: string; color: string }[]>(() => [
    { key: 'LOW', label: t('ticket.priority.LOW', 'Thấp'), color: '#10B981' },
    { key: 'MEDIUM', label: t('ticket.priority.MEDIUM', 'Bình thường'), color: '#F59E0B' },
    { key: 'HIGH', label: t('ticket.priority.HIGH', 'Khẩn cấp'), color: '#EF4444' },
  ], [t]);

  const quickChips = useMemo<string[]>(() => [
    t('ticket.quickSubjects.CHARGING_ISSUE_1', 'Súng sạc không cấp điện khi cắm'),
    t('ticket.quickSubjects.CHARGING_ISSUE_2', 'Trụ sạc báo lỗi đèn đỏ liên tục'),
    t('ticket.quickSubjects.CHARGING_ISSUE_3', 'Sạc bị tự ngắt giữa chừng'),
    t('ticket.quickSubjects.BOOKING_1', 'Không check-in QR được tại trạm'),
    t('ticket.quickSubjects.BOOKING_2', 'Chỗ đỗ sạc bị xe khác chiếm giữ'),
    t('ticket.quickSubjects.PAYMENT_1', 'Bị trừ tiền hai lần cho một phiên'),
  ], [t]);

  const [category, setCategory] = useState<TicketCategory>(defaultCategory ?? (bookingId ? 'CHARGING_ISSUE' : 'BOOKING'));
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
          const defaultTarget = unique.find((b) => b.status === 'CHARGING' || b.status === 'CHECKED_IN' || b.status === 'CONFIRMED') || unique[0];
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

  const handleSubmit = async () => {
    if (!subject.trim()) {
      Alert.alert(
        t('ticket.create.errorNoSubjectTitle', 'Chưa nhập tiêu đề'),
        t('ticket.create.errorNoSubjectBody', 'Vui lòng nhập tóm tắt sự cố bạn đang gặp phải.')
      );
      return;
    }
    if (!description.trim()) {
      Alert.alert(
        t('ticket.create.errorNoDescTitle', 'Chưa nhập mô tả'),
        t('ticket.create.errorNoDescBody', 'Vui lòng mô tả chi tiết để kỹ thuật viên có thể hỗ trợ nhanh nhất.')
      );
      return;
    }

    const effectiveBookingId = selectedBookingId || bookingId || null;
    const effectiveStationId = selectedStationId || stationId || null;

    // Scope Validation (BR-TKT-SCOPE)
    if (category === 'CHARGING_ISSUE' && !effectiveBookingId) {
      Alert.alert(
        t('ticket.create.errorBookingRequiredTitle', 'Cần chọn phiên sạc'),
        t('ticket.create.errorBookingRequiredBody', 'Sự cố sạc pin yêu cầu liên kết với phiên sạc cụ thể để kỹ thuật viên kiểm tra trụ sạc và kích hoạt bồi hoàn cọc.')
      );
      return;
    }

    if (category === 'BOOKING' && !effectiveBookingId && !effectiveStationId) {
      Alert.alert(
        t('ticket.create.errorStationRequiredTitle', 'Cần chọn trạm hoặc đơn đặt chỗ'),
        t('ticket.create.errorStationRequiredBody', 'Lỗi đặt chỗ yêu cầu chọn trạm sạc hoặc đơn đặt chỗ gặp sự cố.')
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
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: themeColors.surfaceAlt }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: themeColors.border, backgroundColor: themeColors.surface }]}>
        <AppBackButton onPress={() => navigation.goBack()} />
        <View style={styles.headerTitleBlock}>
          <Text style={[styles.headerTitle, { color: themeColors.textStrong }]} numberOfLines={1}>
            {t('ticket.create.title', 'Báo sự cố & Hỗ trợ')}
          </Text>
          <Text style={[styles.headerSubtitle, { color: themeColors.primary }]}>
            {t('ticket.create.subtitle', 'TRỰC TUYẾN 24/7')}
          </Text>
        </View>
        <View style={styles.headerRightAction} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Pre-linked Booking Banner (when navigating from active session) */}
          {bookingId && (
            <View
              style={[
                styles.contextCard,
                {
                  backgroundColor: isDark ? '#112233' : '#EFF6FF',
                  borderColor: isDark ? '#1D4ED8' : '#BFDBFE',
                },
              ]}
            >
              <View style={styles.contextHeader}>
                <Ionicons name="link-outline" size={19} color="#3B82F6" />
                <Text style={[styles.contextTitle, { color: '#3B82F6' }]}>
                  {t('ticket.create.bookingContext', 'BÁO CÁO THEO ĐƠN ĐẶT CHỖ')}
                </Text>
              </View>
              <Text style={[styles.contextText, { color: themeColors.textStrong }]}>
                {stationName
                  ? `${t('ticket.create.stationLabel', 'Trạm:')} ${stationName}`
                  : t('ticket.create.bookingContext', 'Sự cố gắn liền với đơn sạc hiện tại')}
              </Text>
              <Text style={[styles.contextSub, { color: themeColors.textMuted }]}>
                {t('ticket.create.bookingCodeLabel', 'Mã đơn:')} #{String(bookingId).slice(0, 10).toUpperCase()}
              </Text>
            </View>
          )}

          {/* Category selection */}
          <Card style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <Text style={[styles.sectionTitle, { color: themeColors.textStrong }]}>
              {t('ticket.create.categoryTitle', 'Loại sự cố *')}
            </Text>
            <View style={styles.categoryGrid}>
              {categories.map((cat) => {
                const isSelected = category === cat.key;
                return (
                  <Pressable
                    key={cat.key}
                    style={[
                      styles.categoryItem,
                      {
                        backgroundColor: isSelected ? `${cat.color}15` : themeColors.surfaceAlt,
                        borderColor: isSelected ? cat.color : themeColors.border,
                      },
                    ]}
                    onPress={() => setCategory(cat.key)}
                  >
                    <Ionicons name={cat.icon} size={22} color={isSelected ? cat.color : themeColors.textMuted} />
                    <Text
                      style={[
                        styles.categoryItemLabel,
                        { color: isSelected ? cat.color : themeColors.textBody },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          {/* Scope Selector: Booking Session Selection for Station Incidents */}
          {!bookingId && isStationCategory && (
            <Card style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <View style={styles.sessionHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionTitle, { color: themeColors.textStrong }]}>
                    {category === 'CHARGING_ISSUE'
                      ? t('ticket.create.selectSessionTitle', 'Chọn phiên sạc gặp sự cố *')
                      : t('ticket.create.selectStationTitle', 'Chọn trạm hoặc phiên đặt chỗ *')}
                  </Text>
                  <Text style={[styles.sessionHelpText, { color: themeColors.textMuted }]}>
                    {category === 'CHARGING_ISSUE'
                      ? t('ticket.create.selectSessionHelp', 'Sự cố sạc pin yêu cầu liên kết với phiên sạc để kỹ thuật viên kiểm tra trụ sạc và kích hoạt bồi hoàn cọc 100%.')
                      : t('ticket.create.selectStationHelp', 'Lỗi đặt chỗ yêu cầu liên kết với trạm sạc hoặc phiên đặt chỗ liên quan.')}
                  </Text>
                </View>
              </View>

              {loadingCandidates ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="small" color={themeColors.primary} />
                  <Text style={[styles.loadingBoxText, { color: themeColors.textMuted }]}>
                    {t('common.loading', 'Đang tải danh sách phiên sạc...')}
                  </Text>
                </View>
              ) : candidateBookings.length === 0 ? (
                <View
                  style={[
                    styles.warningBox,
                    {
                      backgroundColor: isDark ? '#2E1A0A' : '#FFFBEB',
                      borderColor: isDark ? '#78350F' : '#FDE68A',
                    },
                  ]}
                >
                  <Ionicons name="warning-outline" size={20} color="#D97706" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.warningTitle, { color: '#B45309' }]}>
                      {t('ticket.create.noSessionsFound', 'Không tìm thấy phiên sạc nào trên tài khoản')}
                    </Text>
                    <Text style={[styles.warningBody, { color: themeColors.textMuted }]}>
                      {t('ticket.create.noSessionsWarning', 'Để báo "Sự cố sạc pin", bạn cần chọn một phiên sạc đã thực hiện. Nếu gặp sự cố chung, vui lòng chọn loại "Thanh toán & Phí" hoặc "Vấn đề khác".')}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.candidateList}>
                  {candidateBookings.map((b) => {
                    const isSelected = selectedBookingId === b.id;
                    const startTimeStr = b.startAt
                      ? new Date(b.startAt).toLocaleString([], {
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—';

                    return (
                      <Pressable
                        key={b.id}
                        style={[
                          styles.candidateItem,
                          {
                            backgroundColor: isSelected ? (isDark ? '#0D3827' : '#ECFDF5') : themeColors.surfaceAlt,
                            borderColor: isSelected ? '#10B981' : themeColors.border,
                          },
                        ]}
                        onPress={() => {
                          setSelectedBookingId(b.id);
                          setSelectedStationId(b.stationId);
                          setSelectedStationName(b.stationName || null);
                        }}
                      >
                        <View style={styles.candidateLeft}>
                          <View
                            style={[
                              styles.radioCircle,
                              {
                                borderColor: isSelected ? '#10B981' : themeColors.border,
                                backgroundColor: isSelected ? '#10B981' : 'transparent',
                              },
                            ]}
                          >
                            {isSelected && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
                          </View>
                          <View style={{ flex: 1, gap: 2 }}>
                            <View style={styles.candidateRow}>
                              <Text style={[styles.candidateStation, { color: themeColors.textStrong }]} numberOfLines={1}>
                                {b.stationName || t('common.station', 'Trạm sạc')}
                              </Text>
                              <Text style={[styles.candidateCode, { color: '#3B82F6' }]}>
                                #{String(b.id).slice(0, 8).toUpperCase()}
                              </Text>
                            </View>
                            <View style={styles.candidateSubRow}>
                              <Ionicons name="time-outline" size={13} color={themeColors.textMuted} />
                              <Text style={[styles.candidateTime, { color: themeColors.textMuted }]}>
                                {startTimeStr}
                              </Text>
                              <Text style={[styles.candidateStatus, { color: themeColors.textMuted }]}>
                                · {b.status}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </Card>
          )}

          {/* Platform Scope Information Box */}
          {isPlatformCategory && (
            <View
              style={[
                styles.platformCard,
                {
                  backgroundColor: isDark ? '#1A182E' : '#F5F3FF',
                  borderColor: isDark ? '#4C1D95' : '#DDD6FE',
                },
              ]}
            >
              <View style={styles.contextHeader}>
                <Ionicons name="shield-checkmark" size={19} color="#7C3AED" />
                <Text style={[styles.contextTitle, { color: '#7C3AED' }]}>
                  {t('ticket.create.platformScopeBadge', 'Hàng chờ Nền tảng & Thanh toán')}
                </Text>
              </View>
              <Text style={[styles.platformHelpText, { color: themeColors.textBody }]}>
                {t('ticket.create.platformScopeHelp', 'Sự cố này được chuyển thẳng tới Quản trị viên ChargeOps để tra soát giao dịch/tài khoản. Không yêu cầu trạm sạc.')}
              </Text>
            </View>
          )}

          {/* Priority selection */}
          <Card style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <Text style={[styles.sectionTitle, { color: themeColors.textStrong }]}>
              {t('ticket.create.priorityTitle', 'Mức độ ưu tiên')}
            </Text>
            <View style={styles.priorityRow}>
              {priorities.map((pri) => {
                const isSelected = priority === pri.key;
                return (
                  <Pressable
                    key={pri.key}
                    style={[
                      styles.priorityItem,
                      {
                        backgroundColor: isSelected ? `${pri.color}18` : themeColors.surfaceAlt,
                        borderColor: isSelected ? pri.color : themeColors.border,
                      },
                    ]}
                    onPress={() => setPriority(pri.key)}
                  >
                    <View style={[styles.priorityDot, { backgroundColor: pri.color }]} />
                    <Text
                      style={[
                        styles.priorityLabel,
                        { color: isSelected ? pri.color : themeColors.textBody },
                      ]}
                    >
                      {pri.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          {/* Quick chips */}
          <View style={styles.quickChipsSection}>
            <Text style={[styles.quickChipsTitle, { color: themeColors.textMuted }]}>
              {t('ticket.create.quickSuggestionsTitle', 'Gợi ý nhanh sự cố thường gặp')}:
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
              {quickChips.map((chip) => (
                <Pressable
                  key={chip}
                  style={[styles.chip, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
                  onPress={() => {
                    setSubject(chip);
                    if (!description) {
                      setDescription(`${chip}.`);
                    }
                  }}
                >
                  <Text style={[styles.chipText, { color: themeColors.textBody }]}>{chip}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Subject & Description Inputs */}
          <Card style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <Text style={[styles.inputLabel, { color: themeColors.textStrong }]}>
              {t('ticket.create.subjectLabel', 'Tóm tắt sự cố *')}
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: themeColors.surfaceAlt,
                  color: themeColors.textStrong,
                  borderColor: themeColors.border,
                },
              ]}
              placeholder={t('ticket.create.subjectPlaceholder', 'Ví dụ: Súng sạc trụ 02 tự ngắt khi mới sạc...')}
              placeholderTextColor={themeColors.textMuted}
              value={subject}
              onChangeText={setSubject}
              maxLength={100}
            />

            <View style={styles.descHeader}>
              <Text style={[styles.inputLabel, { color: themeColors.textStrong }]}>
                {t('ticket.create.descLabel', 'Mô tả chi tiết sự cố *')}
              </Text>
              <Text style={[styles.charCount, { color: themeColors.textMuted }]}>
                {t('ticket.create.charCount', { count: description.length })}
              </Text>
            </View>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: themeColors.surfaceAlt,
                  color: themeColors.textStrong,
                  borderColor: themeColors.border,
                },
              ]}
              placeholder={t('ticket.create.descPlaceholder', 'Mô tả cụ thể thời điểm, mã trụ/súng, thông báo lỗi trên màn hình trụ sạc...')}
              placeholderTextColor={themeColors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={2000}
              textAlignVertical="top"
            />
          </Card>
        </ScrollView>

        {/* Action Submit Footer */}
        <View style={[styles.footer, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
          <AppButton
            label={submitting ? t('ticket.create.submitting', 'Đang gửi phiếu...') : t('ticket.create.submitBtn', 'Gửi phiếu hỗ trợ sự cố')}
            disabled={submitting}
            onPress={handleSubmit}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitleBlock: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  headerTitle: {
    fontSize: 18.5,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11.5,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.8,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  headerRightAction: {
    width: 40,
    height: 40,
  },
  keyboardView: { flex: 1 },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  contextCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 5,
  },
  contextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  contextTitle: {
    fontSize: 13.5,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.3,
  },
  contextText: {
    fontSize: 15,
    fontWeight: fontWeights.bold,
  },
  contextSub: {
    fontSize: 13,
    fontFamily: 'monospace',
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 15.5,
    fontWeight: fontWeights.bold,
    marginBottom: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  categoryItemLabel: {
    fontSize: 13.5,
    fontWeight: fontWeights.bold,
  },
  sessionHeaderRow: {
    marginBottom: 4,
  },
  sessionHelpText: {
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 2,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  loadingBoxText: {
    fontSize: 13,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  warningTitle: {
    fontSize: 13.5,
    fontWeight: fontWeights.bold,
  },
  warningBody: {
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 2,
  },
  candidateList: {
    gap: 8,
    marginTop: 4,
  },
  candidateItem: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
  },
  candidateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  candidateStation: {
    fontSize: 14.5,
    fontWeight: fontWeights.bold,
    flex: 1,
  },
  candidateCode: {
    fontSize: 12.5,
    fontWeight: fontWeights.bold,
    fontFamily: 'monospace',
  },
  candidateSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  candidateTime: {
    fontSize: 12.5,
  },
  candidateStatus: {
    fontSize: 12.5,
  },
  platformCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 5,
  },
  platformHelpText: {
    fontSize: 13,
    lineHeight: 19,
  },
  priorityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  priorityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  priorityDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  priorityLabel: {
    fontSize: 13.5,
    fontWeight: fontWeights.medium,
  },
  quickChipsSection: {
    gap: 7,
  },
  quickChipsTitle: {
    fontSize: 13,
    fontWeight: fontWeights.medium,
    paddingHorizontal: spacing.xs,
  },
  chipsScroll: {
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
  },
  inputLabel: {
    fontSize: 14.5,
    fontWeight: fontWeights.bold,
    marginTop: 4,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    fontSize: 15.5,
    lineHeight: 22,
  },
  descHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  charCount: {
    fontSize: 12.5,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    fontSize: 15.5,
    lineHeight: 22,
    minHeight: 120,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
