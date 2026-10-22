import { useOverlayLayout } from '@/hooks/useOverlayLayout';
import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RootStackParamList } from '@/navigation/types';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import { AppButton } from './AppButton';

export type SupportCenterTab = 'guide' | 'faq' | 'tickets';

export interface SupportCenterModalProps {
  visible: boolean;
  onClose: () => void;
  initialTab?: SupportCenterTab;
}

interface GuideItemDef {
  key: 'discovery' | 'booking' | 'checkIn' | 'charging' | 'cancellation' | 'safety';
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  lightBg: string;
  darkBg: string;
  actionScreen?: 'Map' | 'Bookings' | 'QRCheckIn' | 'CreateTicket';
}

const GUIDE_ITEMS: GuideItemDef[] = [
  {
    key: 'discovery',
    icon: 'map-outline',
    accent: '#10B981',
    lightBg: '#ECFDF5',
    darkBg: '#064E3B',
    actionScreen: 'Map',
  },
  {
    key: 'booking',
    icon: 'calendar-outline',
    accent: '#3B82F6',
    lightBg: '#EFF6FF',
    darkBg: '#1E3A8A',
    actionScreen: 'Bookings',
  },
  {
    key: 'checkIn',
    icon: 'qr-code-outline',
    accent: '#8B5CF6',
    lightBg: '#F5F3FF',
    darkBg: '#4C1D95',
    actionScreen: 'QRCheckIn',
  },
  {
    key: 'charging',
    icon: 'flash-outline',
    accent: '#F59E0B',
    lightBg: '#FFFBEB',
    darkBg: '#78350F',
  },
  {
    key: 'cancellation',
    icon: 'shield-checkmark-outline',
    accent: '#059669',
    lightBg: '#ECFDF5',
    darkBg: '#064E3B',
  },
  {
    key: 'safety',
    icon: 'alert-circle-outline',
    accent: '#EF4444',
    lightBg: '#FEF2F2',
    darkBg: '#7F1D1D',
    actionScreen: 'CreateTicket',
  },
];

const FAQ_KEYS = [
  'connectorType',
  'lateArrival',
  'qrError',
  'refundTiming',
  'blockedSlot',
] as const;

/**
 * Driver Help Center & Interactive Quick Guide Hub (FE-13).
 * Provides interactive step-by-step guides, FAQs with accordion answers,
 * and direct links to support tickets and live safety guidelines.
 */
