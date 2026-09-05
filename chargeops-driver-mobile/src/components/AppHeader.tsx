import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePreferences } from '@/context/PreferencesContext';
import { spacing } from '@/theme';

export interface HeaderActionBtnProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  badgeCount?: number;
  accessibilityLabel?: string;
  iconSize?: number;
}

/**
 * Standardized circular glass action button for Header actions (Settings, Notifs, QR, etc.)
 */
export function HeaderActionBtn({
  icon,
  onPress,
  badgeCount,
  accessibilityLabel,
  iconSize = 20,
}: HeaderActionBtnProps) {
  const { isDark } = usePreferences();

  return (
    <Pressable
      style={[
        styles.circleActionBtn,
        {
          backgroundColor: isDark ? 'rgba(25, 36, 32, 0.92)' : '#FFFFFF',
          borderColor: isDark ? 'rgba(52, 211, 153, 0.25)' : 'rgba(226, 232, 240, 0.9)',
        },
      ]}
      hitSlop={8}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons
        name={icon}
        size={iconSize}
        color={isDark ? '#F1F5F9' : '#334155'}
      />
      {badgeCount !== undefined && badgeCount > 0 && (
        <View style={[styles.notifBadge, isDark && { borderColor: '#192420' }]}>
          <Text style={styles.notifBadgeText}>
            {badgeCount > 9 ? '9+' : badgeCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export interface AppHeaderProps {
  /** Screen title (e.g. "Đặt chỗ"), or the brand stem "Charge" when `accent` is set. */
  title?: string;
  /** Emerald-accented suffix appended to the title — e.g. "Ops" for the brand wordmark. */
  accent?: string;
  /** Uppercase role label under the title. Defaults to the driver role (TÀI XẾ). */
  role?: string;
  /** Optional icon in the squircle badge (defaults to 'flash') */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Slogan lines displayed in center: [line1, line2] or false to hide. */
  slogan?: [string, string] | false;
  /** Optional trailing action buttons rendered at the right */
  trailing?: ReactNode;
  /** Children rendered inside the curved header background container */
  children?: ReactNode;
  /** Whether to show the right-anchored EV illustration. Defaults to true. */
  withIllustration?: boolean;
  /** Custom container style for header wrapper */
  style?: StyleProp<ViewStyle>;
  /** Custom container style for top row */
  topRowStyle?: StyleProp<ViewStyle>;
}

/**
 * Universal EV Superapp Header:
 * - Layered background with EV car & charging post illustration (`header-background.png`)
 * - Theme-adaptive soft mint `#EAF7F1` (Light) / dark emerald `#0D1412` with dark overlay (Dark)
 * - Safe-area inset aware full-bleed header with 24px bottom curved corners
 * - Left brand squircle badge with customizable icon + title/wordmark + role label
 * - Center slogan with emerald accent bar
 * - Right standardized circular action buttons
 * - Slot for children (search bar, filter capsules, tabs, location pill)
 */
export function AppHeader({
  title,
  accent,
  role,
  icon = 'flash',
  slogan,
  trailing,
  children,
  withIllustration,
  style,
  topRowStyle,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { isDark } = usePreferences();

  // Only show the EV car illustration when children (e.g. search bar, filters) are present,
  // or when explicitly forced via withIllustration={true}. Compact headers stay clean.
  const showIllustration = withIllustration !== undefined ? withIllustration : Boolean(children);
  const roleLabel = role;
  const displayTitle = title ?? 'Charge';
  const displayAccent = accent ?? (title ? undefined : 'Ops');

  return (
    <View
      style={[
        styles.headerBackground,
        {
          paddingTop: Math.max(insets.top, 12) + spacing.xs,
          paddingBottom: children ? 6 : spacing.xs,
          backgroundColor: isDark ? '#0D1412' : '#EAF7F1',
        },
        style,
      ]}
    >
      {/* Right-anchored background illustration */}
      {showIllustration && (
        <Image
          source={require('../../assets/header-background.png')}
          style={styles.headerBgIllustration}
          resizeMode="contain"
        />
      )}
      {isDark && showIllustration && <View style={styles.darkOverlay} />}

      {/* Row 1: Brand & Role (Left) + Slogan (Center) + Actions (Right) */}
      <View style={[styles.headerTopRow, topRowStyle]}>
        {/* Left: Squircle Icon + Title Block */}
        <View style={styles.headerLeftCol}>
          <View style={styles.brandRow}>
            <View style={styles.brandIconSquircle}>
              <Ionicons name={icon} size={22} color="#FFFFFF" />
            </View>
            <View style={styles.brandTextCol}>
              <Text
                style={[styles.brandWordmark, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
                numberOfLines={1}
              >
                {displayTitle}
                {displayAccent ? (
                  <Text style={styles.brandWordmarkAccent}>{displayAccent}</Text>
                ) : null}
              </Text>
              {!!roleLabel && (
                <Text
                  style={[styles.brandRoleText, { color: isDark ? '#94A3B8' : '#64748B' }]}
                  numberOfLines={1}
                >
                  {roleLabel}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Center: Slogan Column */}
        {slogan !== false && slogan && slogan.length === 2 && (
          <View style={styles.sloganCol}>
            <Text
              style={[styles.sloganText, { color: isDark ? '#A7F3D0' : '#00875A' }]}
              numberOfLines={1}
            >
              {slogan[0]}
            </Text>
            <Text
              style={[styles.sloganText, { color: isDark ? '#A7F3D0' : '#00875A' }]}
              numberOfLines={1}
            >
              {slogan[1]}
            </Text>
            <View
              style={[
                styles.sloganLine,
                { backgroundColor: isDark ? '#34D399' : '#00B074' },
              ]}
            />
          </View>
        )}

        {/* Right: Actions */}
        {trailing ? <View style={styles.headerActions}>{trailing}</View> : null}
      </View>

      {/* Optional In-Header Children (Search bar, quick filters, segmented tabs, etc.) */}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  headerBackground: {
    position: 'relative',
    overflow: 'hidden',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: 6,
    marginBottom: 4,
  },
  headerBgIllustration: {
    position: 'absolute',
    right: -10,
    top: 0,
    bottom: 0,
    width: 580,
    height: '100%',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 20, 16, 0.65)',
    pointerEvents: 'none',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  headerLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginRight: 6,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  brandIconSquircle: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#00B074',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0, 176, 116, 0.25)',
      },
      default: {
        shadowColor: '#00B074',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
    }),
    elevation: 3,
  },
  brandTextCol: {
    justifyContent: 'center',
    flexShrink: 1,
  },
  brandWordmark: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: '#0F172A',
  },
  brandWordmarkAccent: {
    color: '#00B074',
  },
  brandRoleText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  sloganCol: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  sloganText: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 13.5,
    textAlign: 'center',
  },
  sloganLine: {
    width: 22,
    height: 2,
    backgroundColor: '#00B074',
    borderRadius: 1,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  circleActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 11,
  },
});
