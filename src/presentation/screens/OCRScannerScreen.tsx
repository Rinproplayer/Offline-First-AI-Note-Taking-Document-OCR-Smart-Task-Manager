import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography, radius } from '../theme/colors';
import { ViewfinderOverlay, OCRScanMode } from '../components/ViewfinderOverlay';
import { useOCRMutation } from '../hooks/useOCRMutation';
import { OCRResult } from '../../domain/repositories/IAIService';

/**
 * Màn hình Quét Tài Liệu OCR (OCR Scanner Screen)
 * Hỗ trợ 3 phương thức quét:
 * 1. Chụp ảnh camera thực tế
 * 2. Chọn ảnh tài liệu/chữ viết tay từ thư viện
 * 3. Quét nhanh tài liệu mẫu theo từng chế độ (Văn bản, Hóa đơn, LaTeX, Bảng)
 */
export const OCRScannerScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<OCRScanMode>('text');
  const [flashOn, setFlashOn] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [editableText, setEditableText] = useState('');

  const ocrMutation = useOCRMutation();

  /**
   * Chụp ảnh thực tế từ camera của điện thoại
   */
  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Cấp quyền máy ảnh', 'Vui lòng cấp quyền máy ảnh trong Cài đặt để MindVault có thể quét tài liệu.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.85,
        base64: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedImageUri(asset.uri);
        await executeOCR(asset.uri, asset.base64 || undefined);
      }
    } catch (err: any) {
      Alert.alert('Lỗi chụp ảnh', err.message || 'Không thể mở máy ảnh.');
    }
  };

  /**
   * Chọn ảnh tài liệu hoặc chữ viết tay từ thư viện ảnh
   */
  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Cấp quyền thư viện', 'Vui lòng cấp quyền truy cập ảnh trong Cài đặt để chọn tài liệu.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.85,
        base64: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedImageUri(asset.uri);
        await executeOCR(asset.uri, asset.base64 || undefined);
      }
    } catch (err: any) {
      Alert.alert('Lỗi chọn ảnh', err.message || 'Không thể mở thư viện ảnh.');
    }
  };

  /**
   * Quét tài liệu mẫu theo chuyên đề (Văn bản, Hóa đơn, Công thức toán, Bảng)
   */
  const handleScanSample = async () => {
    setSelectedImageUri(null);
    await executeOCR(`sample://${mode}`, undefined);
  };

  /**
   * Thực hiện nhận diện OCR
   */
  const executeOCR = async (uri: string, base64Data?: string) => {
    try {
      const response = await ocrMutation.mutateAsync({
        imageUri: uri,
        mode,
        base64: base64Data
      });

      setOcrResult(response.ocrResult);
      setEditableText(response.ocrResult.rawText);
    } catch (e: any) {
      Alert.alert('Lỗi OCR', e.message || 'Không thể trích xuất văn bản từ tài liệu này.');
    }
  };

  /**
   * Lưu văn bản trích xuất được vào Ghi chú mới trong WatermelonDB
   */
  const handleSaveToNote = async () => {
    const textToSave = editableText.trim();
    if (!textToSave) {
      Alert.alert('Thông báo', 'Chưa có nội dung văn bản nào để lưu.');
      return;
    }

    try {
      const titlePrefix = mode === 'receipt' ? 'Hóa đơn' : mode === 'latex' ? 'Công thức' : mode === 'table' ? 'Bảng biểu' : 'Quét OCR';
      const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

      const response = await ocrMutation.mutateAsync({
        imageUri: selectedImageUri || `sample://${mode}`,
        mode,
        noteTitle: `${titlePrefix} [${mode.toUpperCase()}] - ${timeStr}`
      });

      if (response.note) {
        Alert.alert(
          'Đã lưu thành công! 🎉',
          `Ghi chú "${response.note.title}" đã được lưu an toàn vào cơ sở dữ liệu WatermelonDB cục bộ.`,
          [
            {
              text: 'Mở Soạn thảo ngay',
              onPress: () => router.push(`/note-editor/${response.note.id}`)
            },
            { text: 'Ở lại màn hình' }
          ]
        );
      }
    } catch (e: any) {
      Alert.alert('Lỗi lưu trữ', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Top Header */}
      <View style={[styles.header, { paddingTop: insets.top, height: 56 + insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.circleButton}>
          <Ionicons name="arrow-back" size={20} color={colors.onSurface} />
        </Pressable>

        <View style={styles.headerTitleColumn}>
          <Text style={styles.headerTitle}>Quét Tài Liệu OCR</Text>
          <Text style={styles.headerSubtitle}>Google ML Kit • On-Device AI</Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            onPress={() => setFlashOn(!flashOn)}
            style={[styles.circleButton, flashOn && styles.activeFlash]}
          >
            <Ionicons
              name={flashOn ? 'flash' : 'flash-off-outline'}
              size={18}
              color={flashOn ? colors.warning : colors.onSurface}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 50 + insets.bottom }]}
      >
        {/* Scanner Viewfinder with Real/Captured Image Preview */}
        <ViewfinderOverlay
          mode={mode}
          onModeChange={(newMode) => {
            setMode(newMode);
            if (!selectedImageUri) {
              executeOCR(`sample://${newMode}`, undefined);
            }
          }}
          detectedBlocksCount={ocrResult ? ocrResult.blocks.length : 5}
          imageUri={selectedImageUri}
        />

        {/* 3 Control Action Buttons: Camera, Library, Sample */}
        <View style={styles.controlsRow}>
          <Pressable
            onPress={handlePickImage}
            disabled={ocrMutation.isPending}
            style={({ pressed }) => [styles.controlPill, pressed && { opacity: 0.75 }]}
          >
            <Ionicons name="images-outline" size={18} color={colors.primaryFixed} />
            <Text style={styles.controlPillText}>Thư viện</Text>
          </Pressable>

          {/* Main Shutter Camera Button */}
          <Pressable
            disabled={ocrMutation.isPending}
            onPress={handleTakePhoto}
            style={({ pressed }) => [
              styles.shutterOuter,
              pressed && { transform: [{ scale: 0.95 }] }
            ]}
          >
            <View style={styles.shutterInner}>
              {ocrMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="camera" size={26} color="#FFFFFF" />
              )}
            </View>
          </Pressable>

          <Pressable
            onPress={handleScanSample}
            disabled={ocrMutation.isPending}
            style={({ pressed }) => [styles.controlPill, pressed && { opacity: 0.75 }]}
          >
            <Ionicons name="flash-outline" size={18} color={colors.secondary} />
            <Text style={styles.controlPillText}>Quét mẫu</Text>
          </Pressable>
        </View>

        {/* Real-time OCR Results Drawer */}
        <View style={styles.resultsCard}>
          <View style={styles.resultsHeader}>
            <View style={styles.confidenceRow}>
              <View style={styles.greenDot} />
              <Text style={styles.confidenceText}>
                {ocrResult
                  ? `Độ chính xác ${(ocrResult.confidence * 100).toFixed(1)}% • ${ocrResult.detectedLanguage || 'Tiếng Việt'}`
                  : 'Sẵn sàng nhận diện on-device (ML Kit)'}
              </Text>
            </View>

            <View style={styles.offlinePill}>
              <Ionicons name="shield-checkmark-outline" size={12} color={colors.tertiary} />
              <Text style={styles.offlinePillText}>100% On-Device</Text>
            </View>
          </View>

          {/* Editable Text Output Box */}
          <View style={styles.textBox}>
            <TextInput
              style={styles.rawTextInput}
              multiline
              value={editableText || (ocrResult ? ocrResult.rawText : 'Chạm "Chụp ảnh", "Thư viện" hoặc "Quét mẫu" để trích xuất văn bản tài liệu...')}
              onChangeText={setEditableText}
              placeholder="Chưa có văn bản nào được trích xuất..."
              placeholderTextColor={colors.outline}
              textAlignVertical="top"
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.cardActionsRow}>
            <Pressable
              onPress={handleSaveToNote}
              disabled={ocrMutation.isPending}
              style={({ pressed }) => [
                styles.primaryActionBtn,
                pressed && { opacity: 0.85 },
                ocrMutation.isPending && { opacity: 0.6 }
              ]}
            >
              <Ionicons name="document-text-outline" size={16} color="#FFFFFF" />
              <Text style={styles.primaryActionBtnText}>
                {ocrMutation.isPending ? 'Đang lưu...' : 'Lưu vào Ghi chú'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/tasks')}
              style={({ pressed }) => [styles.secondaryActionBtn, pressed && { opacity: 0.85 }]}
            >
              <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
              <Text style={styles.secondaryActionBtnText}>Trích Việc (AI)</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant
  },
  circleButton: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.outlineVariant
  },
  activeFlash: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: colors.warning
  },
  headerTitleColumn: {
    alignItems: 'center'
  },
  headerTitle: {
    ...typography.headlineSm,
    color: colors.onSurface,
    fontWeight: '700'
  },
  headerSubtitle: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  scrollContent: {
    paddingBottom: 40
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginVertical: 14
  },
  controlPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant
  },
  controlPillText: {
    ...typography.labelMd,
    color: colors.onSurface,
    fontWeight: '600'
  },
  shutterOuter: {
    width: 68,
    height: 68,
    borderRadius: radius.full,
    borderWidth: 4,
    borderColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.15)'
  },
  shutterInner: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  resultsCard: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: 16
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.tertiary
  },
  confidenceText: {
    ...typography.labelMd,
    color: colors.onSurface,
    fontWeight: '600'
  },
  offlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: 'rgba(16, 185, 129, 0.15)'
  },
  offlinePillText: {
    ...typography.labelSm,
    color: colors.tertiary,
    fontWeight: '700'
  },
  textBox: {
    backgroundColor: colors.surfaceLow,
    borderRadius: radius.lg,
    padding: 12,
    minHeight: 140,
    maxHeight: 240,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginBottom: 16
  },
  rawTextInput: {
    ...typography.bodyMd,
    color: colors.onSurface,
    lineHeight: 22,
    flex: 1
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 12
  },
  primaryActionBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: radius.full
  },
  primaryActionBtnText: {
    ...typography.labelLg,
    color: '#FFFFFF',
    fontWeight: '700'
  },
  secondaryActionBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingVertical: 12,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)'
  },
  secondaryActionBtnText: {
    ...typography.labelMd,
    color: colors.primaryFixed,
    fontWeight: '700'
  }
});
