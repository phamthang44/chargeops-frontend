import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';

import { FloatingTabBar } from '@/components/FloatingTabBar';
import { usePreferences } from '@/context/PreferencesContext';
import { BookingHistoryScreen } from '@/screens/BookingHistoryScreen';
import { BookingsScreen } from '@/screens/BookingsScreen';
import { MapScreen } from '@/screens/MapScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { StationListScreen } from '@/screens/StationListScreen';
import { fontSizes } from '@/theme';
import type { BottomTabParamList } from './types';

const Tab = createBottomTabNavigator<BottomTabParamList>();

/**
 * Bottom tabs (5): Tìm trạm / Bản đồ / Đặt chỗ / Lịch sử / Hồ sơ
 *
 * Uses the custom `FloatingTabBar` — a frosted-glass floating pill with an
 * elevated emerald FAB for the center "Đặt chỗ" tab. Dynamic theme support.
 */
export function BottomTabs() {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="StationList"
        component={StationListScreen}
        options={{
          title: t('nav.stationList'),
          tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          title: t('nav.map'),
          tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Bookings"
        component={BookingsScreen}
        options={{
          title: t('nav.bookings'),
          tabBarIcon: ({ color, size }) => <Ionicons name="flash-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="BookingHistory"
        component={BookingHistoryScreen}
        options={{
          title: t('nav.history'),
          tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: t('nav.profile'),
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
