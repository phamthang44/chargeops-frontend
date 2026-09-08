import { registerRootComponent } from 'expo';
import { LogBox, Platform } from 'react-native';

// Suppress known React Native Web deprecation and gesture warnings
const IGNORED_WARNINGS = [
  '"shadow*" style props are deprecated',
  'props.pointerEvents is deprecated',
  'Cannot record touch end without a touch start',
];

LogBox.ignoreLogs(IGNORED_WARNINGS);

if (Platform.OS === 'web' || typeof window !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    const firstArg = typeof args[0] === 'string' ? args[0] : '';
    if (IGNORED_WARNINGS.some((msg) => firstArg.includes(msg))) {
      return;
    }
    originalWarn(...args);
  };
}

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

