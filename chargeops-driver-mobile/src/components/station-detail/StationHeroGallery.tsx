import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { GlassButton } from '@/components/GlassButton';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';

const { width } = Dimensions.get('window');
const GALLERY: Array<React.ComponentProps<typeof Ionicons>['name']> = [
  'flash',
  'car-sport',
  'shield-checkmark',
];

interface StationHeroGalleryProps {
  title?: string;
  imageUrl?: string | null;
  slide: number;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  isFav: boolean;
  onToggleFav: () => void;
  onBack: () => void;
  insetsTop: number;
}

export function StationHeroGallery({
  title,
  imageUrl,
  slide,
  onScroll,
  isFav,
  onToggleFav,
  onBack,
  insetsTop,
}: StationHeroGalleryProps) {
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();

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
        onMomentumScrollEnd={onScroll}
      >
        {GALLERY.map((icon, i) => (
          <View key={i} style={[styles.slide, { width }]}>
            {i === 0 ? (
              imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.heroImage} resizeMode="cover" />
              ) : (
                <Image
                  source={require('../../../assets/header-background.png')}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
              )
            ) : (
              <>
                <Ionicons name={icon} size={64} color={themeColors.textMuted} />
                <Text style={[styles.heroHint, { color: themeColors.textMuted }]}>
                  {t('stationDetail.photoPending')}
                </Text>
              </>
            )}
            <View style={styles.heroShade} />
          </View>
        ))}
      </ScrollView>

      {/* Pagination dots */}
      <View style={styles.dots}>
        {GALLERY.map((_, i) => (
          <View key={i} style={[styles.dot, i === slide && styles.dotActive]} />
        ))}
      </View>
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
    maxWidth: width * 0.56,
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
    gap: spacing.xs,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
  heroHint: {
    fontSize: fontSizes.caption,
  },
  dots: {
    position: 'absolute',
    bottom: spacing.lg,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  dotActive: {
    width: 16,
    backgroundColor: '#FFFFFF',
  },
});
