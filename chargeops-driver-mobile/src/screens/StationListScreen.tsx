import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import {
  FloatingViewSwitch,
  NotificationSheet,
  RegionSelectorSheet,
  SettingsModal,
  StationCardV2,
  StationFilterDrawer,
  StationListEmptyState,
  StationListFooter,
  StationListHeader,
  StationListHeaderSection,
  StationSortSheet,
  useTabBarInset,
  useTabBarScroll,
} from '@/components';
import { usePreferences } from '@/context/PreferencesContext';
import { useStationList } from '@/hooks/useStationList';
import type { RootStackParamList } from '@/navigation/types';
import { spacing } from '@/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * "Tìm trạm" tab — home / discovery list with EV Superapp visual design.
 */
export function StationListScreen() {
  const navigation = useNavigation<Nav>();
  const { themeColors } = usePreferences();
  const tabInset = useTabBarInset();
  const tabBarScroll = useTabBarScroll();

  const {
    // Provinces / Location selector
    selectedProvinceCode,
    selectedRegionName,
    regionModalOpen,
    setRegionModalOpen,
    regionSearch,
    setRegionSearch,
    filteredProvinces,
    handleSelectProvince,

    // Search query & filters
    query,
    setQuery,
    filterState,
    setFilterState,
    handleClearFilters,
    drawerOpen,
    setDrawerOpen,

    // Sort
    sort,
    setSort,
    sortOpen,
    setSortOpen,

    // Sheet states
    notifOpen,
    setNotifOpen,
    settingsOpen,
    setSettingsOpen,
    promoDismissed,
    setPromoDismissed,

    // Notifications & quick booking
    unreadCount,
    quickBookingId,
    handleQuickBook,
    onNotificationNavigate,

    // Stations list data
    stations,
    loading,
    refreshing,
    error,
    total,
    hasMore,
    loadingMore,
    loadMore,
    onRefresh,
    retry,
  } = useStationList();

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Top Header with EV Superapp Visual Design, Location, Search & Filter Capsules */}
      <StationListHeader
        unreadCount={unreadCount}
        onOpenTickets={() => navigation.navigate('MyTickets')}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenNotifications={() => setNotifOpen(true)}
        selectedProvinceCode={selectedProvinceCode}
        selectedRegionName={selectedRegionName}
        onOpenRegionModal={() => {
          setRegionSearch('');
          setRegionModalOpen(true);
        }}
        query={query}
        onChangeQuery={setQuery}
        onOpenDrawer={() => setDrawerOpen(true)}
        filterState={filterState}
        onUpdateFilters={setFilterState}
        onClearFilters={handleClearFilters}
      />

      {/* Station List with StationCardV2 */}
      <FlatList
        style={styles.list}
        {...tabBarScroll}
        contentContainerStyle={[styles.content, { paddingBottom: tabInset + 40 }]}
        showsVerticalScrollIndicator={false}
        data={loading || error ? [] : stations}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => (
          <StationCardV2
            station={item}
            onOpen={() =>
              navigation.navigate('StationDetail', {
                stationId: item.id,
                distanceKm: item.distanceKm,
              })
            }
            onDirections={() => navigation.navigate('Tabs', { screen: 'Map' })}
            isQuickBooking={quickBookingId === item.id}
            onQuickBook={() => handleQuickBook(item.id, navigation)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeColors.primary}
            colors={[themeColors.primary]}
          />
        }
        ListHeaderComponent={
          <StationListHeaderSection
            error={error}
            loading={loading}
            total={total}
            sort={sort}
            promoDismissed={promoDismissed}
            onDismissPromo={() => setPromoDismissed(true)}
            onOpenSort={() => setSortOpen(true)}
          />
        }
        ListEmptyComponent={
          <StationListEmptyState
            error={error}
            loading={loading}
            onRetry={retry}
          />
        }
        ListFooterComponent={
          <StationListFooter
            loading={loading}
            error={error}
            hasMore={hasMore}
            loadingMore={loadingMore}
            shownCount={stations.length}
            totalCount={total}
            onLoadMore={loadMore}
          />
        }
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={11}
        removeClippedSubviews
      />

      {/* Floating Map/List View Switch */}
      <FloatingViewSwitch
        currentView="list"
        onToggle={() => navigation.navigate('Tabs', { screen: 'Map' })}
        bottomOffset={tabInset + 14}
      />

      {/* Sort sheet */}
      <StationSortSheet
        visible={sortOpen}
        onClose={() => setSortOpen(false)}
        currentSort={sort}
        onSelectSort={setSort}
      />

      {/* Notifications sheet */}
      <NotificationSheet
        visible={notifOpen}
        onClose={() => setNotifOpen(false)}
        onNavigate={(n) => onNotificationNavigate(n, navigation)}
      />

      {/* Settings modal (theme, language, support & demo simulation) */}
      <SettingsModal
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onOpenTickets={() => navigation.navigate('MyTickets')}
        onOpenNotifications={() => setNotifOpen(true)}
      />

      {/* Discovery Advanced Filter Drawer */}
      <StationFilterDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={filterState}
        onApply={setFilterState}
        onReset={handleClearFilters}
        totalResults={total}
      />

      {/* Region Selector Bottom Sheet */}
      <RegionSelectorSheet
        visible={regionModalOpen}
        onClose={() => setRegionModalOpen(false)}
        provinces={filteredProvinces}
        selectedProvinceCode={selectedProvinceCode}
        searchValue={regionSearch}
        onSearchChange={setRegionSearch}
        onSelectProvince={handleSelectProvince}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
});
