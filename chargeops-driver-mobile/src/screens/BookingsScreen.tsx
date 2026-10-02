import { useTranslation } from 'react-i18next';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import {
  AppHeader,
  BookingCard,
  BookingsActionButton,
  BookingsChargingBanner,
  BookingsChargingHero,
  BookingsEmptyState,
  BookingsPendingBanner,
  BookingsSegmentTabs,
  BookingsUpcomingHero,
  HeaderActionBtn,
  SettingsModal,
  useTabBarInset,
  useTabBarScroll,
} from '@/components';
import { usePreferences } from '@/context/PreferencesContext';
import { useBookingsScreen } from '@/hooks/useBookingsScreen';
import { spacing } from '@/theme';

/**
 * "Đặt chỗ" tab — active & upcoming bookings with server-driven capabilities (BKG-021).
 */
export function BookingsScreen() {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();
  const tabInset = useTabBarInset();
  const tabBarScroll = useTabBarScroll();

  const {
    loading,
    refreshing,
    tab,
    setTab,
    settingsOpen,
    setSettingsOpen,
    now,
    charging,
    upcoming,
    hero,
    chargingHero,
    list,
    isEmpty,
    loadData,
    onAction,
    goToDetail,
    goToChargingSession,
    goToQRCheckIn,
    goToHistory,
  } = useBookingsScreen();

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <AppHeader
        title={t('bookings.title')}
        icon="flash"
        slogan={[t('bookings.slogan1', 'Sạc đúng giờ'), t('bookings.slogan2', 'Không chờ đợi')]}
        trailing={
          <>
            <HeaderActionBtn
              icon="settings-outline"
              onPress={() => setSettingsOpen(true)}
              accessibilityLabel={t('settings.title')}
            />
            <HeaderActionBtn
              icon="qr-code-outline"
              onPress={() => {
                const confirmed = upcoming.find((b) => b.status === 'CONFIRMED');
                goToQRCheckIn(confirmed ? confirmed.id : '');
              }}
              accessibilityLabel={t('nav.qrCheckIn', 'Quét QR')}
            />
            <HeaderActionBtn
              icon="time-outline"
              onPress={goToHistory}
              accessibilityLabel={t('nav.history', 'Lịch sử')}
            />
          </>
        }
      />

      {/* Segmented tabs */}
      <BookingsSegmentTabs
        tab={tab}
        upcomingCount={upcoming.length}
        chargingCount={charging.length}
        onSelectTab={setTab}
      />

      {loading ? (
        <ActivityIndicator color={themeColors.primary} style={styles.loader} />
      ) : isEmpty ? (
        <BookingsEmptyState tab={tab} tabInset={tabInset} />
      ) : (
        <ScrollView
          {...tabBarScroll}
          contentContainerStyle={[styles.content, { paddingBottom: tabInset }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadData(true)}
              tintColor={themeColors.primary}
              colors={[themeColors.primary]}
            />
          }
        >
          {tab === 'charging' && chargingHero && (
            <BookingsChargingHero
              booking={chargingHero}
              now={now}
              onPress={() => goToChargingSession(chargingHero.id)}
            />
          )}

          {tab === 'upcoming' && hero && (
            <BookingsUpcomingHero
              booking={hero}
              now={now}
              onPress={() => goToDetail(hero.id)}
              onCheckInPress={() => {
                const canCheckIn = hero.actions?.canCheckIn ?? (new Date(hero.startAt).getTime() - now <= 0);
                if (canCheckIn) {
                  goToQRCheckIn(hero.id);
                } else {
                  goToDetail(hero.id);
                }
              }}
            />
          )}

          {list.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              onPress={() => goToDetail(b.id)}
              action={
                <BookingsActionButton
                  booking={b}
                  now={now}
                  onAction={onAction}
                  onPayNow={() => goToDetail(b.id)}
                />
              }
              banner={
                b.status === 'CHECKED_IN' ? (
                  <BookingsChargingBanner booking={b} now={now} />
                ) : b.status === 'PENDING' ? (
                  <BookingsPendingBanner booking={b} now={now} />
                ) : undefined
              }
              accentColor={
                b.status === 'CHECKED_IN'
                  ? themeColors.info
                  : b.status === 'PENDING'
                  ? themeColors.warning
                  : undefined
              }
            />
          ))}
        </ScrollView>
      )}

      <SettingsModal visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { marginTop: spacing.xl },
  content: { padding: spacing.lg, paddingTop: 0, gap: spacing.md },
});
