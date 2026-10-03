import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  AppState,
  type AppStateStatus,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBackButton } from '@/components/AppBackButton';
import { AppButton } from '@/components/AppButton';
import { StatusBadge } from '@/components/StatusBadge';
import { DriverContinueTicketModal } from '@/components/ticket/DriverContinueTicketModal';
import {
  ConfirmSheet,
  DriverEscalateModal,
  ResolvedResolutionCard,
  TicketDisputeEscalationCard,
  TicketMessageBubble,
  type ConfirmSheetTone,
} from '@/components/ticket';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import type { RootStackParamList } from '@/navigation/types';
import {
  getLocalizedTicketErrorMessage,
  getTicketDetail,
  getTicketEscalation,
  replyTicket,
  requestTicketEscalation,
  confirmTicketClosed,
  continueTicket,
} from '@/services/ticketService';
import { isMockMode } from '@/services/stationService';
import { formatDateTime } from '@/utils/format';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { Ticket, TicketEscalation, TicketMessage, TicketStatus } from '@/types';

type Route = RouteProp<RootStackParamList, 'TicketDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList, 'TicketDetail'>;

const STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; variant: 'info' | 'warning' | 'success' | 'neutral' }
> = {
  OPEN: { label: 'Mới mở', variant: 'info' },
  IN_PROGRESS: { label: 'Đang xử lý', variant: 'warning' },
  RESOLVED: { label: 'Đã giải quyết', variant: 'success' },
  CLOSED: { label: 'Đã đóng', variant: 'neutral' },
};

const CONCLUSION_CONFIG: Record<string, string> = {
  STATION_FAILURE: 'Lỗi phía trạm sạc',
  NOT_STATION_FAILURE: 'Không phải lỗi trạm',
  HARDWARE_FAULT: 'Lỗi phần cứng trụ sạc',
  STATION_OFFLINE: 'Trạm mất kết nối mạng',
  SOFTWARE_BUG: 'Sự cố phần mềm / firmware',
  USER_ERROR: 'Thao tác phía người dùng',
  OTHER: 'Nguyên nhân khác',
};

/** Nội dung hộp thoại thông báo (thay thế `Alert.alert` — no-op trên web). */
interface NoticeState {
  title: string;
  message?: string;
  tone: ConfirmSheetTone;
}

