import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';

import { colors, fontSizes } from '@/theme';
import { BookingHistoryScreen } from '@/screens/BookingHistoryScreen';
import { BookingsScreen } from '@/screens/BookingsScreen';
import { MapScreen } from '@/screens/MapScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { StationListScreen } from '@/screens/StationListScreen';
import type { BottomTabParamList } from './types';

const Tab = createBottomTabNavigator<BottomTabParamList>();

/** Bottom tabs (5): Tìm trạm / Bản đồ / Đặt chỗ / Lịch sử / Hồ sơ. */
export function BottomTabs() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.textStrong },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: fontSizes.caption },
      }}
    >
      <Tab.Screen
        name="StationList"
        component={StationListScreen}
        options={{
          title: t('nav.stationList'),
          // Screen draws its own app bar (ChargeOps + TÀI XẾ); hide the default tab header.
          headerShown: false,
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
          tabBarIcon: ({ color, size }) => <Ionicons name="bookmark-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="BookingHistory"
        component={BookingHistoryScreen}
        options={{
          title: t('nav.history'),
          // Screen draws its own header (logo + TÀI XẾ + segmented tabs).
          headerShown: false,
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
