import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { GlassButton } from '@/components/GlassButton';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import { getStationHeroUrl } from '@/utils/imagekit';

interface StationHeroGalleryProps {
  title?: string;
  imageUrl?: string | null;
  images?: string[];
  slide?: number;
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  isFav: boolean;
  onToggleFav: () => void;
  onBack: () => void;
  insetsTop: number;
}

export function StationHeroGallery({
  title,
  imageUrl,
  images,
  slide,
  onScroll,
  isFav,
  onToggleFav,
  onBack,
  insetsTop,
}: StationHeroGalleryProps) {
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();
  const { width } = useWindowDimensions();

  const displayImages =
    images && images.length > 0
      ? images
      : imageUrl
        ? [imageUrl]
        : [];

  const [currentSlide, setCurrentSlide] = useState(slide ?? 0);

  useEffect(() => {
    if (slide !== undefined && slide !== currentSlide) {
      setCurrentSlide(slide);
    }
  }, [slide]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const slideWidth = e.nativeEvent.layoutMeasurement?.width || width;
      if (slideWidth > 0 && displayImages.length > 0) {
        const offset = e.nativeEvent.contentOffset.x;
        const newSlide = Math.max(
          0,
          Math.min(displayImages.length - 1, Math.round(offset / slideWidth)),
        );
        setCurrentSlide(newSlide);
      }
      onScroll?.(e);
    },
    [width, displayImages.length, onScroll],
  );

  return (
    <View style={[styles.hero, { backgroundColor: isDark ? '#121615' : '#E2E8F0' }]}>
      {/* Floating back & favorite buttons */}
      <View style={[styles.floatingHeader, { top: insetsTop + spacing.sm }]}>
        <GlassButton accessibilityLabel={t('common.back')} onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </GlassButton>
        <View style={styles.titlePill}>
          <Text style={styles.titleText} numberOfLines={1}>
            {title || t('stationDetail.title')}
          </Text>
        </View>
        <GlassButton
          accessibilityLabel={t(isFav ? 'stationDetail.saved' : 'stationDetail.save')}
          onPress={onToggleFav}
        >
          <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={22} color={isFav ? themeColors.error : '#FFFFFF'} />
        </GlassButton>
      </View>

      {/* Hero Carousel */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleScroll}
      >
        {displayImages.length > 0 ? (
          displayImages.map((imgUri, i) => (
            <View key={i} style={[styles.slide, { width }]}>
              <Image
                source={{ uri: getStationHeroUrl(imgUri, 750) }}
                style={styles.heroImage}
                resizeMode="cover"
              />
              <View style={styles.heroShade} />
            </View>
          ))
        ) : (
          <View style={[styles.slide, { width }]}>
            <Image
              source={require('../../../assets/header-background.png')}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <View style={styles.heroShade} />
          </View>
        )}
      </ScrollView>

      {/* Pagination dots capsule elevated above overlapping sheet */}
      {displayImages.length > 1 && (
        <View style={styles.dotsWrapper}>
          <View style={styles.dotsPill}>
            {displayImages.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === currentSlide && styles.dotActive]}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 260,
    position: 'relative',
  },
  floatingHeader: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
    pointerEvents: 'box-none',
  },
  titlePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    maxWidth: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  slide: {
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
  dotsWrapper: {
    position: 'absolute',
    bottom: 28,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    pointerEvents: 'none',
  },
  dotsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  dotActive: {
    width: 16,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: '#FFFFFF',
  },
});
