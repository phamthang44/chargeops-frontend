import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { StarRating } from '@/components/StarRating';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { Review, Station } from '@/types';
import { formatDate } from '@/utils/format';

interface StationReviewsSectionProps {
  station: Station;
  reviews: Review[];
}

export function StationReviewsSection({
  station,
  reviews,
}: StationReviewsSectionProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Ionicons name="chatbubble-ellipses-outline" size={18} color={themeColors.primary} />
        <Text style={[styles.sectionTitle, { color: themeColors.textStrong }]}>
          {t('stationDetail.reviewsTitle')}
        </Text>
      </View>

      {reviews.length === 0 ? (
        <Text style={[styles.metaMuted, { color: themeColors.textMuted }]}>
          {t('stationDetail.noReviews')}
        </Text>
      ) : (
        <View style={styles.reviewList}>
          {station.rating !== undefined && (
            <View style={[styles.ratingSummary, { backgroundColor: themeColors.surfaceAlt }]}>
              <View style={styles.ratingScoreBlock}>
                <Text style={[styles.ratingBig, { color: themeColors.textStrong }]}>
                  {station.rating.toFixed(1)}
                </Text>
                <Text style={[styles.ratingOutOf, { color: themeColors.textMuted }]}>/5</Text>
              </View>
              <View style={{ flex: 1 }}>
                <StarRating rating={station.rating} size={16} />
                {station.reviewCount !== undefined && (
                  <Text style={[styles.ratingCount, { color: themeColors.textMuted }]}>
                    {t('stationDetail.reviews', { count: station.reviewCount })}
                  </Text>
                )}
              </View>
            </View>
          )}

          {reviews.slice(0, 3).map((r) => {
            const author = r.authorName || r.userName || 'Tài xế';
            const letter = author[0].toUpperCase();
            return (
              <View
                key={r.id}
                style={[
                  styles.reviewCard,
                  { backgroundColor: themeColors.surface, borderColor: themeColors.border },
                ]}
              >
                <View style={styles.reviewHead}>
                  <View style={styles.reviewWho}>
                    <View style={[styles.avatar, { backgroundColor: themeColors.primarySoft }]}>
                      <Text style={[styles.avatarText, { color: themeColors.primaryDark }]}>
                        {letter}
                      </Text>
                    </View>
                    <View>
                      <Text style={[styles.reviewName, { color: themeColors.textStrong }]}>
                        {author}
                      </Text>
                      <Text style={[styles.reviewDate, { color: themeColors.textMuted }]}>
                        {formatDate(r.createdAt)}
                      </Text>
                    </View>
                  </View>
                  <StarRating rating={r.rating} size={13} />
                </View>
                {r.comment ? (
                  <Text style={[styles.reviewComment, { color: themeColors.textBody }]}>
                    {r.comment}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.2,
  },
  metaMuted: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
  },
  reviewList: {
    gap: spacing.md,
  },
  ratingSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  ratingScoreBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  ratingBig: {
    fontSize: 32,
    fontWeight: fontWeights.bold,
  },
  ratingOutOf: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  ratingCount: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    marginTop: 2,
  },
  reviewCard: {
    borderWidth: 1.5,
    borderRadius: radius.lg,
    padding: spacing.md + 2,
    gap: spacing.sm,
  },
  reviewHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewWho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  reviewName: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  reviewDate: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
    marginTop: 1,
  },
  reviewComment: {
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: fontWeights.medium,
  },
});
