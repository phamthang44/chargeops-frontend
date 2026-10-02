import React from 'react';
import { StyleSheet, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { radius, spacing } from '@/theme';

export function SkeletonCard() {
  const { isDark } = usePreferences();
  const bgPlaceholder = isDark ? '#1F2625' : '#F3F4F6';

  return (
    <View
      style={[
        styles.skelCard,
        {
          backgroundColor: isDark ? '#161B1A' : '#FFFFFF',
          borderColor: isDark ? '#2A312F' : '#E5E7EB',
        },
      ]}
    >
      <View style={styles.skelTop}>
        <View style={[styles.skelThumb, { backgroundColor: bgPlaceholder }]} />
        <View style={styles.skelBody}>
          <View style={[styles.skelLine, { width: '40%', height: 16, backgroundColor: bgPlaceholder }]} />
          <View style={[styles.skelLine, { width: '80%', height: 14, backgroundColor: bgPlaceholder }]} />
          <View style={[styles.skelLine, { width: '60%', height: 12, backgroundColor: bgPlaceholder }]} />
        </View>
      </View>
      <View style={[styles.skelMiddle, { backgroundColor: isDark ? '#111514' : '#F9FAFB' }]} />
      <View style={styles.skelActions}>
        <View style={[styles.skelBtn, { backgroundColor: bgPlaceholder }]} />
        <View style={[styles.skelBtn, { backgroundColor: bgPlaceholder }]} />
      </View>
    </View>
  );
}

export function StationListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.skelWrap}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skelWrap: { gap: spacing.md },
  skelCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md + 2,
    gap: spacing.md,
  },
  skelTop: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  skelThumb: { width: 72, height: 72, borderRadius: radius.md },
  skelBody: { flex: 1, gap: spacing.sm },
  skelLine: { borderRadius: radius.sm },
  skelMiddle: { height: 36, borderRadius: radius.md },
  skelActions: { flexDirection: 'row', gap: spacing.sm },
  skelBtn: { flex: 1, height: 38, borderRadius: radius.md },
});
