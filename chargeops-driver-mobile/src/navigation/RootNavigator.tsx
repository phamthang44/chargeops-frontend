import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '@/context/AuthContext';
import { colors, fontWeights } from '@/theme';
import { LoginScreen } from '@/screens/LoginScreen';
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
        }}
      >
        {session ? (
          <>
            <Stack.Screen name="Tabs" component={BottomTabs} options={{ headerShown: false }} />
            <Stack.Screen
              name="StationDetail"
              component={StationDetailScreen}
              options={{ title: 'Chi tiết trạm' }}
            />
            <Stack.Screen
              name="SlotPicker"
              component={SlotPickerScreen}
              options={{ title: 'Chọn khung giờ' }}
            />
            <Stack.Screen
              name="QRCheckIn"
              component={QRCheckInScreen}
              options={{ title: 'Quét QR Check-in' }}
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
