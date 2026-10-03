import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, type CameraCapturedPicture } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';

interface CameraPortraitModalProps {
  /** Controls modal visibility */
  visible: boolean;
  /** Called when the user cancels */
  onClose: () => void;
  /**
   * Called with the captured / picked photo URI (local file://).
   * The caller pipes this into the crop → upload flow.
   */
  onCapture: (uri: string) => void;
}

/**
 * Full-screen camera modal for capturing or selecting a portrait photo for avatar.
 *
 * Features
 *  - Front camera by default (selfie)
 *  - Oval face-guide centered on screen
 *  - Flash toggle (off / on)
 *  - Camera flip (front ↔ back)
 *  - Gallery / library picker (expo-image-picker)
 *  - Full permission handling with Settings deep-link
 */
export function CameraPortraitModal({ visible, onClose, onCapture }: CameraPortraitModalProps) {
  const insets = useSafeAreaInsets();
  const { themeColors } = usePreferences();

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [capturing, setCapturing] = useState(false);
  const [pickingGallery, setPickingGallery] = useState(false);

  const cameraRef = useRef<CameraView>(null);

  // ─── Camera permission ────────────────────────────────────────────────────
  const handleRequestCameraPermission = useCallback(async () => {
    const result = await requestCameraPermission();
    if (!result.granted && !result.canAskAgain) {
      Alert.alert(
        'Quyền camera bị từ chối',
        'Vui lòng bật quyền camera trong Cài đặt để sử dụng tính năng này.',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Mở Cài đặt', onPress: () => Linking.openSettings() },
        ],
      );
    }
  }, [requestCameraPermission]);

  // ─── Capture photo ────────────────────────────────────────────────────────
  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo: CameraCapturedPicture | undefined = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        base64: false,
      });
      if (!photo?.uri) throw new Error('Không nhận được ảnh từ camera.');
      onCapture(photo.uri);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Chụp ảnh thất bại, vui lòng thử lại.';
      Alert.alert('Lỗi camera', msg);
    } finally {
      setCapturing(false);
    }
  }, [capturing, onCapture, onClose]);

  // ─── Pick from gallery ────────────────────────────────────────────────────
  const handlePickGallery = useCallback(async () => {
    if (pickingGallery) return;
    setPickingGallery(true);
    try {
      // Request media library permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Quyền thư viện bị từ chối',
          'Vui lòng bật quyền truy cập thư viện ảnh trong Cài đặt hệ thống.',
          [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Mở Cài đặt', onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        onCapture(result.assets[0].uri);
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể mở thư viện ảnh.';
      Alert.alert('Lỗi', msg);
    } finally {
      setPickingGallery(false);
    }
  }, [pickingGallery, onCapture, onClose]);

  // ─── Permission gate ──────────────────────────────────────────────────────
  const renderPermissionGate = () => (
    <View style={[styles.permissionContainer, { backgroundColor: '#0a0a0a' }]}>
      <Pressable
        style={[styles.closeAbsBtn, { top: insets.top + spacing.sm }]}
        onPress={onClose}
        hitSlop={12}
      >
        <Ionicons name="close" size={26} color="#FFFFFF" />
      </Pressable>

      <View style={styles.permissionContent}>
        <View style={styles.permissionIconWrap}>
          <Ionicons name="camera-outline" size={56} color={themeColors.primary} />
        </View>
        <Text style={styles.permissionTitle}>Truy cập camera</Text>
        <Text style={styles.permissionBody}>
          Để chụp ảnh chân dung làm avatar, ứng dụng cần quyền sử dụng camera của thiết bị.
        </Text>
        <Pressable
          style={[styles.permissionBtn, { backgroundColor: themeColors.primary }]}
          onPress={handleRequestCameraPermission}
        >
          <Ionicons name="camera" size={18} color="#FFFFFF" />
          <Text style={styles.permissionBtnText}>Cho phép sử dụng camera</Text>
        </Pressable>

        {/* Gallery fallback even without camera */}
        <Pressable
          style={[styles.galleryFallbackBtn, { borderColor: 'rgba(255,255,255,0.3)' }]}
          onPress={handlePickGallery}
          disabled={pickingGallery}
        >
          {pickingGallery ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="images-outline" size={18} color="#FFFFFF" />
              <Text style={styles.galleryFallbackText}>Chọn từ thư viện ảnh</Text>
            </>
          )}
        </Pressable>

        {!cameraPermission?.canAskAgain && (
          <Pressable
            style={[styles.settingsBtn, { borderColor: themeColors.border }]}
            onPress={() => Linking.openSettings()}
          >
            <Text style={[styles.settingsBtnText, { color: themeColors.primary }]}>
              Mở Cài đặt hệ thống
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );

  // ─── Camera viewfinder ────────────────────────────────────────────────────
  const renderCamera = () => (
    <View style={styles.cameraContainer}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flash}
        mode="picture"
      />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 4 }]}>
        <Pressable style={styles.iconBtn} onPress={onClose} hitSlop={10}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </Pressable>

        <Text style={styles.cameraTitle}>Chụp ảnh chân dung</Text>

        <Pressable
          style={styles.iconBtn}
          onPress={() => setFlash((f) => (f === 'off' ? 'on' : 'off'))}
          hitSlop={10}
        >
          <Ionicons
            name={flash === 'on' ? 'flash' : 'flash-off'}
            size={24}
            color={flash === 'on' ? '#FCD34D' : '#FFFFFF'}
          />
        </Pressable>
      </View>

      {/* ── Face guide overlay ──
          absoluteFill + flex centering so the oval is always at the visual
          center of the screen, unaffected by the top/bottom bars.      */}
      <View style={styles.guideWrapper} pointerEvents="none">
        {/* The oval lives in its own container so only IT is centered */}
        <View style={styles.ovalContainer}>
          <View style={styles.faceOval} />
          <Text style={styles.guideHint}>Đặt khuôn mặt vào vòng tròn</Text>
        </View>
      </View>

      {/* Bottom controls */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.lg }]}>
        {/* Gallery picker */}
        <Pressable
          style={styles.sideBtn}
          onPress={handlePickGallery}
          disabled={pickingGallery || capturing}
          hitSlop={10}
        >
          {pickingGallery ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="images-outline" size={26} color="#FFFFFF" />
              <Text style={styles.sideBtnLabel}>Thư viện</Text>
            </>
          )}
        </Pressable>

        {/* Shutter */}
        <Pressable
          style={[styles.shutterOuter, capturing && styles.shutterCapturing]}
          onPress={handleCapture}
          disabled={capturing || pickingGallery}
          accessibilityRole="button"
          accessibilityLabel="Chụp ảnh"
        >
          {capturing ? (
            <ActivityIndicator color="#FFFFFF" size="large" />
          ) : (
            <View style={styles.shutterInner} />
          )}
        </Pressable>

        {/* Flip camera */}
        <Pressable
          style={styles.sideBtn}
          onPress={() => setFacing((f) => (f === 'front' ? 'back' : 'front'))}
          disabled={capturing || pickingGallery}
          hitSlop={10}
        >
          <Ionicons name="camera-reverse-outline" size={26} color="#FFFFFF" />
          <Text style={styles.sideBtnLabel}>Đảo</Text>
        </Pressable>
      </View>
    </View>
  );

  // ─── Root ─────────────────────────────────────────────────────────────────
  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
      presentationStyle={Platform.OS === 'ios' ? 'fullScreen' : undefined}
    >
      {!cameraPermission ? (
        <View style={[styles.loadingContainer, { backgroundColor: '#0a0a0a' }]}>
          <ActivityIndicator color={themeColors.primary} size="large" />
        </View>
      ) : cameraPermission.granted ? (
        renderCamera()
      ) : (
        renderPermissionGate()
      )}
    </Modal>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────
