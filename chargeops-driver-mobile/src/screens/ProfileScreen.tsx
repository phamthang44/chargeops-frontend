import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BlurView } from 'expo-blur';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AppButton,
  AppHeader,
  Card,
  GlassButton,
  SettingsModal,
  TopUpModal,
  useTabBarInset,
} from '@/components';
import { EditProfileModal } from '@/components/EditProfileModal';
import { SupportCenterModal } from '@/components/SupportCenterModal';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import type { RootStackParamList } from '@/navigation/types';
import { openKeycloakSecuritySettings } from '@/services/accountNavigation';
import { openOwnerPortal } from '@/services/portalNavigation';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { session, profile, signOut } = useAuth();
  const { themeColors, isDark } = usePreferences();
  // Clears the absolutely-positioned floating tab bar.
  const tabInset = useTabBarInset();
  const navigation = useNavigation<NavigationProp>();

  const [walletBalance, setWalletBalance] = useState(2450000);
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [settingsSection, setSettingsSection] = useState<'all' | 'language' | 'appearance'>('all');
  const [topUpVisible, setTopUpVisible] = useState(false);
  const [supportVisible, setSupportVisible] = useState(false);
  const [ownerModalVisible, setOwnerModalVisible] = useState(false);
  const [openingOwnerPortal, setOpeningOwnerPortal] = useState(false);
  const [openingSecurityAction, setOpeningSecurityAction] = useState<
    'password' | 'twoFactor' | null
  >(null);

  const userName = profile?.displayName ?? session?.user.name ?? t('profile.account.unknownName');
  const userEmail = profile?.email ?? session?.user.email ?? '';
  const userPhone = profile?.phone ?? session?.user.phone ?? '';
  const hasOwnerAccess = session?.grantedRoles.includes('OWNER') ?? false;

  function handleTopUpSuccess(amount: number) {
    setWalletBalance((prev) => prev + amount);
  }

  function handleOpenHistory() {
    navigation.navigate('Tabs', { screen: 'BookingHistory' });
  }

  async function handleOwnerAction() {
    if (!hasOwnerAccess) {
      setOwnerModalVisible(true);
      return;
    }

    setOpeningOwnerPortal(true);
    try {
      await openOwnerPortal();
    } catch {
      Alert.alert(
        t('profile.ownerBanner.errorTitle'),
        t('profile.ownerBanner.errorBody'),
      );
    } finally {
      setOpeningOwnerPortal(false);
    }
  }

  async function handleOpenSecurity(action: 'password' | 'twoFactor') {
    setOpeningSecurityAction(action);
    try {
      await openKeycloakSecuritySettings();
    } catch {
      Alert.alert(t('profile.security.errorTitle'), t('profile.security.errorBody'));
    } finally {
      setOpeningSecurityAction(null);
    }
  }

  async function handleNotificationSettings() {
    if (Platform.OS === 'web') {
      Alert.alert(
        t('profile.appSettings.notifications'),
        t('profile.appSettings.notificationsWebHint'),
      );
      return;
    }

    try {
      await Linking.openSettings();
    } catch {
      Alert.alert(
        t('profile.appSettings.notifications'),
        t('profile.appSettings.openSettingsError'),
      );
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.surfaceAlt }]} edges={['top']}>
      {/* AppHeader with Liquid Glass "More" Button */}
      <AppHeader
        title={t('profile.title')}
        trailing={
          <GlassButton
            size={36}
            onPress={() => {
              setSettingsSection('all');
              setSettingsVisible(true);
            }}
            accessibilityLabel={t('settings.title')}
            fallbackColor={themeColors.surfaceAlt}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={themeColors.textStrong} />
          </GlassButton>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabInset }]}
      >
        {/* 1. User Profile Header Card */}
        <Card style={[styles.userCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <View style={styles.userRow}>
            {/* Initials avatar uses real profile data and avoids a hardcoded remote photo. */}
            <View style={styles.avatarWrapper}>
              <View style={[styles.avatar, { backgroundColor: themeColors.primarySoft }]}>
                <Text style={[styles.avatarText, { color: themeColors.primaryDark }]}>
                  {initialsOf(userName)}
                </Text>
              </View>
              <View style={[styles.onlineBadge, { borderColor: themeColors.surface }]} />
            </View>

            {/* Name, Email & Member Tier */}
            <View style={styles.userInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.userName, { color: themeColors.textStrong }]}>{userName}</Text>
                <Ionicons name="checkmark-circle-sharp" size={18} color={themeColors.primary} />
              </View>
              <Text style={[styles.userEmail, { color: themeColors.textMuted }]}>{userEmail}</Text>

              <View style={[styles.goldBadge, { borderColor: themeColors.primary, backgroundColor: themeColors.primarySoft }]}>
                <Text style={[styles.goldBadgeText, { color: themeColors.primaryDark }]}>
                  {t('profile.goldMember')}
                </Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('profile.edit.open')}
              hitSlop={8}
              onPress={() => setEditProfileVisible(true)}
              style={[styles.editButton, { backgroundColor: themeColors.surfaceAlt }]}
            >
              <Ionicons name="create-outline" size={19} color={themeColors.primary} />
            </Pressable>
          </View>
        </Card>

        {/* Profile data belongs to ChargeOps; credentials and MFA remain in Keycloak. */}
        <Card style={[styles.sectionCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color={themeColors.primary} />
            <Text style={[styles.sectionTitle, { color: themeColors.textStrong }]}>
              {t('profile.account.sectionTitle')}
            </Text>
          </View>

          <Pressable style={styles.menuRow} onPress={() => setEditProfileVisible(true)}>
            <View style={[styles.menuIconTile, { backgroundColor: themeColors.primarySoft }]}>
              <Ionicons name="call-outline" size={20} color={themeColors.primary} />
            </View>
            <View style={styles.menuTextContent}>
              <Text style={[styles.menuTitle, { color: themeColors.textStrong }]}>
                {t('profile.account.phone')}
              </Text>
              <Text style={[styles.menuSub, { color: themeColors.textMuted }]}>
                {formatPhoneForDisplay(userPhone) || t('profile.account.notProvided')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

          <View style={styles.menuRow}>
            <View style={[styles.menuIconTile, { backgroundColor: isDark ? '#172554' : '#EFF6FF' }]}>
              <Ionicons name="mail-outline" size={20} color={themeColors.info} />
            </View>
            <View style={styles.menuTextContent}>
              <Text style={[styles.menuTitle, { color: themeColors.textStrong }]}>
                {t('profile.account.signInEmail')}
              </Text>
              <Text style={[styles.menuSub, { color: themeColors.textMuted }]} numberOfLines={1}>
                {userEmail}
              </Text>
            </View>
            <Ionicons name="shield-checkmark-outline" size={18} color={themeColors.success} />
          </View>

          <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

          <Pressable
            style={[styles.menuRow, openingSecurityAction && styles.menuRowDisabled]}
            disabled={openingSecurityAction !== null}
            onPress={() => void handleOpenSecurity('password')}
          >
            <View style={[styles.menuIconTile, { backgroundColor: isDark ? '#3B1D0B' : '#FFF7ED' }]}>
              <Ionicons name="key-outline" size={20} color="#F97316" />
            </View>
            <View style={styles.menuTextContent}>
              <Text style={[styles.menuTitle, { color: themeColors.textStrong }]}>
                {t('profile.security.passwordTitle')}
              </Text>
              <Text style={[styles.menuSub, { color: themeColors.textMuted }]}>
                {t('profile.security.passwordSubtitle')}
              </Text>
            </View>
            {openingSecurityAction === 'password' ? (
              <ActivityIndicator size="small" color={themeColors.primary} />
            ) : (
              <Ionicons name="open-outline" size={18} color={themeColors.textMuted} />
            )}
          </Pressable>

          <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

          <Pressable
            style={[styles.menuRow, openingSecurityAction && styles.menuRowDisabled]}
            disabled={openingSecurityAction !== null}
            onPress={() => void handleOpenSecurity('twoFactor')}
          >
            <View style={[styles.menuIconTile, { backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF' }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#6366F1" />
            </View>
            <View style={styles.menuTextContent}>
              <View style={styles.menuTitleRow}>
                <Text style={[styles.menuTitle, { color: themeColors.textStrong }]}>
                  {t('profile.security.twoFactorTitle')}
                </Text>
                <View style={[styles.providerBadge, { backgroundColor: themeColors.surfaceAlt }]}>
                  <Text style={[styles.providerBadgeText, { color: themeColors.textMuted }]}>Keycloak</Text>
                </View>
              </View>
              <Text style={[styles.menuSub, { color: themeColors.textMuted }]}>
                {t('profile.security.twoFactorSubtitle')}
              </Text>
            </View>
            {openingSecurityAction === 'twoFactor' ? (
              <ActivityIndicator size="small" color={themeColors.primary} />
            ) : (
              <Ionicons name="open-outline" size={18} color={themeColors.textMuted} />
            )}
          </Pressable>
        </Card>

        {/* 2. Station Owner Portal / Promotion Card */}
        <View
          style={[
            styles.ownerBanner,
            {
              backgroundColor: isDark ? '#113322' : '#D1FAE5',
              borderColor: isDark ? '#1F5C3B' : '#A7F3D0',
            },
          ]}
        >
          <View style={styles.ownerHeader}>
            <Text style={[styles.ownerTitle, { color: themeColors.textStrong }]}>
              {t(
                hasOwnerAccess
                  ? 'profile.ownerBanner.portalTitle'
                  : 'profile.ownerBanner.title',
              )}
            </Text>
            <View style={[styles.ownerIconBadge, { backgroundColor: themeColors.primary }]}>
              <Ionicons
                name={hasOwnerAccess ? 'business-outline' : 'repeat-outline'}
                size={18}
                color={themeColors.textInverse}
              />
            </View>
          </View>

          <Text style={[styles.ownerSubtitle, { color: themeColors.textBody }]}>
            {t(
              hasOwnerAccess
                ? 'profile.ownerBanner.portalSubtitle'
                : 'profile.ownerBanner.subtitle',
            )}
          </Text>

          <Pressable
            style={[
              styles.ownerCtaBtn,
              { backgroundColor: themeColors.primary },
              openingOwnerPortal && styles.ownerCtaBtnDisabled,
            ]}
            disabled={openingOwnerPortal}
            onPress={() => void handleOwnerAction()}
          >
            {openingOwnerPortal ? (
              <ActivityIndicator size="small" color={themeColors.textInverse} />
            ) : (
              <Text style={[styles.ownerCtaText, { color: themeColors.textInverse }]}>
                {t(
                  hasOwnerAccess
                    ? 'profile.ownerBanner.portalCta'
                    : 'profile.ownerBanner.cta',
                )}
              </Text>
            )}
          </Pressable>
        </View>

        {/* 3. Section: Payment & Wallet ("Thanh toán & Ví") */}
        <Card style={[styles.sectionCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="wallet-outline" size={20} color={themeColors.primary} />
            <Text style={[styles.sectionTitle, { color: themeColors.textStrong }]}>
              {t('profile.wallet.sectionTitle')}
            </Text>
          </View>

          {/* Wallet Balance Display & Top-up CTA */}
          <View style={styles.balanceContainer}>
            <View style={styles.balanceLeft}>
              <Text style={[styles.balanceLabel, { color: themeColors.textMuted }]}>
                {t('profile.wallet.currentBalance')}
              </Text>
              <Text style={[styles.balanceAmount, { color: themeColors.primaryDark }]}>
                {walletBalance.toLocaleString('vi-VN')}đ
              </Text>
            </View>

            <Pressable
              style={[
                styles.topUpBtn,
                { borderColor: themeColors.primary, backgroundColor: themeColors.surface },
              ]}
              onPress={() => setTopUpVisible(true)}
            >
              <Text style={[styles.topUpBtnText, { color: themeColors.primary }]}>
                {t('profile.wallet.topUp')}
              </Text>
            </Pressable>
          </View>

          <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

          {/* List Item: Payment Methods */}
          <Pressable
            style={styles.menuRow}
            onPress={() => Alert.alert(t('profile.wallet.paymentMethods'), 'Visa, Mastercard, MoMo, ZaloPay')}
          >
            <View style={[styles.menuIconTile, { backgroundColor: isDark ? '#1E293B' : '#EFF6FF' }]}>
              <Ionicons name="card-outline" size={20} color={themeColors.info} />
            </View>
            <View style={styles.menuTextContent}>
              <Text style={[styles.menuTitle, { color: themeColors.textStrong }]}>
                {t('profile.wallet.paymentMethods')}
              </Text>
              <Text style={[styles.menuSub, { color: themeColors.textMuted }]}>
                {t('profile.wallet.paymentMethodsSub')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

          {/* List Item: Transaction History */}
          <Pressable style={styles.menuRow} onPress={handleOpenHistory}>
            <View style={[styles.menuIconTile, { backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF' }]}>
              <Ionicons name="time-outline" size={20} color={isDark ? '#818CF8' : '#6366F1'} />
            </View>
            <View style={styles.menuTextContent}>
              <Text style={[styles.menuTitle, { color: themeColors.textStrong }]}>
                {t('profile.wallet.history')}
              </Text>
              <Text style={[styles.menuSub, { color: themeColors.textMuted }]}>
                {t('profile.wallet.historySub')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
          </Pressable>
        </Card>

        {/* 4. Section: App Settings ("Cài đặt ứng dụng") */}
        <Card style={[styles.sectionCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="settings-outline" size={20} color={themeColors.primary} />
            <Text style={[styles.sectionTitle, { color: themeColors.textStrong }]}>
              {t('profile.appSettings.sectionTitle')}
            </Text>
          </View>

          {/* List Item: Notifications */}
          <Pressable
            style={styles.menuRow}
            onPress={() => void handleNotificationSettings()}
          >
            <View style={[styles.menuIconTile, { backgroundColor: isDark ? '#431407' : '#FFF7ED' }]}>
              <Ionicons name="notifications-outline" size={20} color="#F97316" />
            </View>
            <View style={styles.menuTextContent}>
              <Text style={[styles.menuTitle, { color: themeColors.textStrong }]}>
                {t('profile.appSettings.notifications')}
              </Text>
              <Text style={[styles.menuSub, { color: themeColors.textMuted }]}>
                {t('profile.appSettings.notificationsSub')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

          {/* List Item: Language */}
          <Pressable
            style={styles.menuRow}
            onPress={() => {
              setSettingsSection('language');
              setSettingsVisible(true);
            }}
          >
            <View style={[styles.menuIconTile, { backgroundColor: isDark ? '#2E1065' : '#F5F3FF' }]}>
              <Ionicons name="language-outline" size={20} color="#8B5CF6" />
            </View>
            <View style={styles.menuTextContent}>
              <Text style={[styles.menuTitle, { color: themeColors.textStrong }]}>
                {t('profile.appSettings.language')}
              </Text>
              <Text style={[styles.menuSub, { color: themeColors.textMuted }]}>
                {i18n.language === 'en' ? 'English' : 'Tiếng Việt'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

          {/* Appearance */}
          <Pressable
            style={styles.menuRow}
            onPress={() => {
              setSettingsSection('appearance');
              setSettingsVisible(true);
            }}
          >
            <View style={[styles.menuIconTile, { backgroundColor: isDark ? '#312E81' : '#EEF2FF' }]}>
              <Ionicons name="contrast-outline" size={20} color="#6366F1" />
            </View>
            <View style={styles.menuTextContent}>
              <Text style={[styles.menuTitle, { color: themeColors.textStrong }]}>
                {t('profile.appSettings.appearance')}
              </Text>
              <Text style={[styles.menuSub, { color: themeColors.textMuted }]}>
                {t('profile.appSettings.appearanceSub')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

          {/* List Item: Help Center */}
          <Pressable
            style={styles.menuRow}
            onPress={() => setSupportVisible(true)}
          >
            <View style={[styles.menuIconTile, { backgroundColor: isDark ? '#172554' : '#EFF6FF' }]}>
              <Ionicons name="help-buoy-outline" size={20} color="#3B82F6" />
            </View>
            <View style={styles.menuTextContent}>
              <Text style={[styles.menuTitle, { color: themeColors.textStrong }]}>
                {t('profile.appSettings.helpCenter')}
              </Text>
              <Text style={[styles.menuSub, { color: themeColors.textMuted }]}>
                {t('profile.appSettings.helpCenterSub')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
          </Pressable>
        </Card>

        {/* 5. Logout Action */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('profile.logout')}
          style={({ pressed }) => [
            styles.logoutBtn,
            {
              backgroundColor: isDark ? '#3B1111' : '#FEF2F2',
              borderColor: themeColors.error,
            },
            pressed && styles.logoutBtnPressed,
          ]}
          onPress={signOut}
        >
          <Ionicons name="log-out-outline" size={20} color={themeColors.error} />
          <Text style={[styles.logoutText, { color: themeColors.error }]}>{t('profile.logout')}</Text>
        </Pressable>

        {/* 6. Version Indicator Footer */}
        <Text style={[styles.versionText, { color: themeColors.textMuted }]}>{t('profile.version')}</Text>
      </ScrollView>

      {/* The global action shows everything; individual rows open only their own setting. */}
      <SettingsModal
        visible={settingsVisible}
        section={settingsSection}
        onClose={() => setSettingsVisible(false)}
      />

      <EditProfileModal
        visible={editProfileVisible}
        onClose={() => setEditProfileVisible(false)}
      />

      <SupportCenterModal
        visible={supportVisible}
        onClose={() => setSupportVisible(false)}
      />

      {/* Wallet Balance Top-up Sheet */}
      <TopUpModal
        visible={topUpVisible}
        onClose={() => setTopUpVisible(false)}
        onSuccess={handleTopUpSuccess}
      />

      {/* Station Owner Info Modal with Notification-style Blur Backdrop */}
      <Modal
        visible={ownerModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setOwnerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={28} tint={isDark ? 'dark' : 'regular'} style={StyleSheet.absoluteFill} />
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOwnerModalVisible(false)} />

          <View style={[styles.modalCard, { backgroundColor: themeColors.surface }]}>
            <View style={[styles.modalIconBox, { backgroundColor: themeColors.primarySoft }]}>
              <Ionicons name="flash-outline" size={28} color={themeColors.primary} />
            </View>
            <Text style={[styles.modalTitle, { color: themeColors.textStrong }]}>
              {t('profile.ownerModal.title')}
            </Text>
            <Text style={[styles.modalBody, { color: themeColors.textBody }]}>
              {t('profile.ownerModal.desc')}
            </Text>

            <AppButton
              label={t('profile.ownerModal.understood')}
              onPress={() => setOwnerModalVisible(false)}
              style={{ marginTop: spacing.md }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },

  // 1. User Card
  userCard: {
    padding: spacing.lg,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fontSizes.title,
    fontWeight: fontWeights.bold,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  userName: {
    fontSize: fontSizes.heading,
    fontWeight: fontWeights.bold,
  },
  userEmail: {
    fontSize: fontSizes.body,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldBadge: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  goldBadgeText: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.5,
  },

  // 2. Become Station Owner Banner
  ownerBanner: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
  },
  ownerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ownerTitle: {
    fontSize: fontSizes.heading,
    fontWeight: fontWeights.bold,
  },
  ownerIconBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerSubtitle: {
    fontSize: fontSizes.body,
    lineHeight: 20,
  },
  ownerCtaBtn: {
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  ownerCtaText: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  ownerCtaBtnDisabled: {
    opacity: 0.7,
  },

  // 3 & 4. Section Card
  sectionCard: {
    padding: 0,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSizes.heading,
    fontWeight: fontWeights.semibold,
  },

  // Balance Container
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  balanceLeft: {
    gap: 2,
  },
  balanceLabel: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: fontSizes.title,
    fontWeight: fontWeights.bold,
  },
  topUpBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1.5,
  },
  topUpBtnText: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },

  // Menu List Rows
  divider: {
    height: 1,
    marginHorizontal: spacing.lg,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  menuRowDisabled: { opacity: 0.65 },
  menuIconTile: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextContent: {
    flex: 1,
    gap: 2,
  },
  menuTitle: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
  },
  menuTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  providerBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  providerBadgeText: { fontSize: 10, fontWeight: fontWeights.semibold },
  menuSub: {
    fontSize: fontSizes.caption,
  },

  // Logout Button
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  logoutBtnPressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
  logoutText: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },

  // Version
  versionText: {
    fontSize: 11,
    fontWeight: fontWeights.medium,
    textAlign: 'center',
    letterSpacing: 0.8,
  },

  // Owner Modal
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    zIndex: 10,
  },
  modalIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  modalTitle: {
    fontSize: fontSizes.heading,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
  },
  modalBody: {
    fontSize: fontSizes.body,
    textAlign: 'center',
    lineHeight: 22,
  },
});

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return `${parts[0]?.[0] ?? ''}${parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : ''}`.toUpperCase();
}

function formatPhoneForDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('84') && digits.length === 11) {
    return `+84 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }
  return phone;
}
