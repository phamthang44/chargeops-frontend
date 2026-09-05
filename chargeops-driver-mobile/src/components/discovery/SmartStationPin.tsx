import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius } from '@/theme';
import type { PinStatus } from '../StationPin';

interface SmartStationPinProps {
  status: PinStatus;
  powerKw?: number;
  availableConnectors: number;
  totalConnectors: number;
  selected?: boolean;
  onPress: () => void;
}

const STATUS_COLORS: Record<PinStatus, { bg: string; border: string; glow: string; text: string }> = {
  available: { bg: '#059669', border: '#34D399', glow: 'rgba(16, 185, 129, 0.45)', text: '#FFFFFF' },
  busy: { bg: '#D97706', border: '#FBBF24', glow: 'rgba(245, 158, 11, 0.45)', text: '#FFFFFF' },
  full: { bg: '#DC2626', border: '#F87171', glow: 'rgba(239, 68, 68, 0.45)', text: '#FFFFFF' },
  closed: { bg: '#4B5563', border: '#9CA3AF', glow: 'rgba(107, 114, 128, 0.3)', text: '#E5E7EB' },
};

/**
 * Smart EV Station Pin for Map view with live telemetry and power ratings.
 * Dynamic theme aware for both Light & Dark modes.
 */
export function SmartStationPin({
  status,
  powerKw,
  availableConnectors,
  totalConnectors,
  selected = false,
  onPress,
}: SmartStationPinProps) {
  const { isDark } = usePreferences();
  const theme = STATUS_COLORS[status];
  const scale = useRef(new Animated.Value(selected ? 1.15 : 1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: selected ? 1.15 : 1,
      friction: 6,
      tension: 100,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [selected, scale]);

  const displayPower = powerKw ? `${Math.round(powerKw)}kW` : '⚡';

  return (
    <Animated.View style={[styles.container, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.bubble,
          {
            backgroundColor: selected ? theme.bg : isDark ? '#161B1A' : '#FFFFFF',
            borderColor: selected ? '#FFFFFF' : theme.border,
            shadowColor: theme.bg,
            shadowOpacity: selected ? 0.6 : 0.25,
            transform: [{ scale: pressed ? 0.94 : 1 }],
          },
        ]}
      >
        {/* Power / Speed Icon Pill */}
        <View
          style={[
            styles.powerPill,
            {
              backgroundColor: selected
                ? 'rgba(255, 255, 255, 0.25)'
                : isDark
                  ? '#1F2625'
                  : '#F3F4F6',
            },
          ]}
        >
          <Ionicons
            name="flash"
            size={11}
            color={selected ? '#FFFFFF' : theme.border}
          />
          <Text
            style={[
              styles.powerText,
              { color: selected ? '#FFFFFF' : isDark ? '#FFFFFF' : '#111827' },
            ]}
          >
            {displayPower}
          </Text>
        </View>

        {/* Slot count tag */}
        <View
          style={[
            styles.slotTag,
            {
              backgroundColor: selected ? '#FFFFFF' : theme.bg,
            },
          ]}
        >
          <Text
            style={[
              styles.slotText,
              { color: selected ? theme.bg : '#FFFFFF' },
            ]}
          >
            {availableConnectors}/{totalConnectors}
          </Text>
        </View>
      </Pressable>

      {/* Pointer needle */}
      <View
        style={[
          styles.needle,
          {
            borderTopColor: selected ? theme.bg : isDark ? '#161B1A' : '#FFFFFF',
          },
        ]}
      />
      {selected && (
        <View style={[styles.pulseRing, { backgroundColor: theme.glow }]} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 6,
    zIndex: 10,
  },
  powerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  powerText: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
  },
  slotTag: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  slotText: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
  },
  needle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    alignSelf: 'center',
    marginTop: -1,
    zIndex: 9,
  },
  pulseRing: {
    position: 'absolute',
    bottom: -4,
    width: 14,
    height: 14,
    borderRadius: radius.full,
    zIndex: 1,
  },
});
