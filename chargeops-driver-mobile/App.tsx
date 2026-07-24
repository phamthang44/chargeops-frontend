import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/i18n'; // initialize i18next before any screen renders
import { AuthProvider } from '@/context/AuthContext';
import { PreferencesProvider, usePreferences } from '@/context/PreferencesContext';
import { RootNavigator } from '@/navigation/RootNavigator';

function AppContent() {
  const { isDark } = usePreferences();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AuthProvider>
        <RootNavigator />
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
