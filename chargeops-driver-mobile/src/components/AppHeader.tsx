import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, lineHeights, spacing } from '@/theme';

import { BrandMark } from './brand/Logo';

interface AppHeaderProps {
  /** Screen title (e.g. "Đặt chỗ"), or the brand stem "Charge" when `accent` is set. */
  title: string;
  /** Emerald-accented suffix appended to the title — e.g. "Ops" for the brand wordmark. */
  accent?: string;
  /** Uppercase role label under the title. Defaults to the driver role (TÀI XẾ). */
  role?: string;
  /** Optional trailing action rendered at the right (e.g. a notification button). */
  trailing?: ReactNode;
  /** Brand mark style — 'brand' (emerald) by default, 'dark' for the dark square. */
  markVariant?: 'brand' | 'dark';
}

/**
 * Shared top app bar (DESIGN_SYSTEM §1): leading brand mark + screen title with a
 * small uppercase role label beneath it, and an optional trailing action. Dynamic
 * theme aware for Light and Dark modes.
 */
export function AppHeader({ title, accent, role, trailing, markVariant = 'brand' }: AppHeaderProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();
  const roleLabel = role ?? t('common.role');

  return (
    <View style={styles.bar}>
      <View style={styles.left}>
        <BrandMark size={40} variant={markVariant} />
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: themeColors.textStrong }]} numberOfLines={1}>
            {title}
            {accent ? <Text style={{ color: themeColors.primary }}>{accent}</Text> : null}
          </Text>
          {!!roleLabel && <Text style={[styles.role, { color: themeColors.textMuted }]}>{roleLabel}</Text>}
        </View>
      </View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  titleBlock: { flexShrink: 1 },
  title: {
    fontSize: fontSizes.heading,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.heading,
  },
  role: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  trailing: { marginLeft: spacing.sm },
});
