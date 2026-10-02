import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBackButton } from '@/components/AppBackButton';
import { StatusBadge } from '@/components/StatusBadge';
import {
  DriverEscalateModal,
  TicketDisputeEscalationCard,
  TicketMessageBubble,
} from '@/components/ticket';
import { usePreferences } from '@/context/PreferencesContext';
import type { RootStackParamList } from '@/navigation/types';
import {
  getLocalizedTicketErrorMessage,
  getTicketDetail,
  getTicketEscalation,
  replyTicket,
  requestTicketEscalation,
  confirmTicketClosed,
} from '@/services/ticketService';
import { formatDateTime } from '@/utils/format';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { Ticket, TicketEscalation, TicketStatus } from '@/types';

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
  HARDWARE_FAULT: 'Sự cố thiết bị trạm sạc',
  SOFTWARE_FAULT: 'Sự cố phần mềm kết nối',
  USER_ERROR: 'Thao tác chưa phù hợp',
  GRID_FAILURE: 'Mất nguồn điện lưới',
  NO_FAULT_FOUND: 'Trạm hoạt động bình thường',
  OTHER: 'Nguyên nhân khác',
};

export function TicketDetailScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { themeColors, isDark } = usePreferences();
  const { ticketId } = route.params;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const [escalation, setEscalation] = useState<TicketEscalation | null>(null);
  const [isEscalateModalVisible, setIsEscalateModalVisible] = useState(false);
  const [isSubmittingEscalation, setIsSubmittingEscalation] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

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
        const prevCount = prev.messages?.length || 0;
        const newCount = data.messages?.length || 0;
        if (newCount > prevCount) {
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 150);
        }
        prevMessagesCountRef.current = newCount;
        return data;
      });
    } catch (err: any) {
      if (!silent) {
        const localizedMsg = getLocalizedTicketErrorMessage(err, t);
        Alert.alert(t('common.error', 'Lỗi'), localizedMsg, [
          { text: t('common.back', 'Quay lại'), onPress: () => navigation.goBack() },
        ]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [ticketId, navigation, t]);

  useEffect(() => {
    fetchDetail(false);
    fetchEscalation();
  }, [fetchDetail, fetchEscalation]);

  // Live polling: poll khi ticket chưa đóng (bao gồm RESOLVED để cập nhật phiếu khi chờ xác nhận)
  useEffect(() => {
    if (!ticket || ticket.status === 'CLOSED') return;

    const interval = ticket.status === 'RESOLVED' ? 5000 : 3500;
    const timer = setInterval(() => {
      fetchDetail(true);
      if (ticket.status === 'RESOLVED') fetchEscalation();
    }, interval);

    return () => clearInterval(timer);
  }, [ticket?.status, fetchDetail, fetchEscalation]);

  const handleEscalateSubmit = async (reason: string) => {
    setIsSubmittingEscalation(true);
    try {
      await requestTicketEscalation(ticketId, reason);
      Alert.alert(
        t('ticket.escalation.modal.successTitle', 'Đã gửi khiếu nại'),
        t('ticket.escalation.modal.success', 'Đã gửi yêu cầu phân xử lên Admin thành công!'),
      );
      setIsEscalateModalVisible(false);
      await Promise.all([fetchDetail(true), fetchEscalation()]);
    } catch (err: any) {
      const localizedMsg = getLocalizedTicketErrorMessage(err, t);
      Alert.alert(t('common.error', 'Lỗi'), localizedMsg);
    } finally {
      setIsSubmittingEscalation(false);
    }
  };

  const handleConfirmResolved = () => {
    Alert.alert(
      t('ticket.confirm.title', 'Xác nhận giải quyết'),
      t(
        'ticket.confirm.message',
        'Bạn xác nhận sự cố đã được xử lý hoàn tất? Phiếu hỗ trợ sẽ được đóng sau khi bạn xác nhận.'
      ),
      [
        { text: t('common.cancel', 'Hủy'), style: 'cancel' },
        {
          text: t('ticket.confirm.confirmBtn', 'Đồng ý, đã giải quyết'),
          style: 'default',
          onPress: async () => {
            if (!ticket || isConfirming) return;
            setIsConfirming(true);
            try {
              const updated = await confirmTicketClosed(ticketId, ticket.version ?? 0);
              setTicket(updated);
              Alert.alert(
                t('ticket.confirm.successTitle', 'Cảm ơn bạn!'),
                t('ticket.confirm.successMessage', 'Phếu hỗ trợ đã được đóng. Chúng tôi rất vui khi sự cố đã được giải quyết.'),
              );
            } catch (err: any) {
              const localizedMsg = getLocalizedTicketErrorMessage(err, t);
              if (localizedMsg.includes('version') || localizedMsg.includes('thay đổi')) {
                // Version conflict: refresh and retry
                await fetchDetail(true);
                Alert.alert(
                  t('ticket.errors.versionConflict', 'Dữ liệu đã thay đổi'),
                  t('ticket.confirm.retryMessage', 'Phiếu vừa được cập nhật, vui lòng thử xác nhận lại.'),
                );
              } else {
                Alert.alert(t('common.error', 'Lỗi'), localizedMsg);
              }
            } finally {
              setIsConfirming(false);
            }
          },
        },
      ]
    );
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || sending) return;

    const messageContent = replyText.trim();
    setReplyText('');
    setSending(true);

    try {
      await replyTicket(ticketId, messageContent);
      await fetchDetail();
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err: any) {
      const localizedMsg = getLocalizedTicketErrorMessage(err, t);
      Alert.alert(t('ticket.detail.sendError', 'Không thể gửi'), localizedMsg);
    } finally {
      setSending(false);
    }
  };

  if (loading || !ticket) {
    return (
      <SafeAreaView style={[styles.centerRoot, { backgroundColor: themeColors.surfaceAlt }]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
        <Text style={[styles.loadingText, { color: themeColors.textMuted }]}>
          {t('ticket.list.loading', 'Đang tải thông tin trao đổi...')}
        </Text>
      </SafeAreaView>
    );
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
          {ticket.isEscalated || ticket.escalation || escalation ? (
            <StatusBadge variant="info" label={t('ticket.escalation.escalatedBadge', 'Đang phân xử')} dot />
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

              {/* Technical Finding & Refund Announcement Banner */}
              {(hasFinding || hasRefund) && (
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
                    <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                    <Text style={[styles.resolutionTitle, { color: '#059669' }]}>
                      {t('ticket.detail.findingsTitle', 'Kết luận Kỹ thuật & Quyền lợi hoàn phí')}
                    </Text>
                  </View>
                  {ticket.findings.map((f, i) => {
                    const conclusionText = t(
                      `ticket.conclusion.${f.conclusion}`,
                      CONCLUSION_CONFIG[f.conclusion] || f.conclusion
                    );
                    return (
                      <Text key={f.findingId || i} style={[styles.resolutionBody, { color: themeColors.textBody }]}>
                        • {f.reason ? `${f.reason} (${conclusionText})` : conclusionText}
                      </Text>
                    );
                  })}
                  {hasRefund && (
                    <View style={styles.refundTag}>
                      <Ionicons name="cash-outline" size={16} color="#10B981" />
                      <Text style={[styles.refundTagText, { color: '#10B981' }]}>
                        {t('ticket.card.refundNote', 'Trạm đã xác nhận lỗi — Đã duyệt hoàn tiền 100%')}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* RESOLVED — Awaiting Driver Confirmation Banner */}
              {isResolved && (
                <View
                  style={[
                    styles.resolvedBanner,
                    {
                      backgroundColor: isDark ? '#0f2a1a' : '#F0FDF4',
                      borderColor: isDark ? '#1a5c30' : '#86EFAC',
                    },
                  ]}
                >
                  <View style={styles.resolvedBannerHeader}>
                    <Ionicons name="checkmark-circle" size={22} color="#22C55E" />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.resolvedBannerTitle, { color: isDark ? '#4ade80' : '#15803D' }]}>
                        {t('ticket.resolved.bannerTitle', 'Sự cố đã được xử lý')}
                      </Text>
                      <Text style={[styles.resolvedBannerBody, { color: themeColors.textMuted }]}>
                        {t(
                          'ticket.resolved.bannerBody',
                          'Nhân viên kỹ thuật đã báo cáo xử lý xong. Vui lòng xác nhận để đóng phiếu, hoặc phiếu sẽ tự đóng sau khi hết hạn phản hồi.'
                        )}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={handleConfirmResolved}
                    disabled={isConfirming}
                    style={[styles.confirmBtn, isConfirming && { opacity: 0.6 }]}
                  >
                    <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                    <Text style={styles.confirmBtnText}>
                      {isConfirming
                        ? t('ticket.confirm.confirming', 'Đang xác nhận...')
                        : t('ticket.confirm.confirmBtn', 'Đồng ý, đã giải quyết')}
                    </Text>
                  </Pressable>
                </View>
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
              <TicketDisputeEscalationCard
                ticket={ticket}
                escalation={ticket.escalation || escalation}
                onOpenEscalate={() => setIsEscalateModalVisible(true)}
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
              isSelf={item.authorKind === 'REPORTER'}
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
                  backgroundColor: replyText.trim() ? themeColors.primary : themeColors.surfaceAlt,
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
  resolvedBanner: {
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1.5,
    gap: 12,
  },
  resolvedBannerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  resolvedBannerTitle: {
    fontSize: 15,
    fontWeight: fontWeights.bold,
    marginBottom: 3,
  },
  resolvedBannerBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16A34A',
    borderRadius: radius.sm,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.2,
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
