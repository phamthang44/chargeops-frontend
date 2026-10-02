import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { usePreferences } from '@/context/PreferencesContext';
import { radius, spacing } from '@/theme';

export function FastTrackBanner() {
  const { t } = useTranslation();
  const { isDark } = usePreferences();

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: isDark ? 'rgba(16, 185, 129, 0.16)' : '#ECFDF5',
          borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : '#A7F3D0',
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.25)' : '#D1FAE5',
          },
        ]}
      >
        <Ionicons name="flash" size={18} color="#10B981" />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: isDark ? '#34D399' : '#047857' }]}>
          {t('bookingConfirmation.fastTrackTitle', '⚡ Đặt chỗ nhanh (1-Click)')}
        </Text>
        <Text style={[styles.desc, { color: isDark ? '#A7F3D0' : '#065F46' }]}>
          {t(
            'bookingConfirmation.fastTrackDesc',
            'Đã tự động chọn cổng khả dụng tốt nhất & khung giờ sạc sớm nhất.'
          )}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  title: { fontSize: 13, fontWeight: '700' },
  desc: { fontSize: 12, marginTop: 2 },
});