export function TicketDetailScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { themeColors, isDark } = usePreferences();
  const { profile, profileStatus } = useAuth();
  const { ticketId } = route.params;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const [escalation, setEscalation] = useState<TicketEscalation | null>(null);
  const [isEscalateModalVisible, setIsEscalateModalVisible] = useState(false);
  const [isSubmittingEscalation, setIsSubmittingEscalation] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isContinueModalVisible, setIsContinueModalVisible] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [notice, setNotice] = useState<NoticeState | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const prevMessagesCountRef = useRef<number>(0);

  const fetchEscalation = useCallback(async () => {
    try {
      const esc = await getTicketEscalation(ticketId);
      setEscalation(esc);
    } catch {
      // Non-critical, ignore
    }
  }, [ticketId]);

  const fetchDetail = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await getTicketDetail(ticketId);
      setTicket(prev => {
        if (!prev) {
          prevMessagesCountRef.current = data.messages?.length || 0;
          return data;
        }

        // Merge messages: keep server messages + any optimistic messages currently pending
        const serverMessages = data.messages || [];
        const pendingOptimistic = (prev.messages || []).filter(
          m => m.messageId.startsWith('temp-') && !serverMessages.some(sm => sm.body === m.body && sm.authorKind === m.authorKind)
        );
        const mergedMessages = [...serverMessages, ...pendingOptimistic];

        const prevCount = prev.messages?.length || 0;
        const newCount = mergedMessages.length;
        if (newCount > prevCount) {
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 150);
        }
        prevMessagesCountRef.current = newCount;
        return {
          ...data,
          messages: mergedMessages,
        };
      });
    } catch (err: any) {
      // Server từ chối (scope=reporter): chuyển sang màn "không có quyền" thay vì alert.
      if (err?.status === 403 || err?.code === 'TKT_ACCESS_DENIED') {
        setAccessDenied(true);
      } else if (!silent) {
        const localizedMsg = getLocalizedTicketErrorMessage(err, t);
        setNotice({ tone: 'error', title: t('common.error', 'Lỗi'), message: localizedMsg });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [ticketId, navigation, t]);

  useEffect(() => {
    fetchDetail(false);
    fetchEscalation();
  }, [fetchDetail, fetchEscalation]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchDetail(true), fetchEscalation()]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchDetail, fetchEscalation]);

  // Tự động tải lại khi ứng dụng quay trở lại từ background (foreground active)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && !accessDenied && ticket && ticket.status !== 'CLOSED') {
        fetchDetail(true);
        if (ticket.status === 'RESOLVED') fetchEscalation();
      }
    };
    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [accessDenied, ticket?.status, fetchDetail, fetchEscalation]);

  const handleEscalateSubmit = async (reason: string) => {
    setIsSubmittingEscalation(true);
    try {
      await requestTicketEscalation(ticketId, reason);
      setIsEscalateModalVisible(false);
      await Promise.all([fetchDetail(true), fetchEscalation()]);
      setNotice({
        tone: 'success',
        title: t('ticket.escalation.modal.successTitle', 'Đã gửi khiếu nại'),
        message: t('ticket.escalation.modal.success', 'Đã gửi yêu cầu Admin xem xét thành công!'),
      });
    } catch (err: any) {
      const localizedMsg = getLocalizedTicketErrorMessage(err, t);
      setNotice({ tone: 'error', title: t('common.error', 'Lỗi'), message: localizedMsg });
    } finally {
      setIsSubmittingEscalation(false);
    }
  };

  /** Xác nhận đóng phiếu: RESOLVED → CLOSED (gọi từ ConfirmSheet, không dùng Alert). */
  const handleConfirmResolved = async () => {
    if (!ticket || isConfirming) return;
    setIsConfirming(true);
    try {
      const updated = await confirmTicketClosed(ticketId, ticket.version ?? 0);
      setTicket(updated);
      setConfirmVisible(false);
      await Promise.all([fetchDetail(true), fetchEscalation()]);
      setNotice({
        tone: 'success',
        title: t('ticket.confirm.successTitle', 'Cảm ơn bạn!'),
        message: t(
          'ticket.confirm.successMessage',
          'Phiếu hỗ trợ đã được đóng. Chúng tôi rất vui khi sự cố đã được giải quyết.'
        ),
      });
    } catch (err: any) {
      const localizedMsg = getLocalizedTicketErrorMessage(err, t);
      setConfirmVisible(false);
      if (localizedMsg.includes('version') || localizedMsg.includes('thay đổi')) {
        // Version conflict: refresh and retry
        await fetchDetail(true);
        setNotice({
          tone: 'warning',
          title: t('ticket.errors.versionConflict', 'Dữ liệu đã thay đổi'),
          message: t('ticket.confirm.retryMessage', 'Phiếu vừa được cập nhật, vui lòng thử xác nhận lại.'),
        });
      } else {
        setNotice({ tone: 'error', title: t('common.error', 'Lỗi'), message: localizedMsg });
      }
    } finally {
      setIsConfirming(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || sending || ticket?.status === 'RESOLVED') return;

    const messageContent = replyText.trim();
    const tempId = `temp-${Date.now()}`;
    const isReporter = profile?.id != null && ticket?.reporterId === profile.id;
    const optimisticMsg: TicketMessage = {
      messageId: tempId,
      authorId: profile?.id,
      authorDisplayName: profile?.displayName || t('ticket.author.you', 'Bạn'),
      authorKind: isReporter ? 'REPORTER' : 'STAFF',
      body: messageContent,
      createdAt: new Date().toISOString(),
    };

    // 1. Optimistic update: clear input and show message bubble immediately
    setReplyText('');
    setTicket(prev =>
      prev
        ? {
            ...prev,
            messages: [...(prev.messages || []), optimisticMsg],
          }
        : prev
    );

    // Scroll to bottom immediately
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);

    setSending(true);

    try {
      const serverMsg = await replyTicket(ticketId, messageContent, tempId);

      // 2. Replace optimistic message with server message
      setTicket(prev => {
        if (!prev) return prev;
        const updatedMessages = (prev.messages || []).map(m => {
          if (m.messageId !== tempId) return m;
          const settled = serverMsg || m;
          // Mock mode chưa trả authorId — giữ authorId của bản optimistic để
          // bong bóng không bị nhảy sang phía "của người khác".
          return { ...settled, authorId: settled.authorId ?? m.authorId };
        });
        return { ...prev, messages: updatedMessages };
      });

      // 3. Silently sync ticket details (version, status, etc.) without reloading page/spinner!
      await fetchDetail(true);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err: any) {
      // Rollback optimistic message & restore draft text so user does not lose their typed message
      setTicket(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: (prev.messages || []).filter(m => m.messageId !== tempId),
        };
      });
      setReplyText(messageContent);

      const localizedMsg = getLocalizedTicketErrorMessage(err, t);
      setNotice({
        tone: 'error',
        title: t('ticket.detail.sendError', 'Không thể gửi'),
        message: localizedMsg,
      });
    } finally {
      setSending(false);
    }
  };

  const handleContinueTicket = async (reason: string) => {
    if (!ticket || ticket.status !== 'RESOLVED' || isContinuing) return;
    setIsContinuing(true);
    try {
      const updated = await continueTicket(ticketId, ticket.version ?? 0, reason);
      setTicket(updated);
      setIsContinueModalVisible(false);
      await Promise.all([fetchDetail(true), fetchEscalation()]);
    } catch (err: any) {
      const localizedMsg = getLocalizedTicketErrorMessage(err, t);
      await fetchDetail(true);
      setNotice({ tone: 'error', title: t('common.error', 'Lỗi'), message: localizedMsg });
    } finally {
      setIsContinuing(false);
    }
  };

  /**
   * Đóng thông báo. Nếu màn hình đang kẹt ở trạng thái spinner (tải chi tiết
   * thất bại, chưa có ticket) thì quay lại thay vì để người dùng không lối thoát.
   */
  const closeNotice = () => {
    setNotice(null);
    if (!ticket && !loading && !accessDenied) navigation.goBack();
  };

  // Hộp thoại dùng chung cho mọi nhánh return của màn hình.
  const sheets = (
    <>
      <ConfirmSheet
        visible={confirmVisible}
        mode="confirm"
        tone="success"
        title={t('ticket.confirm.title', 'Xác nhận giải quyết')}
        message={t(
          'ticket.confirm.message',
          'Bạn xác nhận sự cố đã được xử lý hoàn tất? Phiếu hỗ trợ sẽ được đóng sau khi bạn xác nhận.'
        )}
        confirmLabel={t('ticket.confirm.confirmBtn', 'Đồng ý, đã giải quyết')}
        cancelLabel={t('common.cancel', 'Hủy')}
        loading={isConfirming}
        onConfirm={handleConfirmResolved}
        onClose={() => setConfirmVisible(false)}
      />
      <ConfirmSheet
        visible={notice !== null}
        mode="notice"
        tone={notice?.tone ?? 'neutral'}
        title={notice?.title ?? ''}
        message={notice?.message}
        confirmLabel={t('common.close', 'Đóng')}
        onClose={closeNotice}
      />
    </>
  );

  // Không gian Driver ("Phiếu tôi đã báo"): chỉ mở được ticket do chính mình báo cáo.
  // - accessDenied: server trả 403 với scope=reporter (deep link / quyền Owner "rò" sang).
  // - ownsTicket: kiểm tra phía client (mock mode dùng reporterId giả nên bỏ qua).
  const accessDeniedView = (
    <SafeAreaView
      style={[styles.centerRoot, { backgroundColor: themeColors.surfaceAlt }]}
      edges={['top', 'bottom']}
    >
      <View style={[styles.accessIconCircle, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
        <Ionicons name="lock-closed-outline" size={40} color={themeColors.textMuted} />
      </View>
      <Text style={[styles.accessTitle, { color: themeColors.textStrong }]}>
        {t('ticket.detail.notReporterTitle', 'Không có quyền trong không gian Driver')}
      </Text>
      <Text style={[styles.accessBody, { color: themeColors.textMuted }]}>
        {t(
          'ticket.detail.notReporterBody',
          'Phiếu này không do bạn báo cáo. Vui lòng mở từ không gian Chủ trạm (Owner Console) để xem và phản hồi.'
        )}
      </Text>
      <View style={{ marginTop: spacing.md, width: '70%' }}>
        <AppButton
          label={t('common.back', 'Quay lại')}
          variant="secondary"
          onPress={() => navigation.goBack()}
        />
      </View>
      {sheets}
    </SafeAreaView>
  );

  if (accessDenied) {
    return accessDeniedView;
  }

  if (loading || !ticket || profileStatus === 'loading' || profileStatus === 'idle') {
    return (
      <SafeAreaView style={[styles.centerRoot, { backgroundColor: themeColors.surfaceAlt }]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
        <Text style={[styles.loadingText, { color: themeColors.textMuted }]}>
          {t('ticket.list.loading', 'Đang tải thông tin trao đổi...')}
        </Text>
        {sheets}
      </SafeAreaView>
    );
  }

  const ownsTicket =
    isMockMode() || !ticket.reporterId || !profile?.id || ticket.reporterId === profile.id;

  if (!ownsTicket) {
    return accessDeniedView;
  }

  const statusMeta = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.OPEN;
  const statusLabel = t(`ticket.status.${ticket.status}`, statusMeta.label);
  const isClosed = ticket.status === 'CLOSED';
  const isResolved = ticket.status === 'RESOLVED';
  const hasRefund = ticket.refundIds && ticket.refundIds.length > 0;
  const hasFinding = ticket.findings && ticket.findings.length > 0;
  const isReporterConfirmed = isClosed && ticket.closeReason === 'REPORTER_CONFIRMED';
  const isAutoClosedNoResponse = isClosed && ticket.closeReason === 'AUTO_CLOSED_NO_RESPONSE';
  // Nếu chưa có closeReason nhưng đã CLOSED thì hiển thị generic
  const isClosedGeneric = isClosed && !isReporterConfirmed && !isAutoClosedNoResponse;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: themeColors.surfaceAlt }]} edges={['top', 'bottom']}>
      {/* Universal Sub-Screen Clean Navigation Header */}
      <View style={[styles.header, { borderBottomColor: themeColors.border, backgroundColor: themeColors.surface }]}>
        <AppBackButton onPress={() => navigation.goBack()} />

        <View style={styles.headerTitleBlock}>
          <Text style={[styles.headerTitle, { color: themeColors.textStrong }]} numberOfLines={1}>
            {ticket.ticketCode || (ticket.ticketId ? `TKT-${String(ticket.ticketId).slice(0, 8).toUpperCase()}` : t('ticket.detail.titleFallback', 'Phiếu hỗ trợ'))}
          </Text>
          <Text style={[styles.headerSubtitle, { color: themeColors.textMuted }]} numberOfLines={1}>
            {ticket.subject || t('ticket.detail.subjectFallback', 'Chi tiết sự cố')}
          </Text>
        </View>

        <View style={styles.headerRightAction}>
          {isClosed || isResolved ? (
            <StatusBadge variant={statusMeta.variant} label={statusLabel} dot />
          ) : ticket.isEscalated || (escalation && !escalation.resolvedAt) ? (
            <StatusBadge variant="info" label={t('ticket.escalation.escalatedBadge', 'Đang được Admin xem xét')} dot />
          ) : (
            <StatusBadge variant={statusMeta.variant} label={statusLabel} dot />
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={ticket.messages}
          keyExtractor={(item, index) => item.messageId || String(index)}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[themeColors.primary]}
              tintColor={themeColors.primary}
            />
          }
          ListHeaderComponent={
            <View style={styles.headerComponent}>
              {/* Meta Card */}
              <View
                style={[
                  styles.metaCard,
                  { backgroundColor: themeColors.surface, borderColor: themeColors.border },
                ]}
              >
                <Text style={[styles.metaSubject, { color: themeColors.textStrong }]}>
                  {ticket.subject || ticket.ticketCode || t('ticket.detail.titleFallback', 'Phiếu hỗ trợ')}
                </Text>
                <View style={styles.metaRow}>
                  <Ionicons name="time-outline" size={15} color={themeColors.textMuted} />
                  <Text style={[styles.metaTime, { color: themeColors.textMuted }]}>
                    {t('ticket.detail.createdAt', { time: formatDateTime(ticket.createdAt) })}
                  </Text>
                </View>
                {ticket.bookingId && (
                  <View style={styles.metaRow}>
                    <Ionicons name="receipt-outline" size={15} color="#3B82F6" />
                    <Text style={[styles.metaTime, { color: '#3B82F6' }]}>
                      {t('ticket.card.bookingLabel', 'Liên quan đơn sạc:')} {ticket.bookingId}
                    </Text>
                  </View>
                )}
              </View>

              {/* Technical Finding Card — shows audit conclusion independently of any refund */}
              {hasFinding && (
                <View
                  style={[
                    styles.resolutionCard,
                    {
                      backgroundColor: isDark ? '#0f1f2d' : '#EFF6FF',
                      borderColor: isDark ? '#1e3a5f' : '#BFDBFE',
                    },
                  ]}
                >
                  <View style={styles.resolutionHeader}>
                    <Ionicons name="document-text-outline" size={20} color="#3B82F6" />
                    <Text style={[styles.resolutionTitle, { color: isDark ? '#60A5FA' : '#1D4ED8' }]}>
                      {t('ticket.detail.findingsTitle', 'Kết luận kỹ thuật')}
                    </Text>
                  </View>
                  {ticket.findings.map((f, i) => {
                    const conclusionText = t(
                      `ticket.conclusion.${f.conclusion}`,
                      CONCLUSION_CONFIG[f.conclusion] || f.conclusion
                    );
                    return (
                      <Text key={f.findingId || i} style={[styles.resolutionBody, { color: themeColors.textBody }]}>
                        • {f.reason ? `${conclusionText} — ${f.reason}` : conclusionText}
                      </Text>
                    );
                  })}
                </View>
              )}

              {/* Refund Note — booking-level, neutral wording: does NOT imply station fault */}
              {hasRefund && (
                <View
                  style={[
                    styles.resolutionCard,
                    {
                      backgroundColor: isDark ? '#113322' : '#ECFDF5',
                      borderColor: isDark ? '#1F5C3B' : '#A7F3D0',
                    },
                  ]}
                >
                  <View style={styles.resolutionHeader}>
                    <Ionicons name="cash-outline" size={20} color="#10B981" />
                    <Text style={[styles.resolutionTitle, { color: '#059669' }]}>
                      {t('ticket.detail.refundAppliedTitle', 'Hoàn tiền đơn sạc')}
                    </Text>
                  </View>
                  <Text style={[styles.resolutionBody, { color: themeColors.textBody }]}>
                    {t(
                      'ticket.detail.refundAppliedBody',
                      'Khoản hoàn tiền liên quan đến phiếu này đã được ghi nhận theo chính sách đặt chỗ. Vui lòng kiểm tra mục Lịch sử đặt chỗ để biết chi tiết.'
                    )}
                  </Text>
                </View>
              )}

              {/* RESOLVED — Awaiting Driver Confirmation (Double-Bezel card) */}
              {isResolved && (
                <ResolvedResolutionCard
                  confirming={isConfirming}
                  onConfirm={() => setConfirmVisible(true)}
                  onContinue={() => setIsContinueModalVisible(true)}
                />
              )}

              {/* CLOSED — Reporter Confirmed */}
              {isReporterConfirmed && (
                <View
                  style={[
                    styles.closedBanner,
                    {
                      backgroundColor: isDark ? '#0a1f1a' : '#F0FDF4',
                      borderColor: isDark ? '#14532d' : '#BBF7D0',
                    },
                  ]}
                >
                  <Ionicons name="shield-checkmark" size={20} color="#16A34A" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.closedBannerTitle, { color: isDark ? '#4ade80' : '#15803D' }]}>
                      {t('ticket.closed.confirmedTitle', 'Bạn đã xác nhận giải quyết')}
                    </Text>
                    <Text style={[styles.closedBannerBody, { color: themeColors.textMuted }]}>
                      {t('ticket.closed.confirmedBody', 'Cảm ơn bạn đã phản hồi. Phiếu hỗ trợ đã được đóng và lưu trữ vào lịch sử.')}
                    </Text>
                  </View>
                </View>
              )}

              {/* CLOSED — Auto-closed after no response */}
              {isAutoClosedNoResponse && (
                <View
                  style={[
                    styles.closedBanner,
                    {
                      backgroundColor: isDark ? '#1c1a10' : '#FEFCE8',
                      borderColor: isDark ? '#44390a' : '#FDE68A',
                    },
                  ]}
                >
                  <Ionicons name="time-outline" size={20} color="#CA8A04" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.closedBannerTitle, { color: isDark ? '#facc15' : '#92400E' }]}>
                      {t('ticket.closed.autoClosedTitle', 'Phiếu tự đóng sau khi hết hạn')}
                    </Text>
                    <Text style={[styles.closedBannerBody, { color: themeColors.textMuted }]}>
                      {t(
                        'ticket.closed.autoClosedBody',
                        'Không có phản hồi trong thời gian quy định. Hệ thống đã tự đóng phiếu. Nếu vấn đề chưa được giải quyết, vui lòng tạo phiếu mới.'
                      )}
                    </Text>
                  </View>
                </View>
              )}

              {/* CLOSED — Generic fallback (no closeReason) */}
              {isClosedGeneric && (
                <View
                  style={[
                    styles.closedBanner,
                    {
                      backgroundColor: isDark ? '#18181b' : '#F4F4F5',
                      borderColor: isDark ? '#3f3f46' : '#D4D4D8',
                    },
                  ]}
                >
                  <Ionicons name="lock-closed-outline" size={20} color={themeColors.textMuted} />
                  <Text style={[styles.closedBannerBody, { color: themeColors.textMuted }]}>
                    {t('ticket.closed.genericBody', 'Phiếu hỗ trợ này đã hoàn tất và được đóng.')}
                  </Text>
                </View>
              )}

              {/* Dispute Escalation & 24h SLA Countdown Card */}
              {(ticket.escalation || escalation)?.resolvedAt && (
                <View style={[styles.resolvedInputNotice, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
                  <Text style={{ color: themeColors.textStrong, fontWeight: '700' }}>
                    {(ticket.escalation || escalation)?.resolutionType === 'RETURN_TO_STATION'
                      ? 'Admin đã trả lại trạm để tiếp tục xử lý'
                      : 'Admin đã kết thúc quy trình hỗ trợ'}
                  </Text>
                  <Text style={{ color: themeColors.textMuted }}>
                    {(ticket.escalation || escalation)?.resolutionNote || ''}
                  </Text>
                </View>
              )}
              <TicketDisputeEscalationCard
                ticket={ticket}
                escalation={ticket.escalation || escalation}
                onOpenEscalate={isResolved ? undefined : () => setIsEscalateModalVisible(true)}
              />

              <View style={styles.streamDivider}>
                <View style={[styles.dividerLine, { backgroundColor: themeColors.border }]} />
                <Text style={[styles.streamLabel, { color: themeColors.textMuted }]}>
                  {t('ticket.detail.supportSubtitle', 'Dòng trao đổi trực tiếp')}
                </Text>
                <View style={[styles.dividerLine, { backgroundColor: themeColors.border }]} />
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <TicketMessageBubble
              message={item}
              isSelf={Boolean(item.authorId) && item.authorId === profile?.id}
            />
          )}
        />

        {/* Sticky Chat Input Bar */}
        {isClosed ? (
          <View
            style={[
              styles.closedBar,
              { backgroundColor: themeColors.surface, borderTopColor: themeColors.border },
            ]}
          >
            <Ionicons name="lock-closed-outline" size={18} color={themeColors.textMuted} />
            <Text style={[styles.closedText, { color: themeColors.textMuted }]}>
              {t('ticket.detail.closedNotice', 'Phiếu hỗ trợ này đã hoàn tất và đóng. Nếu cần hỗ trợ thêm, bạn có thể tạo phiếu mới.')}
            </Text>
          </View>
        ) : isResolved ? (
          <View style={[styles.resolvedInputNotice, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
            <Text style={{ color: themeColors.textMuted, textAlign: 'center' }}>
              {t('ticket.continue.inputNotice', 'Chọn “Vấn đề vẫn còn” ở phía trên để mở lại phiếu và mô tả sự cố.')}
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.inputBar,
              { backgroundColor: themeColors.surface, borderTopColor: themeColors.border },
            ]}
          >
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: themeColors.surfaceAlt,
                  color: themeColors.textStrong,
                  borderColor: themeColors.border,
                },
              ]}
              placeholder={t('ticket.detail.inputPlaceholder', 'Nhập nội dung phản hồi...')}
              placeholderTextColor={themeColors.textMuted}
              value={replyText}
              onChangeText={setReplyText}
              multiline
              maxLength={2000}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('ticket.detail.sendA11y', 'Gửi phản hồi')}
              style={[
                styles.sendButton,
                {
                  backgroundColor: replyText.trim() || sending ? themeColors.primary : themeColors.surfaceAlt,
                },
              ]}
              disabled={!replyText.trim() || sending}
              onPress={handleSendReply}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons
                  name="send"
                  size={20}
                  color={replyText.trim() ? '#FFFFFF' : themeColors.textMuted}
                />
              )}
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>

      <DriverEscalateModal
        visible={isEscalateModalVisible}
        ticket={ticket}
        onClose={() => setIsEscalateModalVisible(false)}
        onSubmit={handleEscalateSubmit}
        isSubmitting={isSubmittingEscalation}
      />
      <DriverContinueTicketModal
        visible={isContinueModalVisible}
        submitting={isContinuing}
        onClose={() => setIsContinueModalVisible(false)}
        onSubmit={handleContinueTicket}
      />
      {sheets}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centerRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: 14,
  },
  accessIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  accessTitle: {
    fontSize: 17,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  accessBody: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
  },
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
    fontSize: 18,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
    maxWidth: 240,
    textAlign: 'center',
  },
  headerRightAction: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 40,
  },
  keyboardView: { flex: 1 },
  messagesList: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerComponent: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metaCard: {
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 8,
  },
  metaSubject: {
    fontSize: 16.5,
    fontWeight: fontWeights.bold,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaTime: {
    fontSize: 13.5,
    fontWeight: fontWeights.medium,
  },
  resolutionCard: {
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 8,
  },
  resolutionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resolutionTitle: {
    fontSize: 15,
    fontWeight: fontWeights.bold,
  },
  resolutionBody: {
    fontSize: 14,
    lineHeight: 21,
  },
  refundTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#A7F3D0',
  },
  refundTagText: {
    fontSize: 14,
    fontWeight: fontWeights.bold,
  },
  streamDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  streamLabel: {
    fontSize: 12.5,
    fontWeight: fontWeights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15.5,
    lineHeight: 21,
    minHeight: 46,
    maxHeight: 120,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  closedText: {
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
  },
  resolvedInputNotice: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  closedBannerTitle: {
    fontSize: 14,
    fontWeight: fontWeights.bold,
    marginBottom: 2,
  },
  closedBannerBody: {
    fontSize: 13,
    lineHeight: 18,
  },
});
