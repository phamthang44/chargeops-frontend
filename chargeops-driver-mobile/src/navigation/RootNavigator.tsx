import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '@/context/AuthContext';
import { colors, fontWeights } from '@/theme';
import { BookingConfirmationScreen } from '@/screens/BookingConfirmationScreen';
import { BookingDetailScreen } from '@/screens/BookingDetailScreen';
import { BookingSuccessScreen } from '@/screens/BookingSuccessScreen';
import { ChargingSessionScreen } from '@/screens/ChargingSessionScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { PaymentProcessingScreen } from '@/screens/PaymentProcessingScreen';
import { OtpVerificationScreen } from '@/screens/OtpVerificationScreen';
import { QRCheckInScreen } from '@/screens/QRCheckInScreen';
import { RegisterScreen } from '@/screens/RegisterScreen';
import { SlotPickerScreen } from '@/screens/SlotPickerScreen';
import { StationDetailScreen } from '@/screens/StationDetailScreen';
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
  const { session } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.textStrong, fontWeight: fontWeights.semibold },
          contentStyle: { backgroundColor: colors.background },
          // Chevron-only back button (no previous-screen title text).
          headerBackButtonDisplayMode: 'minimal',
        }}
      >
        {session ? (
          <>
            <Stack.Screen name="Tabs" component={BottomTabs} options={{ headerShown: false }} />
            <Stack.Screen
              name="StationDetail"
              component={StationDetailScreen}
              // Header hidden: the screen draws its own glass back button over the hero image.
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="SlotPicker"
              component={SlotPickerScreen}
              // Custom in-screen header (own back button) for reliable touch handling.
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="BookingConfirmation"
              component={BookingConfirmationScreen}
              // Custom in-screen header (own back button), matching SlotPicker.
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="PaymentProcessing"
              component={PaymentProcessingScreen}
              // Blocking "waiting for payment" state; no back/swipe mid-transaction.
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen
              name="BookingSuccess"
              component={BookingSuccessScreen}
              // Full-screen success state; no back button (can't undo a payment).
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen
              name="BookingDetail"
              component={BookingDetailScreen}
              // Custom in-screen header drawn over the station hero image.
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="QRCheckIn"
              component={QRCheckInScreen}
              // Full-screen dark scanner; custom in-screen close button.
              options={{ headerShown: false, presentation: 'modal' }}
            />
            <Stack.Screen
              name="ChargingSession"
              component={ChargingSessionScreen}
              // Custom in-screen header; no swipe-back (session is in progress).
              options={{ headerShown: false, gestureEnabled: false }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
            <Stack.Screen
              name="OtpVerification"
              component={OtpVerificationScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
