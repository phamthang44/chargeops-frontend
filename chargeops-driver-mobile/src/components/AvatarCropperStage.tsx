import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useRef, useState } from 'react';
import {
  GestureResponderEvent,
  Image,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, ClipPath, Defs, Line, Mask, Rect } from 'react-native-svg';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import {
  CROP_CENTER,
  CROP_CIRCLE_DIAMETER,
  CROP_RADIUS,
  CROP_STAGE_SIZE,
  calculateInitialOffset,
  CropOffset,
  MAX_ZOOM,
  MIN_ZOOM,
} from '@/utils/avatarCropUtils';

interface AvatarCropperStageProps {
  imageUri: string;
  aspect: number;
  zoom: number;
  panOffset: CropOffset;
  onZoomChange: (zoom: number | ((prev: number) => number)) => void;
  onPanChange: (offset: CropOffset) => void;
  disabled?: boolean;
}

export function AvatarCropperStage({
  imageUri,
  aspect,
  zoom,
  panOffset,
  onZoomChange,
  onPanChange,
  disabled = false,
}: AvatarCropperStageProps) {
  const { themeColors } = usePreferences();
  const [isDragging, setIsDragging] = useState(false);

  // Synchronous refs to prevent gesture breaks caused by re-render cycles
  const panOffsetRef = useRef<CropOffset>(panOffset);
  panOffsetRef.current = panOffset;
  const dragStartRef = useRef<CropOffset>({ x: 0, y: 0 });

  // PanResponder for mobile touch with stable empty dependencies
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderGrant: () => {
          setIsDragging(true);
          dragStartRef.current = { ...panOffsetRef.current };
        },
        onPanResponderMove: (_: GestureResponderEvent, gestureState) => {
          const nextX = Math.round(dragStartRef.current.x + gestureState.dx);
          const nextY = Math.round(dragStartRef.current.y + gestureState.dy);
          const nextOffset = { x: nextX, y: nextY };
          panOffsetRef.current = nextOffset;
          onPanChange(nextOffset);
        },
        onPanResponderRelease: () => {
          setIsDragging(false);
        },
        onPanResponderTerminate: () => {
          setIsDragging(false);
        },
      }),
    [disabled, onPanChange],
  );

  // Web desktop smooth mouse drag (binds window mousemove/mouseup for continuous 60fps tracking)
  const handleWebMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || disabled) return;
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = panOffsetRef.current.x;
    const initialY = panOffsetRef.current.y;
    setIsDragging(true);

    const onMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      const nextX = Math.round(initialX + dx);
      const nextY = Math.round(initialY + dy);
      const nextOffset = { x: nextX, y: nextY };
      panOffsetRef.current = nextOffset;
      onPanChange(nextOffset);
    };

    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Web desktop mouse wheel zoom (Discord-like intuitive zooming)
  const handleWebWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (Platform.OS !== 'web' || disabled) return;
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    onZoomChange((prev) => {
      return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number((prev + delta).toFixed(2))));
    });
  };

  // Web slider bar direct click
  const handleSliderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (Platform.OS !== 'web' || disabled) return;
    const rect = e.currentTarget?.getBoundingClientRect?.();
    if (rect && rect.width > 0) {
      const clickX = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, clickX / rect.width));
      const nextZoom = Number((MIN_ZOOM + ratio * (MAX_ZOOM - MIN_ZOOM)).toFixed(2));
      onZoomChange(nextZoom);
    }
  };

  // Dimension calculations for viewport
  const baseW = aspect >= 1 ? CROP_CIRCLE_DIAMETER * aspect : CROP_CIRCLE_DIAMETER;
  const baseH = aspect >= 1 ? CROP_CIRCLE_DIAMETER : CROP_CIRCLE_DIAMETER / aspect;
  const currentW = baseW * zoom;
  const currentH = baseH * zoom;
  const sliderPercent = Math.round(((zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * 100);

  return (
    <View style={styles.container}>
      {/* Preset Quick Actions */}
      <View style={styles.presetRow}>
        <Pressable
          style={[
            styles.presetChip,
            { backgroundColor: themeColors.primarySoft, borderColor: themeColors.primary },
          ]}
          onPress={() => {
            const initial = calculateInitialOffset(aspect);
            onPanChange(initial);
          }}
          disabled={disabled}
        >
          <Ionicons name="person-outline" size={13} color={themeColors.primaryDark} />
          <Text style={[styles.presetChipText, { color: themeColors.primaryDark }]}>Căn mặt</Text>
        </Pressable>

        <Pressable
          style={[
            styles.presetChip,
            { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border },
          ]}
          onPress={() => onPanChange({ x: 0, y: 0 })}
          disabled={disabled}
        >
          <Ionicons name="scan-outline" size={13} color={themeColors.textBody} />
          <Text style={[styles.presetChipText, { color: themeColors.textBody }]}>Căn giữa</Text>
        </Pressable>

        <Pressable
          style={[
            styles.presetChip,
            { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border },
          ]}
          onPress={() => {
            onZoomChange(1);
            const initial = calculateInitialOffset(aspect);
            onPanChange(initial);
          }}
          disabled={disabled}
        >
          <Ionicons name="refresh-outline" size={13} color={themeColors.textMuted} />
          <Text style={[styles.presetChipText, { color: themeColors.textMuted }]}>Mặc định</Text>
        </Pressable>
      </View>

      {/* Outer Stage with Image and Circular Punchout Mask */}
      <View
        style={[
          styles.cropStage,
          Platform.select({
            web: {
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
            } as any,
          }),
        ]}
        {...panResponder.panHandlers}
        {...(Platform.OS === 'web'
          ? ({
              onMouseDown: handleWebMouseDown,
              onWheel: handleWebWheel,
            } as any)
          : {})}
      >
        <Image
          source={{ uri: imageUri }}
          style={[
            styles.cropImage,
            {
              width: currentW,
              height: currentH,
              left: (CROP_STAGE_SIZE - currentW) / 2 + panOffset.x,
              top: (CROP_STAGE_SIZE - currentH) / 2 + panOffset.y,
            },
            Platform.select({
              web: {
                userSelect: 'none',
                pointerEvents: 'none',
              } as any,
            }),
          ]}
          resizeMode="contain"
          {...(Platform.OS === 'web' ? ({ draggable: false } as any) : {})}
        />

        {/* Discord-style SVG Mask: Dimmed outer backdrop, clear circular aperture & rule-of-thirds grid */}
        <Svg
          width={CROP_STAGE_SIZE}
          height={CROP_STAGE_SIZE}
          style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}
        >
          <Defs>
            <Mask id="discordCropMask">
              <Rect width={CROP_STAGE_SIZE} height={CROP_STAGE_SIZE} fill="#FFFFFF" />
              <Circle cx={CROP_CENTER} cy={CROP_CENTER} r={CROP_RADIUS} fill="#000000" />
            </Mask>
            <ClipPath id="circleClip">
              <Circle cx={CROP_CENTER} cy={CROP_CENTER} r={CROP_RADIUS} />
            </ClipPath>
          </Defs>

          {/* Dimmed backdrop outside circle */}
          <Rect
            width={CROP_STAGE_SIZE}
            height={CROP_STAGE_SIZE}
            fill="rgba(11, 15, 25, 0.70)"
            mask="url(#discordCropMask)"
          />

          {/* Subtle Rule-of-Thirds Grid Guides */}
          <Line
            x1={CROP_CENTER - CROP_RADIUS / 3}
            y1={CROP_CENTER - CROP_RADIUS}
            x2={CROP_CENTER - CROP_RADIUS / 3}
            y2={CROP_CENTER + CROP_RADIUS}
            stroke="rgba(255, 255, 255, 0.16)"
            strokeWidth={1}
            strokeDasharray="3,4"
            clipPath="url(#circleClip)"
          />
          <Line
            x1={CROP_CENTER + CROP_RADIUS / 3}
            y1={CROP_CENTER - CROP_RADIUS}
            x2={CROP_CENTER + CROP_RADIUS / 3}
            y2={CROP_CENTER + CROP_RADIUS}
            stroke="rgba(255, 255, 255, 0.16)"
            strokeWidth={1}
            strokeDasharray="3,4"
            clipPath="url(#circleClip)"
          />
          <Line
            x1={CROP_CENTER - CROP_RADIUS}
            y1={CROP_CENTER - CROP_RADIUS / 3}
            x2={CROP_CENTER + CROP_RADIUS}
            y2={CROP_CENTER - CROP_RADIUS / 3}
            stroke="rgba(255, 255, 255, 0.16)"
            strokeWidth={1}
            strokeDasharray="3,4"
            clipPath="url(#circleClip)"
          />
          <Line
            x1={CROP_CENTER - CROP_RADIUS}
            y1={CROP_CENTER + CROP_RADIUS / 3}
            x2={CROP_CENTER + CROP_RADIUS}
            y2={CROP_CENTER + CROP_RADIUS / 3}
            stroke="rgba(255, 255, 255, 0.16)"
            strokeWidth={1}
            strokeDasharray="3,4"
            clipPath="url(#circleClip)"
          />

          {/* Crisp white circular boundary ring */}
          <Circle
            cx={CROP_CENTER}
            cy={CROP_CENTER}
            r={CROP_RADIUS}
            stroke="#FFFFFF"
            strokeWidth={2}
            fill="none"
          />
          <Circle
            cx={CROP_CENTER}
            cy={CROP_CENTER}
            r={CROP_RADIUS + 1.5}
            stroke="rgba(255, 255, 255, 0.22)"
            strokeWidth={1}
            fill="none"
          />
        </Svg>
      </View>

      {/* Smooth Zoom Slider Card */}
      <View
        style={[
          styles.zoomSliderCard,
          { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border },
        ]}
      >
        <Pressable
          style={styles.zoomIconBtn}
          onPress={() => onZoomChange((z) => Math.max(MIN_ZOOM, Number((z - 0.1).toFixed(1))))}
          disabled={zoom <= MIN_ZOOM || disabled}
        >
          <Ionicons name="remove" size={18} color={themeColors.textBody} />
        </Pressable>

        <Pressable
          style={styles.sliderTrackWrapper}
          onPress={handleSliderClick as any}
          disabled={disabled}
        >
          <View style={[styles.sliderTrack, { backgroundColor: themeColors.border }]}>
            <View
              style={[
                styles.sliderFill,
                { width: `${sliderPercent}%`, backgroundColor: themeColors.primary },
              ]}
            />
            <View
              style={[
                styles.sliderThumb,
                { left: `${sliderPercent}%`, borderColor: themeColors.primary },
              ]}
            />
          </View>
        </Pressable>

        <Pressable
          style={styles.zoomIconBtn}
          onPress={() => onZoomChange((z) => Math.min(MAX_ZOOM, Number((z + 0.1).toFixed(1))))}
          disabled={zoom >= MAX_ZOOM || disabled}
        >
          <Ionicons name="add" size={18} color={themeColors.textBody} />
        </Pressable>

        <View style={styles.zoomValuePill}>
          <Text style={[styles.zoomValueText, { color: themeColors.textStrong }]}>
            {zoom.toFixed(1)}x
          </Text>
        </View>
      </View>

      {/* Micro Tip */}
      <Text style={[styles.cropHint, { color: themeColors.textMuted }]}>
        Kéo để di chuyển vị trí • Cuộn chuột hoặc thanh trượt để phóng to
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: fontWeights.semibold,
  },
  cropStage: {
    width: CROP_STAGE_SIZE,
    height: CROP_STAGE_SIZE,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#090D16',
    position: 'relative',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cropImage: {
    position: 'absolute',
  },
  zoomSliderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: CROP_STAGE_SIZE,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginVertical: spacing.xs,
  },
  zoomIconBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  sliderTrackWrapper: {
    flex: 1,
    height: 32,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    position: 'relative',
    overflow: 'visible',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    top: -5,
    marginLeft: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.25,
        shadowRadius: 2,
      },
    }),
    elevation: 3,
  },
  zoomValuePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  zoomValueText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    minWidth: 32,
    textAlign: 'center',
  },
  cropHint: {
    fontSize: fontSizes.caption,
    textAlign: 'center',
    marginHorizontal: spacing.md,
    marginTop: 4,
    marginBottom: spacing.md,
    lineHeight: 16,
  },
});