const OVAL_W = 240;
const OVAL_H = 300;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  /* Loading */
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Permission gate */
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeAbsBtn: {
    position: 'absolute',
    left: spacing.md,
    zIndex: 10,
    padding: 4,
  },
  permissionContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  permissionIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  permissionTitle: {
    color: '#FFFFFF',
    fontSize: fontSizes.heading,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
  },
  permissionBody: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: fontSizes.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    width: '100%',
    justifyContent: 'center',
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  galleryFallbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    width: '100%',
    justifyContent: 'center',
  },
  galleryFallbackText: {
    color: '#FFFFFF',
    fontSize: fontSizes.body,
    fontWeight: fontWeights.medium,
  },
  settingsBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  settingsBtnText: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.medium,
  },

  /* Camera container */
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },

  /* Top bar */
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraTitle: {
    color: '#FFFFFF',
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
  },

  /* Face guide — absoluteFill so it doesn't participate in flex layout */
  guideWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  /**
   * ovalContainer is centered by the parent flex. Only the oval and its
   * caption live here — no stray marginTop that shifts the center point.
   */
  ovalContainer: {
    alignItems: 'center',
    gap: spacing.md,
  },
  faceOval: {
    width: OVAL_W,
    height: OVAL_H,
    borderRadius: OVAL_W / 2,
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.80)',
    borderStyle: 'dashed',
  },
  guideHint: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
    textShadowColor: 'rgba(0,0,0,0.70)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  /* Bottom bar */
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sideBtn: {
    width: 56,
    alignItems: 'center',
    gap: 4,
  },
  sideBtnLabel: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: 11,
    fontWeight: fontWeights.medium,
  },

  /* Shutter */
  shutterOuter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  shutterCapturing: {
    opacity: 0.6,
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
  },
});
