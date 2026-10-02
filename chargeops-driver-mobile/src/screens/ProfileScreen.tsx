import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  AppHeader,
  AvatarUploadModal,
  AvatarViewerModal,
  EditProfileModal,
  HeaderActionBtn,
  PaymentMethodsModal,
  ProfileAccountSection,
  ProfileAppSettingsSection,
  ProfileFooter,
  ProfileOwnerBanner,
  ProfileOwnerModal,
  ProfilePaymentSection,
  ProfileUserCard,
  SettingsModal,
  SupportCenterModal,
  useTabBarInset,
  useTabBarScroll,
} from '@/components';
import { useProfileScreen } from '@/hooks/useProfileScreen';
import { spacing } from '@/theme';

export function ProfileScreen() {
  const { t } = useTranslation();
  const tabInset = useTabBarInset();
  const tabBarScroll = useTabBarScroll();

  const {
    userName,
    userEmail,
    userPhone,
    userAvatar,
    hasOwnerAccess,
    signOut,
    themeColors,
    preferredPaymentMethod,
    savedPaymentMethods,
    language,
    paymentMethodsVisible,
    setPaymentMethodsVisible,
    editProfileVisible,
    setEditProfileVisible,
    avatarModalVisible,
    setAvatarModalVisible,
    avatarViewerVisible,
    setAvatarViewerVisible,
    settingsVisible,
    setSettingsVisible,
    settingsSection,
    openSettingsWithSection,
    supportVisible,
    setSupportVisible,
    ownerModalVisible,
    setOwnerModalVisible,
    openingOwnerPortal,
    openingSecurityAction,
    handleOpenHistory,
    handleOwnerAction,
    handleOpenSecurity,
    handleNotificationSettings,
  } = useProfileScreen();

  const preferredPaymentTitle =
    savedPaymentMethods.find(
      (m) => m.type === preferredPaymentMethod || m.isDefault,
    )?.title ?? 'Cổng thanh toán trực tuyến';

  return (
    <View style={[styles.container, { backgroundColor: themeColors.surfaceAlt }]}>
      {/* AppHeader with EV Superapp Visuals */}
      <AppHeader
        title={t('profile.title')}
        icon="person-outline"
        slogan={[t('profile.slogan1', 'Thành viên ChargeOps'), t('profile.slogan2', 'Tiện ích toàn diện')]}
        trailing={
          <HeaderActionBtn
            icon="settings-outline"
            onPress={() => openSettingsWithSection('all')}
            accessibilityLabel={t('settings.title')}
          />
        }
      />

      <ScrollView
        {...tabBarScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabInset }]}
      >
        {/* 1. User Profile Header Card */}
        <ProfileUserCard
          userName={userName}
          userEmail={userEmail}
          userAvatar={userAvatar}
          onPressAvatar={() => {
            if (userAvatar) {
              setAvatarViewerVisible(true);
            } else {
              setAvatarModalVisible(true);
            }
          }}
          onPressCamera={() => setAvatarModalVisible(true)}
          onPressEdit={() => setEditProfileVisible(true)}
        />

        {/* 2. Account & Keycloak Security Section */}
        <ProfileAccountSection
          userAvatar={userAvatar}
          userPhone={userPhone}
          userEmail={userEmail}
          openingSecurityAction={openingSecurityAction}
          onPressAvatar={() => setAvatarModalVisible(true)}
          onPressPhone={() => setEditProfileVisible(true)}
          onPressSecurity={handleOpenSecurity}
        />

        {/* 3. Station Owner Portal / Promotion Card */}
        <ProfileOwnerBanner
          hasOwnerAccess={hasOwnerAccess}
          openingOwnerPortal={openingOwnerPortal}
          onPress={handleOwnerAction}
        />

        {/* 4. Payment & Wallet Section */}
        <ProfilePaymentSection
          savedPaymentMethodsCount={savedPaymentMethods.length}
          preferredPaymentTitle={preferredPaymentTitle}
          onPressPaymentMethods={() => setPaymentMethodsVisible(true)}
          onPressHistory={handleOpenHistory}
        />

        {/* 5. App Settings Section */}
        <ProfileAppSettingsSection
          language={language}
          onPressNotifications={handleNotificationSettings}
          onPressLanguage={() => openSettingsWithSection('language')}
          onPressAppearance={() => openSettingsWithSection('appearance')}
          onPressHelpCenter={() => setSupportVisible(true)}
        />

        {/* 6. Logout & Version Footer */}
        <ProfileFooter onSignOut={signOut} />
      </ScrollView>

      {/* Global & Specific Settings Modal */}
      <SettingsModal
        visible={settingsVisible}
        section={settingsSection}
        onClose={() => setSettingsVisible(false)}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={editProfileVisible}
        onClose={() => setEditProfileVisible(false)}
      />

      {/* Avatar Upload Modal */}
      <AvatarUploadModal
        visible={avatarModalVisible}
        onClose={() => setAvatarModalVisible(false)}
        currentAvatarUrl={userAvatar}
        displayName={userName}
      />

      {/* Avatar Viewer Modal */}
      <AvatarViewerModal
        visible={avatarViewerVisible}
        onClose={() => setAvatarViewerVisible(false)}
        avatarUrl={userAvatar}
        displayName={userName}
        onEdit={() => setAvatarModalVisible(true)}
      />

      {/* Support Center Modal */}
      <SupportCenterModal
        visible={supportVisible}
        onClose={() => setSupportVisible(false)}
      />

      {/* Payment Methods Management Modal */}
      <PaymentMethodsModal
        visible={paymentMethodsVisible}
        onClose={() => setPaymentMethodsVisible(false)}
      />

      {/* Station Owner Info Modal */}
      <ProfileOwnerModal
        visible={ownerModalVisible}
        onClose={() => setOwnerModalVisible(false)}
      />
    </View>
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
});
