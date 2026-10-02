import React from 'react';
import { useTranslation } from 'react-i18next';

import { AppHeader, HeaderActionBtn } from '@/components/AppHeader';
import {
  StationFilterCapsuleBar,
  StationSearchBar,
  type DiscoveryFilterState,
} from '@/components/discovery';
import { StationLocationBar } from './StationLocationBar';

interface StationListHeaderProps {
  unreadCount: number;
  onOpenTickets?: () => void;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  selectedProvinceCode: string;
  selectedRegionName: string;
  onOpenRegionModal: () => void;
  query: string;
  onChangeQuery: (text: string) => void;
  onOpenDrawer: () => void;
  filterState: DiscoveryFilterState;
  onUpdateFilters: (
    updater:
      | DiscoveryFilterState
      | ((prev: DiscoveryFilterState) => DiscoveryFilterState),
  ) => void;
  onClearFilters: () => void;
}

export function StationListHeader({
  unreadCount,
  onOpenTickets,
  onOpenSettings,
  onOpenNotifications,
  selectedProvinceCode,
  selectedRegionName,
  onOpenRegionModal,
  query,
  onChangeQuery,
  onOpenDrawer,
  filterState,
  onUpdateFilters,
  onClearFilters,
}: StationListHeaderProps) {
  const { t } = useTranslation();

  return (
    <AppHeader
      title="Charge"
      accent="Ops"
      icon="flash"
      slogan={[t('stationList.slogan1', 'Sạc xanh hơn'), t('stationList.slogan2', 'Hành trình xa hơn')]}
      trailing={
        <>
          <HeaderActionBtn
            icon="settings-outline"
            onPress={onOpenSettings}
            accessibilityLabel={t('settings.title')}
          />
          <HeaderActionBtn
            icon="notifications-outline"
            badgeCount={unreadCount}
            onPress={onOpenNotifications}
            accessibilityLabel={t('stationList.notificationsTitle')}
          />
        </>
      }
    >
      {/* Row 2: Prominent & Touch-friendly Location Selector Bar */}
      <StationLocationBar
        selectedProvinceCode={selectedProvinceCode}
        selectedRegionName={selectedRegionName}
        onPress={onOpenRegionModal}
      />

      {/* Search Bar Capsule with Filter Button on Right */}
      <StationSearchBar
        value={query}
        onChangeText={onChangeQuery}
        placeholder={t('stationList.searchPlaceholder', 'Tìm trạm sạc, địa chỉ…')}
        onPressFilter={onOpenDrawer}
      />

      {/* Quick Filter Capsule Bar */}
      <StationFilterCapsuleBar
        filters={filterState}
        onUpdateFilters={onUpdateFilters}
        onOpenDrawer={onOpenDrawer}
        onClearAll={onClearFilters}
      />
    </AppHeader>
  );
}
