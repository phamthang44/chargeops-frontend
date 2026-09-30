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
import { GlassButton } from '@/components/GlassButton';
import { StatusBadge } from '@/components/StatusBadge';
import { TicketMessageBubble } from '@/components/ticket/TicketMessageBubble';
import { usePreferences } from '@/context/PreferencesContext';
import type { RootStackParamList } from '@/navigation/types';
import { getTicketDetail, replyTicket } from '@/services/ticketService';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { Ticket, TicketStatus } from '@/types';

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

  const flatListRef = useRef<FlatList>(null);

  const fetchDetail = useCallback(async () => {
    try {
      const data = await getTicketDetail(ticketId);
      setTicket(data);
    } catch (err: any) {
      Alert.alert(t('common.error', 'Lỗi'), err.message || t('ticket.detail.title', 'Không thể tải thông tin phiếu hỗ trợ'), [
        { text: t('common.back', 'Quay lại'), onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
    }
  }, [ticketId, navigation, t]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

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
      Alert.alert(t('ticket.detail.sendError', 'Không thể gửi'), err.message || t('common.networkError', 'Lỗi mạng khi gửi phản hồi'));
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
  const hasRefund = ticket.refundIds && ticket.refundIds.length > 0;
  const hasFinding = ticket.findings && ticket.findings.length > 0;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: themeColors.surfaceAlt }]} edges={['top', 'bottom']}>
      {/* Universal Sub-Screen Clean Navigation Header */}
      <View style={[styles.header, { borderBottomColor: themeColors.border, backgroundColor: themeColors.surface }]}>
        <AppBackButton onPress={() => navigation.goBack()} />

        <View style={styles.headerTitleBlock}>
          <Text style={[styles.headerTitle, { color: themeColors.textStrong }]} numberOfLines={1}>
            {ticket.ticketCode}
          </Text>
          <Text style={[styles.headerSubtitle, { color: themeColors.textMuted }]} numberOfLines={1}>
            {ticket.subject}
          </Text>
        </View>

        <View style={styles.headerRightAction}>
          <StatusBadge variant={statusMeta.variant} label={statusLabel} dot />
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
                  {ticket.subject}
                </Text>
                <View style={styles.metaRow}>
                  <Ionicons name="time-outline" size={13} color={themeColors.textMuted} />
                  <Text style={[styles.metaTime, { color: themeColors.textMuted }]}>
                    {t('ticket.detail.createdAt', { time: new Date(ticket.createdAt).toLocaleString() })}
                  </Text>
                </View>
                {ticket.bookingId && (
                  <View style={styles.metaRow}>
                    <Ionicons name="receipt-outline" size={13} color="#3B82F6" />
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
                    <Ionicons name="shield-checkmark" size={18} color="#10B981" />
                    <Text style={[styles.resolutionTitle, { color: '#059669' }]}>
                      {t('ticket.detail.findingsTitle', 'Kết luận Kỹ thuật & Quyền lợi hoàn phí')}
                    </Text>
                  </View>
                  {ticket.findings.map((f, i) => (
                    <Text key={f.findingId || i} style={[styles.resolutionBody, { color: themeColors.textBody }]}>
                      • {f.reason} ({f.conclusion})
                    </Text>
                  ))}
                  {hasRefund && (
                    <View style={styles.refundTag}>
                      <Ionicons name="cash-outline" size={14} color="#10B981" />
                      <Text style={[styles.refundTagText, { color: '#10B981' }]}>
                        {t('ticket.card.refundNote', 'Khoản thanh toán được duyệt HOÀN 100% vào tài khoản của bạn.')}
                      </Text>
                    </View>
                  )}
                </View>
              )}

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
            <Ionicons name="lock-closed-outline" size={16} color={themeColors.textMuted} />
            <Text style={[styles.closedText, { color: themeColors.textMuted }]}>
              {t('ticket.detail.closedNotice', 'Phiếu hỗ trợ này đã hoàn tất đóng. Cần hỗ trợ thêm vui lòng tạo phiếu mới.')}
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
                  size={18}
                  color={replyText.trim() ? '#FFFFFF' : themeColors.textMuted}
                />
              )}
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
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
  loadingText: { fontSize: fontSizes.caption },
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
    fontSize: fontSizes.heading - 1,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: fontSizes.caption - 1,
    marginTop: 2,
    maxWidth: 220,
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
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 6,
  },
  metaSubject: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaTime: {
    fontSize: fontSizes.caption - 1,
  },
  resolutionCard: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 6,
  },
  resolutionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resolutionTitle: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
  },
  resolutionBody: {
    fontSize: fontSizes.caption,
    lineHeight: 18,
  },
  refundTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#A7F3D0',
  },
  refundTagText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
  },
  streamDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  streamLabel: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.sm,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: fontSizes.body,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  closedText: {
    fontSize: fontSizes.caption,
    textAlign: 'center',
  },
});
