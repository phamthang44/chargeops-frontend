import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components';
import type { RootStackParamList } from '@/navigation/types';
import { colors, fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Welcome'>;

const FEATURES = [
  { icon: 'flash' as const, label: 'SẠC NHANH\nCHÓNG' },
  { icon: 'location' as const, label: 'TÌM TRẠM\nGẦN NHẤT' },
  { icon: 'card' as const, label: 'THANH TOÁN\nTIỆN LỢI' },
] as const;

export function WelcomeScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* App logo */}
        <View style={styles.logoBox}>
          <Ionicons name="flash" size={40} color={colors.textInverse} />
        </View>

        {/* Headline */}
        <Text style={styles.title}>Sạc xe dễ dàng</Text>
        <Text style={styles.subtitle}>
          Giải pháp quản lý và đặt chỗ{'\n'}trạm sạc xe điện thông minh tại{'\n'}Việt Nam.
        </Text>

        {/* Accent line */}
        <View style={styles.accent} />

        {/* Feature chips */}
        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.label} style={styles.featureItem}>
              <View style={styles.featureIconBox}>
                <Ionicons name={f.icon} size={20} color={colors.primary} />
              </View>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>

        {/* Station image banner */}
        <View style={styles.imageBanner}>
          <View style={styles.imagePlaceholder}>
            <Ionicons name="business-outline" size={56} color="rgba(255,255,255,0.25)" />
          </View>
          <View style={styles.imageCaptionRow}>
            <Text style={styles.imageCaption}>Phủ sóng hơn 1000+ trạm sạc toàn quốc</Text>
          </View>
        </View>
      </ScrollView>

      {/* Fixed footer */}
      <View style={styles.footer}>
        <AppButton
          label="Đăng nhập / Đăng ký"
          onPress={() => navigation.navigate('Login')}
          style={styles.ctaButton}
        />
        <Text style={styles.footerNote}>
          {'Bằng cách tiếp tục, bạn đồng ý với '}
          <Pressable>
            <Text style={styles.footerLink}>Điều khoản dịch vụ</Text>
          </Pressable>
          {' & '}
          <Pressable>
            <Text style={styles.footerLink}>Chính sách bảo mật</Text>
          </Pressable>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },

  // Logo
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.textStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },

  // Headline
  title: {
    fontSize: 28,
    fontWeight: fontWeights.bold,
    color: colors.textStrong,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.regular,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: lineHeights.body,
    marginBottom: spacing.lg,
  },

  // Accent
  accent: {
    width: 32,
    height: 3,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    marginBottom: spacing.xl,
  },

  // Features
  features: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.xl,
  },
  featureItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: lineHeights.caption,
  },

  // Image banner
  imageBanner: {
    width: '100%',
    height: 180,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  imagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#2D3748',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageCaptionRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(17,24,39,0.55)',
  },
  imageCaption: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
    color: colors.textInverse,
  },

  // Footer
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  ctaButton: {
    height: 52,
    borderRadius: radius.lg,
  },
  footerNote: {
    fontSize: fontSizes.caption,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: lineHeights.caption,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: fontWeights.medium,
  },
});
