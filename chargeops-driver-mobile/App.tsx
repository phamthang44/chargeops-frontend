import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/i18n'; // initialize i18n before any screen renders
import { AuthProvider } from '@/context/AuthContext';
import { PreferencesProvider, usePreferences } from '@/context/PreferencesContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { RootNavigator } from '@/navigation/RootNavigator';
import { StompProvider } from '@/providers/StompProvider';

function AppContent() {
  const { isDark } = usePreferences();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AuthProvider>
        <StompProvider>
          <NotificationProvider>
            <RootNavigator />
          </NotificationProvider>
        </StompProvider>
      </AuthProvider>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PreferencesProvider>
        <AppContent />
      </PreferencesProvider>
    </SafeAreaProvider>
  );
}
