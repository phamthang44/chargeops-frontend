import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Platform, View } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { fontWeights } from '@/theme';
import { BookingConfirmationScreen } from '@/screens/BookingConfirmationScreen';
import { BookingDetailScreen } from '@/screens/BookingDetailScreen';
import { BookingSuccessScreen } from '@/screens/BookingSuccessScreen';
import { ChargingSessionScreen } from '@/screens/ChargingSessionScreen';
import { CompleteProfileScreen } from '@/screens/CompleteProfileScreen';
import { KeycloakLoginScreen } from '@/screens/KeycloakLoginScreen';
import { PaymentProcessingScreen } from '@/screens/PaymentProcessingScreen';
import { OtpVerificationScreen } from '@/screens/OtpVerificationScreen';
import { ProfileBootstrapErrorScreen } from '@/screens/ProfileBootstrapErrorScreen';
import { QRCheckInScreen } from '@/screens/QRCheckInScreen';
import { RegisterScreen } from '@/screens/RegisterScreen';
import { StationDetailScreen } from '@/screens/StationDetailScreen';
import { TimeRangePickerScreen } from '@/screens/TimeRangePickerScreen';
import { WelcomeScreen } from '@/screens/WelcomeScreen';
import { BottomTabs } from './BottomTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Root navigator. The visible stack is driven by auth state:
 * - signed out -> auth stack (Welcome -> Login -> Register -> OtpVerification)
 * - signed in  -> app stack (Tabs + booking flow)
 *
 * On sign in/out the session changes and React Navigation swaps the stack, so
 * screens never need to imperatively navigate to/from the tabs.
 */
export function RootNavigator() {
  const { t } = useTranslation();
  const { initializing, session, profile, profileStatus } = useAuth();
  const { themeColors } = usePreferences();
  const hasKeycloakCallback =
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    (new URLSearchParams(window.location.search).has('code') ||
      new URLSearchParams(window.location.search).has('error'));

  const loadingProfile =
    Boolean(session) && (profileStatus === 'idle' || profileStatus === 'loading');

  if (initializing || loadingProfile) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: themeColors.background,
        }}
      >
        <ActivityIndicator color={themeColors.primary} />
      </View>
    );
  }

  if (session && profileStatus === 'error') {
    return <ProfileBootstrapErrorScreen />;
  }

  const profileCompleted = profile?.profileCompleted === true;

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={
          session
            ? profileCompleted
              ? 'Tabs'
              : 'CompleteProfile'
            : hasKeycloakCallback
              ? 'Login'
              : 'Welcome'
        }
        screenOptions={{
          headerStyle: { backgroundColor: themeColors.surface },
          headerTintColor: themeColors.primary,
          headerTitleStyle: {
            color: themeColors.textStrong,
            fontWeight: fontWeights.semibold,
          },
          contentStyle: { backgroundColor: themeColors.background },
          // Chevron-only back button (no previous-screen title text).
          headerBackButtonDisplayMode: 'minimal',
        }}
      >
        {session ? profileCompleted ? (
          <>
            <Stack.Screen
              name="Tabs"
              component={BottomTabs}
              options={{ headerShown: false, title: t('nav.stationList') }}
            />
            <Stack.Screen
              name="StationDetail"
              component={StationDetailScreen}
              // Header hidden: the screen draws its own glass back button over the hero image.
              options={{ headerShown: false, title: t('nav.stationDetail') }}
            />
            <Stack.Screen
              name="TimeRangePicker"
              component={TimeRangePickerScreen}
              // Custom in-screen header (own back button) for reliable touch handling.
              options={{ headerShown: false, title: t('nav.timeRangePicker') }}
            />
            <Stack.Screen
              name="BookingConfirmation"
              component={BookingConfirmationScreen}
              // Custom in-screen header (own back button), matching TimeRangePicker.
              options={{ headerShown: false, title: t('bookingConfirmation.title') }}
            />
            <Stack.Screen
              name="PaymentProcessing"
              component={PaymentProcessingScreen}
              // Blocking "waiting for payment" state; no back/swipe mid-transaction.
              options={{ headerShown: false, gestureEnabled: false, title: t('paymentProcessing.processingTitle') }}
            />
            <Stack.Screen
              name="BookingSuccess"
              component={BookingSuccessScreen}
              // Full-screen success state; no back button (can't undo a payment).
              options={{ headerShown: false, gestureEnabled: false, title: t('bookingSuccess.title') }}
            />
            <Stack.Screen
              name="BookingDetail"
              component={BookingDetailScreen}
              // Custom in-screen header drawn over the station hero image.
              options={{ headerShown: false, title: t('bookingDetail.title') }}
            />
            <Stack.Screen
              name="QRCheckIn"
              component={QRCheckInScreen}
              // Full-screen dark scanner; custom in-screen close button.
              options={{ headerShown: false, presentation: 'modal', title: t('nav.qrCheckIn') }}
            />
            <Stack.Screen
              name="ChargingSession"
              component={ChargingSessionScreen}
              // Custom in-screen header; no swipe-back (session is in progress).
              options={{
                headerShown: false,
                gestureEnabled: false,
                title: t('chargingSession.title', { defaultValue: 'Phiên sạc' }),
              }}
            />
          </>
        ) : (
          <Stack.Screen
            name="CompleteProfile"
            component={CompleteProfileScreen}
            options={{ headerShown: false, gestureEnabled: false, title: t('completeProfile.title') }}
          />
        ) : (
          <>
            <Stack.Screen
              name="Welcome"
              component={WelcomeScreen}
              options={{ headerShown: false, title: t('welcome.title') }}
            />
            <Stack.Screen
              name="Login"
              component={KeycloakLoginScreen}
              options={{ headerShown: false, title: t('login.headerTitle') }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ headerShown: false, title: t('register.headerTitle') }}
            />
            <Stack.Screen
              name="OtpVerification"
              component={OtpVerificationScreen}
              options={{ headerShown: false, title: t('otp.headerTitle') }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
