import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { legalDocument, type LegalDocType, type LegalDocument } from '@/content/legal';
import { usePreferences } from '@/context/PreferencesContext';
import { fetchLegalDocument } from '@/services/legalService';
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
  const { t, i18n } = useTranslation();
  const { themeColors } = usePreferences();
  const [activeType, setActiveType] = useState<LegalDocType>(initialType);
  const [searchQuery, setSearchQuery] = useState('');
  const [doc, setDoc] = useState<LegalDocument>(() => legalDocument(activeType, i18n.language));

  useEffect(() => {
    setDoc(legalDocument(activeType, i18n.language));

    let isMounted = true;
    fetchLegalDocument(activeType, i18n.language).then((liveDoc) => {
      if (isMounted && liveDoc) {
        setDoc(liveDoc);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [activeType, i18n.language]);

  const q = searchQuery.trim().toLowerCase();
  const filteredSections = doc.sections.filter((section) => {
    if (!q) return true;
    return (
      section.title.toLowerCase().includes(q) ||
      section.body.some((line) => line.toLowerCase().includes(q))
    );
  });

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      {/* Top Segmented Tab Switcher */}
      <View style={[styles.tabs, { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border }]}>
        <Pressable
          onPress={() => {
            setActiveType('terms');
            setSearchQuery('');
          }}
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
            {t('common.terms')}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setActiveType('privacy');
            setSearchQuery('');
          }}
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
            {t('common.privacy')}
          </Text>
        </Pressable>
      </View>

      {/* In-document keyword search */}
      <View style={[styles.searchBar, { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border }]}>
        <Ionicons name="search-outline" size={16} color={themeColors.textMuted} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('legalSheet.searchPlaceholder')}
          accessibilityLabel={t('legalSheet.searchPlaceholder')}
          placeholderTextColor={themeColors.textMuted}
          style={[styles.searchInput, { color: themeColors.textStrong }]}
        />
        {Boolean(searchQuery) && (
          <Pressable accessibilityRole="button" accessibilityLabel={t('legalSheet.clearSearch')} hitSlop={12} onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={16} color={themeColors.textMuted} />
          </Pressable>
        )}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Trust & Security Banner */}
        <View style={[styles.securityBanner, { backgroundColor: themeColors.primarySoft, borderColor: themeColors.border }]}>
          <View style={styles.bannerHeader}>
            <View style={styles.bannerIconBadge}>
              <Ionicons name="shield-checkmark" size={18} color={themeColors.primaryDark} />
            </View>
            <View style={styles.bannerTitleWrap}>
              <Text style={[styles.bannerTitle, { color: themeColors.textStrong }]}>{t('legalSheet.securityTitle')}</Text>
              <Text style={[styles.bannerSub, { color: themeColors.textMuted }]}>{t('legalSheet.updatedAt', { date: doc.updatedAt })}</Text>
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

        {/* Filtered Section Cards */}
        {filteredSections.length === 0 ? (
          <View style={[styles.introCard, { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border, alignItems: 'center' }]}>
            <Text style={[styles.introText, { color: themeColors.textMuted }]}>
              {t('legalSheet.noResults', { query: searchQuery })}
            </Text>
          </View>
        ) : (
          filteredSections.map((section, idx) => {
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
          })
        )}
      </ScrollView>

      {/* Sticky Confirm Action Footer */}
      <View style={styles.footer}>
        <Pressable accessibilityRole="button" onPress={onClose} style={[styles.confirmBtn, { backgroundColor: themeColors.primary }]}>
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          <Text style={styles.confirmBtnText}>{t('legalSheet.acknowledge')}</Text>
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
    marginBottom: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSizes.caption + 1,
    paddingVertical: 0,
  },
  tabBtn: {
    minHeight: 48,
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
    ...Platform.select({
      web: {
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      },
    }),
  },
  tabText: {
    flexShrink: 1,
    textAlign: 'center',
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
  },
  activeTabText: {
    fontWeight: fontWeights.bold,
  },
  scroll: {
    flexShrink: 1,
    minHeight: 0,
    maxHeight: 460,
  },
  scrollContent: {
    gap: spacing.md,
    paddingBottom: spacing.md,
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
    minHeight: 48,
    padding: spacing.sm,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  confirmBtnText: {
    flexShrink: 1,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
});
