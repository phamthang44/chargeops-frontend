import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
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
import { createTicket } from '@/services/ticketService';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { TicketCategory, TicketPriority } from '@/types';

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

  const handleSubmit = async () => {
    if (!subject.trim()) {
      Alert.alert(
        t('ticket.create.errorNoSubjectTitle', 'Chưa nhập tiêu đề'),
        t('ticket.create.errorNoSubjectBody', 'Vui lòng nhập tóm tắt sự cố')
      );
      return;
    }
    if (!description.trim()) {
      Alert.alert(
        t('ticket.create.errorNoDescTitle', 'Chưa nhập mô tả'),
        t('ticket.create.errorNoDescBody', 'Vui lòng mô tả chi tiết vấn đề bạn gặp phải')
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
        bookingId: bookingId ?? null,
        stationId: stationId ?? null,
      });

      // Điều hướng ngay sang màn hình chi tiết trao đổi
      navigation.replace('TicketDetail', { ticketId: created.ticketId });
    } catch (err: any) {
      Alert.alert(t('common.error', 'Lỗi'), err.message || t('ticket.create.errorFailed', 'Không thể tạo phiếu hỗ trợ'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: themeColors.surfaceAlt }]} edges={['top', 'bottom']}>
      {/* Universal Sub-Screen Clean Navigation Header */}
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
          {/* Linked Booking context banner (nếu có) */}
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
                <Ionicons name="link-outline" size={18} color="#3B82F6" />
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
                {t('ticket.create.bookingCodeLabel', 'Mã đơn:')} {bookingId}
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
                    <Ionicons name={cat.icon} size={20} color={isSelected ? cat.color : themeColors.textMuted} />
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
              placeholder={t('ticket.create.subjectPlaceholder', 'Ví dụ: Súng sạc trụ 02 tự ngắt...')}
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
              placeholder={t('ticket.create.descPlaceholder', 'Mô tả cụ thể thời điểm, mã trụ/súng...')}
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
            label={submitting ? t('ticket.create.submitting', 'Đang gửi...') : t('ticket.create.submitBtn', 'Gửi phiếu hỗ trợ sự cố')}
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
    fontSize: fontSizes.heading,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 10,
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
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 4,
  },
  contextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contextTitle: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
  },
  contextText: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  contextSub: {
    fontSize: fontSizes.caption - 1,
    fontFamily: 'monospace',
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSizes.body,
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
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  categoryItemLabel: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
  },
  priorityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  priorityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityLabel: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
  },
  quickChipsSection: {
    gap: 6,
  },
  quickChipsTitle: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
    paddingHorizontal: spacing.xs,
  },
  chipsScroll: {
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: fontSizes.caption - 1,
  },
  inputLabel: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    marginTop: 4,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: fontSizes.body,
  },
  descHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  charCount: {
    fontSize: fontSizes.caption - 1,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: fontSizes.body,
    minHeight: 110,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
