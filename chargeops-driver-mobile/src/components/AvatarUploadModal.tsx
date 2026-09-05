import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { uploadAvatarToImageKit } from '@/services/mediaService';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import {
  calculateInitialOffset,
  cropImageToBlob,
  CropOffset,
} from '@/utils/avatarCropUtils';
import { getAvatarUrl } from '@/utils/imagekit';
import { AppButton } from './AppButton';
import { AvatarCropperStage } from './AvatarCropperStage';
import { AvatarViewerModal } from './AvatarViewerModal';

interface AvatarUploadModalProps {
  visible: boolean;
  onClose: () => void;
  currentAvatarUrl?: string | null;
  displayName?: string | null;
}

export function AvatarUploadModal({
  visible,
  onClose,
  currentAvatarUrl,
  displayName,
}: AvatarUploadModalProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { themeColors, isDark } = usePreferences();
  const { getAccessToken, updateAvatar } = useAuth();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);

  // Interactive Cropping states
  const [cropImageUri, setCropImageUri] = useState<string | null>(null);
  const [imgAspect, setImgAspect] = useState(1);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState<CropOffset>({ x: 0, y: 0 });

  const displayInitials = displayName
    ? displayName
        .trim()
        .split(/\s+/)
        .map((p) => p[0]?.toUpperCase() ?? '')
        .slice(-2)
        .join('')
    : 'EV';

  const activeAvatar = previewUrl || currentAvatarUrl;

  const handlePickWebFile = () => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      Alert.alert(
        'Thông báo',
        'Vui lòng nhập đường dẫn URL ảnh hoặc dùng trình duyệt để chọn tệp trực tiếp.',
      );
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        setError('Chỉ chấp nhận định dạng ảnh JPG, PNG hoặc WebP.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Kích thước ảnh tối đa là 5MB.');
        return;
      }

      setError(null);
      const localPreview = URL.createObjectURL(file);

      Image.getSize(
        localPreview,
        (w, h) => {
          const aspect = w > 0 && h > 0 ? w / h : 1;
          setImgAspect(aspect);
          const initialOffset = calculateInitialOffset(aspect);
          setPanOffset(initialOffset);
        },
        () => {
          setImgAspect(1);
          setPanOffset({ x: 0, y: 0 });
        },
      );

      setCropImageUri(localPreview);
      setRawFile(file);
      setZoom(1);
    };
    input.click();
  };

  const handleStartCropFromUrl = () => {
    if (!urlInput.trim()) {
      setError('Vui lòng nhập đường dẫn URL ảnh hợp lệ.');
      return;
    }
    setError(null);
    const targetUrl = urlInput.trim();

    Image.getSize(
      targetUrl,
      (w, h) => {
        const aspect = w > 0 && h > 0 ? w / h : 1;
        setImgAspect(aspect);
        const initialOffset = calculateInitialOffset(aspect);
        setPanOffset(initialOffset);
      },
      () => {
        setImgAspect(1);
        setPanOffset({ x: 0, y: 0 });
      },
    );

    setCropImageUri(targetUrl);
    setRawFile(null);
    setZoom(1);
  };

  const handleConfirmCropAndUpload = async () => {
    if (!cropImageUri) return;

    const token = getAccessToken();
    if (!token) {
      setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      let fileToUpload: Blob | File | string;

      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        try {
          const croppedBlob = await cropImageToBlob(
            cropImageUri,
            imgAspect,
            zoom,
            panOffset.x,
            panOffset.y,
            400,
          );
          fileToUpload = croppedBlob;
        } catch {
          fileToUpload = rawFile || cropImageUri;
        }
      } else {
        fileToUpload = rawFile || cropImageUri;
      }

      const uploadRes = await uploadAvatarToImageKit({
        file: fileToUpload,
        fileName: rawFile?.name || `avatar_${Date.now()}.jpg`,
        accessToken: token,
        onProgress: (pct) => setProgress(pct),
      });

      await updateAvatar(uploadRes.url, uploadRes.fileId);
      setUploading(false);
      setCropImageUri(null);
      setRawFile(null);
      setPreviewUrl(uploadRes.url);
      onClose();
      Alert.alert('Thành công', 'Đã cập nhật ảnh đại diện mới.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Tải ảnh lên thất bại.';
      setError(message);
      setUploading(false);
    }
  };

  const handleApplyUrl = async () => {
    if (!urlInput.trim()) {
      setError('Vui lòng nhập đường dẫn URL ảnh hợp lệ.');
      return;
    }

    setError(null);
    setUploading(true);
    try {
      await updateAvatar(urlInput.trim(), null);
      setUploading(false);
      setPreviewUrl(urlInput.trim());
      onClose();
      Alert.alert('Thành công', 'Đã cập nhật ảnh đại diện từ liên kết.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Cập nhật ảnh đại diện thất bại.';
      setError(message);
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setError(null);
    setUploading(true);
    try {
      await updateAvatar('', '');
      setPreviewUrl(null);
      setUrlInput('');
      setUploading(false);
      onClose();
      Alert.alert('Thành công', 'Đã gỡ ảnh đại diện, chuyển về avatar mặc định.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể gỡ ảnh đại diện.';
      setError(message);
      setUploading(false);
    }
  };

  const resetModalState = () => {
    setCropImageUri(null);
    setRawFile(null);
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={uploading ? undefined : resetModalState}
    >
      <View style={styles.root}>
        <BlurView intensity={32} tint={isDark ? 'dark' : 'regular'} style={StyleSheet.absoluteFill} />
        <Pressable style={StyleSheet.absoluteFill} onPress={uploading ? undefined : resetModalState} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: themeColors.surface,
                paddingBottom: insets.bottom + spacing.md,
              },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: themeColors.border }]} />

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text style={[styles.title, { color: themeColors.textStrong }]}>
                  {cropImageUri ? 'Căn chỉnh ảnh đại diện' : t('profile.avatarModalTitle', 'Ảnh đại diện')}
                </Text>
                <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
                  {cropImageUri
                    ? 'Kéo ảnh để điều chỉnh vùng hiển thị trong vòng tròn.'
                    : t('profile.avatarModalSubtitle', 'Cập nhật ảnh hiển thị cho tài khoản của bạn.')}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Đóng"
                disabled={uploading}
                hitSlop={8}
                onPress={resetModalState}
                style={[styles.closeButton, { backgroundColor: themeColors.surfaceAlt }]}
              >
                <Ionicons name="close" size={20} color={themeColors.textBody} />
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.body}
            >
              {/* Error Alert */}
              {error ? (
                <View style={[styles.errorBox, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}>
                  <Ionicons name="alert-circle" size={16} color="#B91C1C" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {cropImageUri ? (
                /* Interactive Cropper Stage */
                <>
                  <AvatarCropperStage
                    imageUri={cropImageUri}
                    aspect={imgAspect}
                    zoom={zoom}
                    panOffset={panOffset}
                    onZoomChange={setZoom}
                    onPanChange={setPanOffset}
                    disabled={uploading}
                  />

                  {/* Upload Progress */}
                  {uploading && (
                    <View style={styles.progressContainer}>
                      <View style={[styles.progressTrack, { backgroundColor: themeColors.surfaceAlt }]}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${progress}%`, backgroundColor: themeColors.primary },
                          ]}
                        />
                      </View>
                      <Text style={[styles.progressText, { color: themeColors.textMuted }]}>
                        Đang cắt & tải lên: {progress}%
                      </Text>
                    </View>
                  )}

                  {/* Crop Actions */}
                  <View style={styles.actions}>
                    <Pressable
                      style={[
                        styles.primaryBtn,
                        { backgroundColor: themeColors.primary },
                        uploading && { opacity: 0.7 },
                      ]}
                      onPress={handleConfirmCropAndUpload}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                          <Text style={styles.primaryBtnText}>Cắt & Lưu ảnh đại diện</Text>
                        </>
                      )}
                    </Pressable>

                    <Pressable
                      style={[
                        styles.outlineBtn,
                        { borderColor: themeColors.border, backgroundColor: themeColors.surfaceAlt },
                      ]}
                      onPress={() => {
                        setCropImageUri(null);
                        setRawFile(null);
                      }}
                      disabled={uploading}
                    >
                      <Text style={[styles.outlineBtnText, { color: themeColors.textStrong }]}>
                        Chọn ảnh khác
                      </Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                /* Default View: Current Avatar & All Action Options */
                <>
                  <View style={styles.avatarPreviewRow}>
                    <Pressable
                      style={[
                        styles.avatarCircle,
                        {
                          backgroundColor: themeColors.primarySoft,
                          borderColor: themeColors.primary,
                        },
                      ]}
                      onPress={() => {
                        if (activeAvatar) setViewerVisible(true);
                      }}
                      disabled={!activeAvatar || uploading}
                      accessibilityRole="button"
                      accessibilityLabel="Xem ảnh đại diện rõ nét"
                    >
                      {activeAvatar ? (
                        <>
                          <Image
                            source={{
                              uri: getAvatarUrl(activeAvatar, 200),
                            }}
                            style={styles.avatarImage}
                            resizeMode="cover"
                          />
                          <View style={styles.previewZoomBadge}>
                            <Ionicons name="search" size={11} color="#FFFFFF" />
                          </View>
                        </>
                      ) : (
                        <Text style={[styles.avatarText, { color: themeColors.primaryDark }]}>
                          {displayInitials}
                        </Text>
                      )}
                      {uploading && (
                        <View style={styles.uploadingOverlay}>
                          <ActivityIndicator color="#FFFFFF" size="small" />
                          <Text style={styles.uploadingText}>{progress}%</Text>
                        </View>
                      )}
                    </Pressable>

                    {Boolean(activeAvatar) && (
                      <Pressable
                        onPress={() => setViewerVisible(true)}
                        hitSlop={8}
                        style={styles.viewHintBtn}
                      >
                        <Ionicons name="eye-outline" size={13} color={themeColors.primary} />
                        <Text style={[styles.viewHintText, { color: themeColors.primary }]}>
                          Nhấn để xem rõ avatar
                        </Text>
                      </Pressable>
                    )}
                  </View>

                  {/* Progress bar */}
                  {uploading && (
                    <View style={styles.progressContainer}>
                      <View style={[styles.progressTrack, { backgroundColor: themeColors.surfaceAlt }]}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${progress}%`, backgroundColor: themeColors.primary },
                          ]}
                        />
                      </View>
                      <Text style={[styles.progressText, { color: themeColors.textMuted }]}>
                        Đang tải ảnh lên: {progress}%
                      </Text>
                    </View>
                  )}

                  {/* Action Buttons */}
                  <View style={styles.actions}>
                    {/* Button 1: Pick & Crop */}
                    <Pressable
                      style={[
                        styles.primaryBtn,
                        { backgroundColor: themeColors.primary },
                        uploading && { opacity: 0.7 },
                      ]}
                      onPress={handlePickWebFile}
                      disabled={uploading}
                    >
                      <Ionicons name="crop-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.primaryBtnText}>Chọn ảnh & Căn chỉnh 1:1</Text>
                    </Pressable>

                    {/* View Avatar Button if avatar exists */}
                    {Boolean(activeAvatar) && (
                      <Pressable
                        style={[
                          styles.outlineBtn,
                          { borderColor: themeColors.border, backgroundColor: themeColors.surfaceAlt },
                        ]}
                        onPress={() => setViewerVisible(true)}
                        disabled={uploading}
                      >
                        <Ionicons name="eye-outline" size={18} color={themeColors.primary} />
                        <Text style={[styles.outlineBtnText, { color: themeColors.textStrong }]}>
                          Xem ảnh đại diện rõ nét
                        </Text>
                      </Pressable>
                    )}

                    {/* Button 2: URL Input Toggle */}
                    <Pressable
                      style={[
                        styles.outlineBtn,
                        { borderColor: themeColors.border, backgroundColor: themeColors.surfaceAlt },
                      ]}
                      onPress={() => setShowUrlInput((prev) => !prev)}
                      disabled={uploading}
                    >
                      <Ionicons name="link-outline" size={18} color={themeColors.primary} />
                      <Text style={[styles.outlineBtnText, { color: themeColors.textStrong }]}>
                        {showUrlInput ? 'Ẩn nhập liên kết' : 'Nhập đường dẫn URL ảnh'}
                      </Text>
                    </Pressable>

                    {showUrlInput && (
                      <View style={styles.urlInputContainer}>
                        <TextInput
                          placeholder="https://ik.imagekit.io/chargeops/..."
                          placeholderTextColor={themeColors.textMuted}
                          value={urlInput}
                          onChangeText={setUrlInput}
                          autoCapitalize="none"
                          autoCorrect={false}
                          style={[
                            styles.urlInputField,
                            {
                              backgroundColor: themeColors.surfaceAlt,
                              borderColor: themeColors.border,
                              color: themeColors.textStrong,
                            },
                          ]}
                        />
                        <View style={styles.urlBtnRow}>
                          <AppButton
                            label="Căn chỉnh ảnh"
                            variant="secondary"
                            onPress={handleStartCropFromUrl}
                            disabled={!urlInput.trim() || uploading}
                          />
                          <AppButton
                            label="Lưu ngay"
                            variant="primary"
                            onPress={handleApplyUrl}
                            disabled={!urlInput.trim() || uploading}
                          />
                        </View>
                      </View>
                    )}

                    {/* Button 3: Remove Current Avatar */}
                    {Boolean(currentAvatarUrl) && (
                      <Pressable
                        style={[styles.removeBtn, { borderColor: '#FECACA', backgroundColor: '#FEF2F2' }]}
                        onPress={handleRemoveAvatar}
                        disabled={uploading}
                      >
                        <Ionicons name="trash-outline" size={16} color="#DC2626" />
                        <Text style={styles.removeBtnText}>Xóa ảnh đại diện hiện tại</Text>
                      </Pressable>
                    )}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>

      <AvatarViewerModal
        visible={viewerVisible}
        onClose={() => setViewerVisible(false)}
        avatarUrl={activeAvatar}
        displayName={displayName}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  keyboardView: {
    width: '100%',
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    maxHeight: '94%',
    minHeight: 560,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerCopy: {
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    fontSize: fontSizes.heading,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.heading,
  },
  subtitle: {
    fontSize: fontSizes.caption,
    lineHeight: lineHeights.caption,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingBottom: 40,
    flexGrow: 1,
  },
  avatarPreviewRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
  avatarCircle: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 34,
    fontWeight: fontWeights.bold,
  },
  previewZoomBadge: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  viewHintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: 'rgba(22, 163, 74, 0.08)',
  },
  viewHintText: {
    fontSize: 12,
    fontWeight: fontWeights.semibold,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: fontWeights.bold,
    marginTop: 4,
  },
  progressContainer: {
    width: '100%',
    marginBottom: spacing.md,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: fontSizes.caption,
    marginTop: 4,
    textAlign: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: fontSizes.caption,
    color: '#B91C1C',
    flex: 1,
  },
  actions: {
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  outlineBtnText: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.medium,
  },
  urlInputContainer: {
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    marginBottom: spacing.xs,
  },
  urlInputField: {
    height: 42,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    fontSize: fontSizes.body,
  },
  urlBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.xs,
  },
  removeBtnText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
    color: '#DC2626',
  },
});
