import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { usePreferences } from '@/context/PreferencesContext';
import type { AdministrativeProvince } from '@/services/locationService';
import { fontSizes, radius, spacing } from '@/theme';

interface RegionSelectorSheetProps {
  visible: boolean;
  onClose: () => void;
  provinces: AdministrativeProvince[];
  selectedProvinceCode: string;
  searchValue: string;
  onSearchChange: (text: string) => void;
  onSelectProvince: (province: AdministrativeProvince) => void;
}

export function RegionSelectorSheet({
  visible,
  onClose,
  provinces,
  selectedProvinceCode,
  searchValue,
  onSearchChange,
  onSelectProvince,
}: RegionSelectorSheetProps) {
  const { t } = useTranslation();
  const { isDark } = usePreferences();

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={t('stationList.selectRegionTitle', 'Chọn khu vực trạm sạc')}
    >
      {/* Quick Search within Provinces */}
      <View
        style={[
          styles.modalSearchBox,
          {
            backgroundColor: isDark ? '#1F2625' : '#F8FAFC',
            borderColor: isDark ? '#2A312F' : '#E2E8F0',
          },
        ]}
      >
        <Ionicons name="search" size={16} color="#64748B" />
        <TextInput
          style={[styles.modalSearchInput, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
          placeholder={t('stationList.searchRegionPlaceholder', 'Tìm tỉnh, thành phố...')}
          placeholderTextColor="#94A3B8"
          value={searchValue}
          onChangeText={onSearchChange}
          autoCorrect={false}
        />
        {searchValue.length > 0 && (
          <Pressable hitSlop={6} onPress={() => onSearchChange('')}>
            <Ionicons name="close-circle" size={16} color="#94A3B8" />
          </Pressable>
        )}
      </View>

      <ScrollView style={styles.regionListScroll} showsVerticalScrollIndicator={false}>
        {provinces.map((r) => {
          const selected = selectedProvinceCode === r.code;
          const displayName =
            r.code === 'all' ? t('stationList.allRegions', 'Toàn quốc') : r.name;
          const displayDesc =
            r.code === 'all'
              ? t('stationList.allRegionsDesc', 'Tất cả các tỉnh thành trên toàn quốc')
              : r.fullName || r.name;

          return (
            <Pressable
              key={r.code}
              style={[
                styles.regionItem,
                { borderBottomColor: isDark ? '#2A312F' : '#F1F5F9' },
                selected && { backgroundColor: isDark ? '#113322' : '#F0FDF4' },
              ]}
              onPress={() => onSelectProvince(r)}
            >
              <View style={styles.regionInfo}>
                <Text
                  style={[
                    styles.regionName,
                    { color: selected ? '#00B074' : isDark ? '#F1F5F9' : '#0F172A' },
                  ]}
                >
                  {displayName}
                </Text>
                <Text style={[styles.regionDesc, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  {displayDesc}
                </Text>
              </View>
              {selected && <Ionicons name="checkmark-circle" size={20} color="#00B074" />}
            </Pressable>
          );
        })}
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 42,
    marginBottom: spacing.md,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: fontSizes.body,
    paddingVertical: 0,
  },
  regionListScroll: {
    maxHeight: 380,
  },
  regionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderRadius: radius.md,
  },
  regionInfo: {
    flex: 1,
    marginRight: 10,
  },
  regionName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  regionDesc: {
    fontSize: 12,
  },
});
