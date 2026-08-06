import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { legalDocument, type LegalDocType } from '@/content/legal';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import { BottomSheet } from './BottomSheet';

interface LegalDocumentSheetProps {
  visible: boolean;
  type: LegalDocType;
  onClose: () => void;
}

const SECTION_ICONS: Record<number, keyof typeof Ionicons.glyphMap> = {
  0: 'person-circle-outline',
  1: 'shield-checkmark-outline',
  2: 'calendar-outline',
  3: 'card-outline',
  4: 'qr-code-outline',
  5: 'help-buoy-outline',
};

export function LegalDocumentSheet({ visible, type: initialType, onClose }: LegalDocumentSheetProps) {
  const { i18n } = useTranslation();
  const { themeColors } = usePreferences();
  const [activeType, setActiveType] = useState<LegalDocType>(initialType);

  const doc = legalDocument(activeType, i18n.language);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      {/* Top Segmented Tab Switcher */}
      <View style={[styles.tabs, { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border }]}>
        <Pressable
          onPress={() => setActiveType('terms')}
          style={[
            styles.tabBtn,
            activeType === 'terms' && [styles.activeTab, { backgroundColor: themeColors.surface, borderColor: themeColors.border }],
          ]}
        >
          <Ionicons
            name="document-text-outline"
            size={16}
            color={activeType === 'terms' ? themeColors.primary : themeColors.textMuted}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeType === 'terms' ? themeColors.textStrong : themeColors.textMuted },
              activeType === 'terms' && styles.activeTabText,
            ]}
          >
            Điều khoản dịch vụ
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveType('privacy')}
          style={[
            styles.tabBtn,
            activeType === 'privacy' && [styles.activeTab, { backgroundColor: themeColors.surface, borderColor: themeColors.border }],
          ]}
        >
          <Ionicons
            name="shield-checkmark-outline"
            size={16}
            color={activeType === 'privacy' ? themeColors.primary : themeColors.textMuted}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeType === 'privacy' ? themeColors.textStrong : themeColors.textMuted },
              activeType === 'privacy' && styles.activeTabText,
            ]}
          >
            Chính sách bảo mật
          </Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Trust & Security Banner */}
        <View style={[styles.securityBanner, { backgroundColor: themeColors.primarySoft, borderColor: themeColors.border }]}>
          <View style={styles.bannerHeader}>
            <View style={styles.bannerIconBadge}>
              <Ionicons name="shield-checkmark" size={18} color={themeColors.primaryDark} />
            </View>
            <View style={styles.bannerTitleWrap}>
              <Text style={[styles.bannerTitle, { color: themeColors.textStrong }]}>Hạ tầng & Bảo mật dữ liệu</Text>
              <Text style={[styles.bannerSub, { color: themeColors.textMuted }]}>Cập nhật ngày {doc.updatedAt}</Text>
            </View>
          </View>

          {/* Security Specs Tags */}
          <View style={styles.specTagsRow}>
            <View style={[styles.specTag, { backgroundColor: themeColors.surface }]}>
              <Text style={[styles.specTagText, { color: themeColors.textBody }]}>🔒 Argon2id Hash</Text>
            </View>
            <View style={[styles.specTag, { backgroundColor: themeColors.surface }]}>
              <Text style={[styles.specTagText, { color: themeColors.textBody }]}>🔑 OIDC PKCE S256</Text>
            </View>
            <View style={[styles.specTag, { backgroundColor: themeColors.surface }]}>
              <Text style={[styles.specTagText, { color: themeColors.textBody }]}>🔏 RS256 JWT</Text>
            </View>
            <View style={[styles.specTag, { backgroundColor: themeColors.surface }]}>
              <Text style={[styles.specTagText, { color: themeColors.textBody }]}>🛡️ HTTPS TLS 1.2+</Text>
            </View>
          </View>
        </View>

        {/* Intro Card */}
        <View style={[styles.introCard, { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border }]}>
          <Text style={[styles.introText, { color: themeColors.textBody }]}>{doc.intro}</Text>
        </View>

        {/* Structured Section Cards */}
        {doc.sections.map((section, idx) => {
          const iconName = SECTION_ICONS[idx % 6] ?? 'document-text-outline';
          return (
            <View key={section.title} style={[styles.sectionCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBadge, { backgroundColor: themeColors.primarySoft }]}>
                  <Ionicons name={iconName} size={16} color={themeColors.primaryDark} />
                </View>
                <Text style={[styles.sectionTitle, { color: themeColors.textStrong }]}>{section.title}</Text>
              </View>

              <View style={styles.sectionBody}>
                {section.body.map((line, lIdx) => (
                  <View key={lIdx} style={styles.bulletRow}>
                    <View style={[styles.bulletDot, { backgroundColor: themeColors.primary }]} />
                    <Text style={[styles.bodyText, { color: themeColors.textBody }]}>{line}</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Sticky Confirm Action Footer */}
      <View style={styles.footer}>
        <Pressable onPress={onClose} style={[styles.confirmBtn, { backgroundColor: themeColors.primary }]}>
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          <Text style={styles.confirmBtnText}>Tôi đã hiểu & Đồng ý</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    padding: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  activeTab: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
  },
  activeTabText: {
    fontWeight: fontWeights.bold,
  },
  scrollContent: {
    gap: spacing.md,
    paddingBottom: spacing.md,
    maxHeight: 460,
  },
  securityBanner: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bannerIconBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitleWrap: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  bannerSub: {
    fontSize: fontSizes.caption,
  },
  specTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  specTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  specTagText: {
    fontSize: fontSizes.caption - 1,
    fontWeight: fontWeights.semibold,
  },
  introCard: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  introText: {
    fontSize: fontSizes.caption + 1,
    lineHeight: lineHeights.body,
  },
  sectionCard: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionIconBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    flex: 1,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  sectionBody: {
    gap: spacing.sm,
    paddingLeft: spacing.xs,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    marginTop: 6,
  },
  bodyText: {
    flex: 1,
    fontSize: fontSizes.caption + 1,
    lineHeight: lineHeights.body,
  },
  footer: {
    paddingTop: spacing.sm,
  },
  confirmBtn: {
    height: 48,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
});
