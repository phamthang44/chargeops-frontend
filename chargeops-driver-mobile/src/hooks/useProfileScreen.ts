import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import type { RootStackParamList } from '@/navigation/types';
import { openKeycloakSecuritySettings } from '@/services/accountNavigation';
import { openOwnerPortal } from '@/services/portalNavigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function useProfileScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const { session, profile, signOut } = useAuth();
  const {
    themeColors,
    isDark,
    preferredPaymentMethod,
    savedPaymentMethods,
  } = usePreferences();

  // Modals visibility
  const [paymentMethodsVisible, setPaymentMethodsVisible] = useState(false);
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [avatarViewerVisible, setAvatarViewerVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [settingsSection, setSettingsSection] = useState<'all' | 'language' | 'appearance'>('all');
  const [supportVisible, setSupportVisible] = useState(false);
  const [ownerModalVisible, setOwnerModalVisible] = useState(false);

  // Async action loading states
  const [openingOwnerPortal, setOpeningOwnerPortal] = useState(false);
  const [openingSecurityAction, setOpeningSecurityAction] = useState<'password' | 'twoFactor' | null>(null);

  // Derived user details
  const userName = profile?.displayName ?? session?.user.name ?? t('profile.account.unknownName');
  const userEmail = profile?.email ?? session?.user.email ?? '';
  const userPhone = profile?.phone ?? session?.user.phone ?? '';
  const userAvatar = profile?.avatarUrl ?? session?.user.avatarUrl ?? null;
  const hasOwnerAccess = session?.grantedRoles.includes('OWNER') ?? false;

  function handleOpenHistory() {
    navigation.navigate('Tabs', { screen: 'BookingHistory' });
  }

  function openSettingsWithSection(section: 'all' | 'language' | 'appearance') {
    setSettingsSection(section);
    setSettingsVisible(true);
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

  return {
    // Current user & auth
    session,
    profile,
    userName,
    userEmail,
    userPhone,
    userAvatar,
    hasOwnerAccess,
    signOut,

    // Preferences
    themeColors,
    isDark,
    preferredPaymentMethod,
    savedPaymentMethods,
    language: i18n.language,

    // Modals visibility & setters
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

    // Async states & handlers
    openingOwnerPortal,
    openingSecurityAction,
    handleOpenHistory,
    handleOwnerAction,
    handleOpenSecurity,
    handleNotificationSettings,
  };
}