export function SupportCenterModal({
  visible,
  onClose,
  initialTab = 'guide',
}: SupportCenterModalProps) {
  const overlay = useOverlayLayout();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { themeColors, isDark } = usePreferences();

  const [activeTab, setActiveTab] = useState<SupportCenterTab>(initialTab);
  const [expandedGuides, setExpandedGuides] = useState<Record<string, boolean>>({
    discovery: true,
  });
  const [expandedFaqs, setExpandedFaqs] = useState<Record<string, boolean>>({
    connectorType: true,
  });

  useEffect(() => {
    if (visible && initialTab) {
      setActiveTab(initialTab);
    }
  }, [visible, initialTab]);

  function toggleGuide(key: string) {
    setExpandedGuides((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleFaq(key: string) {
    setExpandedFaqs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleActionNavigation(screen?: 'Map' | 'Bookings' | 'QRCheckIn' | 'CreateTicket') {
    onClose();
    if (screen === 'Map') {
      navigation.navigate('Tabs', { screen: 'Map' });
    } else if (screen === 'Bookings') {
      navigation.navigate('Tabs', { screen: 'Bookings' });
    } else if (screen === 'QRCheckIn') {
      navigation.navigate('QRCheckIn', {});
    } else if (screen === 'CreateTicket') {
      navigation.navigate('CreateTicket', {});
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.root, overlay.rootStyle]}>
        <BlurView intensity={28} tint={isDark ? 'dark' : 'regular'} style={StyleSheet.absoluteFill} />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View
          style={[
            styles.sheet,
            overlay.sheetStyle,
            {
              backgroundColor: themeColors.surface,
              paddingBottom: insets.bottom + spacing.lg,
            },
          ]}
        >
          {/* Sheet Handle */}
          <View style={[styles.handle, { backgroundColor: themeColors.border }]} />

          {/* Sheet Header */}
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={[styles.title, { color: themeColors.textStrong }]}>
                {t('profile.support.title')}
              </Text>
              <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
                {t('profile.support.subtitle')}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              hitSlop={8}
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: themeColors.surfaceAlt }]}
            >
              <Ionicons name="close" size={22} color={themeColors.textBody} />
            </Pressable>
          </View>

          {/* 3-Tab Segmented Capsule Bar */}
          <View style={[styles.tabBar, { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border }]}>
            {/* Tab: Guide */}
            <Pressable
              style={[
                styles.tabBtn,
                activeTab === 'guide' && [styles.tabBtnActive, { backgroundColor: themeColors.surface }],
              ]}
              onPress={() => setActiveTab('guide')}
            >
              <Ionicons
                name="book-outline"
                size={16}
                color={activeTab === 'guide' ? themeColors.primary : themeColors.textMuted}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'guide' ? themeColors.primaryDark : themeColors.textMuted },
                  activeTab === 'guide' && styles.tabBtnTextActive,
                ]}
              >
                {t('profile.support.tabs.guide')}
              </Text>
            </Pressable>

            {/* Tab: FAQ */}
            <Pressable
              style={[
                styles.tabBtn,
                activeTab === 'faq' && [styles.tabBtnActive, { backgroundColor: themeColors.surface }],
              ]}
              onPress={() => setActiveTab('faq')}
            >
              <Ionicons
                name="help-circle-outline"
                size={16}
                color={activeTab === 'faq' ? themeColors.primary : themeColors.textMuted}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'faq' ? themeColors.primaryDark : themeColors.textMuted },
                  activeTab === 'faq' && styles.tabBtnTextActive,
                ]}
              >
                {t('profile.support.tabs.faq')}
              </Text>
            </Pressable>

            {/* Tab: Tickets */}
            <Pressable
              style={[
                styles.tabBtn,
                activeTab === 'tickets' && [styles.tabBtnActive, { backgroundColor: themeColors.surface }],
              ]}
              onPress={() => setActiveTab('tickets')}
            >
              <Ionicons
                name="chatbubbles-outline"
                size={16}
                color={activeTab === 'tickets' ? themeColors.primary : themeColors.textMuted}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'tickets' ? themeColors.primaryDark : themeColors.textMuted },
                  activeTab === 'tickets' && styles.tabBtnTextActive,
                ]}
              >
                {t('profile.support.tabs.tickets')}
              </Text>
            </Pressable>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {/* ======================================================== */}
            {/* TAB 1: DRIVER QUICK GUIDE                               */}
            {/* ======================================================== */}
            {activeTab === 'guide' && (
              <>
                {/* Welcome Guide Card */}
                <View
                  style={[
                    styles.welcomeCard,
                    { backgroundColor: themeColors.primarySoft, borderColor: themeColors.primary },
                  ]}
                >
                  <View style={[styles.welcomeIcon, { backgroundColor: themeColors.primary }]}>
                    <Ionicons name="compass" size={24} color="#FFFFFF" />
                  </View>
                  <View style={styles.welcomeCopy}>
                    <Text style={[styles.welcomeTitle, { color: themeColors.primaryDark }]}>
                      {t('profile.support.guideWelcomeTitle')}
                    </Text>
                    <Text style={[styles.welcomeBody, { color: themeColors.textBody }]}>
                      {t('profile.support.guideWelcomeBody')}
                    </Text>
                  </View>
                </View>

                {/* 6 Step Interactive Guides Accordion */}
                <View style={styles.guideList}>
                  {GUIDE_ITEMS.map((item) => {
                    const isExpanded = Boolean(expandedGuides[item.key]);
                    const guideTitle = t(`profile.support.guides.${item.key}.title`);
                    const guideSummary = t(`profile.support.guides.${item.key}.summary`);
                    const step1 = t(`profile.support.guides.${item.key}.step1`);
                    const step2 = t(`profile.support.guides.${item.key}.step2`);
                    const step3 = t(`profile.support.guides.${item.key}.step3`);
                    const tip = t(`profile.support.guides.${item.key}.tip`);
                    const actionLabel = t(`profile.support.guides.${item.key}.action`);

                    return (
                      <View
                        key={item.key}
                        style={[
                          styles.accordionCard,
                          {
                            backgroundColor: themeColors.surfaceAlt,
                            borderColor: isExpanded ? item.accent : themeColors.border,
                          },
                        ]}
                      >
                        {/* Header Row (Press to toggle) */}
                        <Pressable
                          style={styles.accordionHeader}
                          onPress={() => toggleGuide(item.key)}
                        >
                          <View
                            style={[
                              styles.accordionIconWrap,
                              { backgroundColor: isDark ? item.darkBg : item.lightBg },
                            ]}
                          >
                            <Ionicons name={item.icon} size={22} color={item.accent} />
                          </View>

                          <View style={styles.accordionCopy}>
                            <Text style={[styles.accordionTitle, { color: themeColors.textStrong }]}>
                              {guideTitle}
                            </Text>
                            <Text style={[styles.accordionSummary, { color: themeColors.textMuted }]}>
                              {guideSummary}
                            </Text>
                          </View>

                          <View style={styles.chevronWrap}>
                            <Ionicons
                              name={isExpanded ? 'chevron-up' : 'chevron-down'}
                              size={18}
                              color={themeColors.textMuted}
                            />
                          </View>
                        </Pressable>

                        {/* Expanded Detailed Steps */}
                        {isExpanded && (
                          <View style={[styles.accordionBody, { borderTopColor: themeColors.border }]}>
                            {/* Step 1 */}
                            <View style={styles.stepRow}>
                              <View style={[styles.stepBadge, { backgroundColor: item.accent }]}>
                                <Text style={styles.stepBadgeText}>1</Text>
                              </View>
                              <Text style={[styles.stepText, { color: themeColors.textBody }]}>
                                {step1}
                              </Text>
                            </View>

                            {/* Step 2 */}
                            <View style={styles.stepRow}>
                              <View style={[styles.stepBadge, { backgroundColor: item.accent }]}>
                                <Text style={styles.stepBadgeText}>2</Text>
                              </View>
                              <Text style={[styles.stepText, { color: themeColors.textBody }]}>
                                {step2}
                              </Text>
                            </View>

                            {/* Step 3 */}
                            <View style={styles.stepRow}>
                              <View style={[styles.stepBadge, { backgroundColor: item.accent }]}>
                                <Text style={styles.stepBadgeText}>3</Text>
                              </View>
                              <Text style={[styles.stepText, { color: themeColors.textBody }]}>
                                {step3}
                              </Text>
                            </View>

                            {/* Tip Callout */}
                            {Boolean(tip) && (
                              <View
                                style={[
                                  styles.tipBox,
                                  {
                                    backgroundColor: isDark ? `${item.accent}1A` : `${item.accent}10`,
                                    borderColor: `${item.accent}40`,
                                  },
                                ]}
                              >
                                <Ionicons name="bulb-outline" size={17} color={item.accent} />
                                <Text style={[styles.tipText, { color: themeColors.textStrong }]}>
                                  {tip}
                                </Text>
                              </View>
                            )}

                            {/* Action Button (Navigate) */}
                            {Boolean(item.actionScreen) && (
                              <Pressable
                                style={[styles.actionBtn, { backgroundColor: item.accent }]}
                                onPress={() => handleActionNavigation(item.actionScreen)}
                              >
                                <Text style={styles.actionBtnText}>{actionLabel}</Text>
                                <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
                              </Pressable>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            {/* ======================================================== */}
            {/* TAB 2: FREQUENTLY ASKED QUESTIONS (FAQ)                 */}
            {/* ======================================================== */}
            {activeTab === 'faq' && (
              <>
                <View style={styles.faqList}>
                  {FAQ_KEYS.map((faqKey) => {
                    const isExpanded = Boolean(expandedFaqs[faqKey]);
                    const question = t(`profile.support.faqs.${faqKey}.q`);
                    const answer = t(`profile.support.faqs.${faqKey}.a`);

                    return (
                      <View
                        key={faqKey}
                        style={[
                          styles.faqCard,
                          {
                            backgroundColor: themeColors.surfaceAlt,
                            borderColor: isExpanded ? themeColors.primary : themeColors.border,
                          },
                        ]}
                      >
                        <Pressable
                          style={styles.faqHeader}
                          onPress={() => toggleFaq(faqKey)}
                        >
                          <View style={styles.faqQuestionWrap}>
                            <Text style={[styles.faqQBadge, { color: themeColors.primary }]}>Q.</Text>
                            <Text style={[styles.faqQuestion, { color: themeColors.textStrong }]}>
                              {question}
                            </Text>
                          </View>
                          <Ionicons
                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                            size={18}
                            color={themeColors.textMuted}
                          />
                        </Pressable>

                        {isExpanded && (
                          <View style={[styles.faqBody, { borderTopColor: themeColors.border }]}>
                            <Text style={[styles.faqAnswer, { color: themeColors.textBody }]}>
                              {answer}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>

                {/* FAQ Callout to Tickets */}
                <View
                  style={[
                    styles.faqNoticeCard,
                    { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border },
                  ]}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={24} color={themeColors.primary} />
                  <Text style={[styles.faqNoticeText, { color: themeColors.textMuted }]}>
                    {t('profile.support.faqNotice')}
                  </Text>
                  <Pressable
                    style={[styles.faqTicketBtn, { borderColor: themeColors.primary }]}
                    onPress={() => setActiveTab('tickets')}
                  >
                    <Text style={[styles.faqTicketBtnText, { color: themeColors.primary }]}>
                      {t('profile.support.faqTicketBtn')}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}

            {/* ======================================================== */}
            {/* TAB 3: TICKETS & LIVE SUPPORT CHANNELS                  */}
            {/* ======================================================== */}
            {activeTab === 'tickets' && (
              <View style={styles.ticketSection}>
                <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>
                  {t('profile.support.ticketSectionTitle')}
                </Text>

                {/* Submit New Ticket */}
                <Pressable
                  style={[
                    styles.ticketActionBtn,
                    {
                      backgroundColor: themeColors.primarySoft,
                      borderColor: themeColors.primary,
                    },
                  ]}
                  onPress={() => {
                    onClose();
                    navigation.navigate('CreateTicket', {});
                  }}
                >
                  <View style={[styles.ticketActionIcon, { backgroundColor: themeColors.primary }]}>
                    <Ionicons name="add-circle" size={22} color="#FFFFFF" />
                  </View>
                  <View style={styles.ticketActionCopy}>
                    <Text style={[styles.ticketActionTitle, { color: themeColors.primaryDark }]}>
                      {t('profile.support.newTicketTitle')}
                    </Text>
                    <Text style={[styles.ticketActionSub, { color: themeColors.textBody }]}>
                      {t('profile.support.newTicketBody')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={themeColors.primary} />
                </Pressable>

                {/* My Support Tickets */}
                <Pressable
                  style={[
                    styles.ticketActionBtn,
                    {
                      backgroundColor: themeColors.surfaceAlt,
                      borderColor: themeColors.border,
                    },
                  ]}
                  onPress={() => {
                    onClose();
                    navigation.navigate('MyTickets');
                  }}
                >
                  <View
                    style={[
                      styles.ticketActionIcon,
                      { backgroundColor: isDark ? '#1E293B' : '#EFF6FF' },
                    ]}
                  >
                    <Ionicons name="chatbubbles" size={20} color="#3B82F6" />
                  </View>
                  <View style={styles.ticketActionCopy}>
                    <Text style={[styles.ticketActionTitle, { color: themeColors.textStrong }]}>
                      {t('profile.support.myTicketsTitle')}
                    </Text>
                    <Text style={[styles.ticketActionSub, { color: themeColors.textMuted }]}>
                      {t('profile.support.myTicketsBody')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
                </Pressable>

                {/* Emergency & Safety Card */}
                <View
                  style={[
                    styles.emergencyCard,
                    {
                      backgroundColor: isDark ? '#450A0A' : '#FFF1F2',
                      borderColor: isDark ? '#7F1D1D' : '#FECDD3',
                    },
                  ]}
                >
                  <View style={styles.emergencyHeader}>
                    <Ionicons name="warning-outline" size={20} color="#E11D48" />
                    <Text style={[styles.emergencyTitle, { color: isDark ? '#FDA4AF' : '#9F1239' }]}>
                      {t('profile.support.emergencyCardTitle')}
                    </Text>
                  </View>
                  <Text style={[styles.emergencyBody, { color: isDark ? '#FECDD3' : '#881337' }]}>
                    {t('profile.support.emergencyCardBody')}
                  </Text>
                  <Pressable
                    style={[styles.emergencyBtn, { backgroundColor: '#E11D48' }]}
                    onPress={() => {
                      onClose();
                      navigation.navigate('CreateTicket', { defaultCategory: 'CHARGING_ISSUE' });
                    }}
                  >
                    <Ionicons name="alert-circle" size={16} color="#FFFFFF" />
                    <Text style={styles.emergencyBtnText}>{t('profile.support.emergencyReportBtn')}</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Bottom Close Button */}
          <AppButton label={t('profile.support.close')} onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    height: '88%',
    maxHeight: '94%',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radius.full,
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: fontSizes.heading,
    fontWeight: fontWeights.bold,
  },
  subtitle: {
    fontSize: fontSizes.caption,
    lineHeight: lineHeights.caption,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 3,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  tabBtnActive: {
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  tabBtnText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
  },
  tabBtnTextActive: {
    fontWeight: fontWeights.bold,
  },
  content: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  welcomeIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeCopy: {
    flex: 1,
    gap: 2,
  },
  welcomeTitle: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  welcomeBody: {
    fontSize: fontSizes.caption,
    lineHeight: lineHeights.caption,
  },
  guideList: {
    gap: spacing.sm,
  },
  accordionCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  accordionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accordionCopy: {
    flex: 1,
    gap: 2,
  },
  accordionTitle: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
  },
  accordionSummary: {
    fontSize: fontSizes.caption,
    lineHeight: 16,
  },
  chevronWrap: {
    paddingLeft: spacing.xs,
  },
  accordionBody: {
    borderTopWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  stepBadge: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: fontWeights.bold,
  },
  stepText: {
    flex: 1,
    fontSize: fontSizes.body - 1,
    lineHeight: 20,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    marginTop: spacing.xs,
  },
  tipText: {
    flex: 1,
    fontSize: fontSizes.caption,
    lineHeight: 17,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    marginTop: spacing.xs,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: fontSizes.caption + 1,
    fontWeight: fontWeights.bold,
  },
  faqList: {
    gap: spacing.sm,
  },
  faqCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    gap: spacing.sm,
  },
  faqQuestionWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  faqQBadge: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
    marginTop: -1,
  },
  faqQuestion: {
    flex: 1,
    fontSize: fontSizes.body - 0.5,
    fontWeight: fontWeights.semibold,
    lineHeight: 20,
  },
  faqBody: {
    borderTopWidth: 1,
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  faqAnswer: {
    fontSize: fontSizes.body - 1,
    lineHeight: 21,
  },
  faqNoticeCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  faqNoticeText: {
    fontSize: fontSizes.caption,
    textAlign: 'center',
    lineHeight: lineHeights.caption,
  },
  faqTicketBtn: {
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.sm,
  },
  faqTicketBtnText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
  },
  ticketSection: {
    gap: spacing.md,
  },
  sectionLabel: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ticketActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  ticketActionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketActionCopy: {
    flex: 1,
    gap: 2,
  },
  ticketActionTitle: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  ticketActionSub: {
    fontSize: fontSizes.caption - 1,
    lineHeight: 16,
  },
  emergencyCard: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  emergencyTitle: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  emergencyBody: {
    fontSize: fontSizes.caption,
    lineHeight: lineHeights.caption,
  },
  emergencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 10,
    borderRadius: radius.sm,
    marginTop: 2,
  },
  emergencyBtnText: {
    color: '#FFFFFF',
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
  },
});
