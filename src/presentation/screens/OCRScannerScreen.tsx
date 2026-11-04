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
import { useTheme } from '../stores/useThemeStore';
import { ViewfinderOverlay, OCRScanMode } from '../components/ViewfinderOverlay';
import { useOCRExtractOnlyMutation } from '../hooks/useOCRMutation';
import { useCreateNote } from '../hooks/useNotesQuery';
import { OCRResult } from '../../domain/repositories/IAIService';

/**
 * OCRScannerScreen - Minimalist Apple HIG & Material 3 Refactored
 * - Khung ngắm tài liệu sạch sẽ, không nhãn thông số gây nhiễu
 * - Bộ điều khiển chụp ảnh / thư viện / tài liệu mẫu tối giản
 * - Ngăn kéo kết quả văn bản phẳng (#161C28, bo góc 16px)
 * - Nút bấm duy nhất: "Lưu thành ghi chú"
 */
export const OCRScannerScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [mode, setMode] = useState<OCRScanMode>('text');
  const [flashOn, setFlashOn] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [editableText, setEditableText] = useState('');

  const extractMutation = useOCRExtractOnlyMutation();
  const createNoteMutation = useCreateNote();
  const isProcessing = extractMutation.isPending || createNoteMutation.isPending;

  /**
   * Chụp ảnh thực tế từ camera của điện thoại
   */
  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Cấp quyền máy ảnh', 'Vui lòng cấp quyền máy ảnh trong Cài đặt để quét tài liệu.');
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
   * Quét tài liệu mẫu
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
      const result = await extractMutation.mutateAsync({
        imageUri: uri,
        mode,
        base64: base64Data
      });

      setOcrResult(result);
      setEditableText(result.rawText);
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
      const titlePrefix =
        mode === 'receipt'
          ? 'Hóa đơn'
          : mode === 'latex'
          ? 'Công thức'
          : mode === 'table'
          ? 'Bảng biểu'
          : 'Quét OCR';
      const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

      const newNote = await createNoteMutation.mutateAsync({
        title: `${titlePrefix} - ${timeStr}`,
        content: textToSave,
        tags: ['OCR', mode.toUpperCase()],
        isPinned: false,
        isArchived: false,
        hasOcr: true,
        ocrRawText: textToSave
      });

      Alert.alert(
        'Đã lưu thành công',
        `Ghi chú "${newNote.title}" đã được lưu an toàn.`,
        [
          {
            text: 'Mở Soạn thảo',
            onPress: () => router.push(`/note-editor/${newNote.id}`)
          },
          { text: 'Đóng', style: 'cancel' }
        ]
      );
    } catch (e: any) {
      Alert.alert('Lỗi lưu trữ', e.message);
    }
  };

  const hasText = editableText.trim().length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Sleek Minimal Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top,
            height: 56 + insets.top,
            borderBottomColor: colors.outlineVariant
          }
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={[styles.iconButton, { backgroundColor: colors.surfaceContainer }]}
        >
          <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
        </Pressable>

        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Quét tài liệu</Text>

        <Pressable
          onPress={() => setFlashOn(!flashOn)}
          hitSlop={12}
          style={[
            styles.iconButton,
            { backgroundColor: colors.surfaceContainer },
            flashOn && styles.activeFlash
          ]}
        >
          <Ionicons
            name={flashOn ? 'flash' : 'flash-off-outline'}
            size={20}
            color={flashOn ? '#FBBF24' : colors.onSurfaceVariant}
          />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 32 + insets.bottom }]}
      >
        {/* Scanner Viewfinder */}
        <ViewfinderOverlay
          mode={mode}
          onModeChange={(newMode) => {
            setMode(newMode);
            if (!selectedImageUri) {
              executeOCR(`sample://${newMode}`, undefined);
            }
          }}
          detectedBlocksCount={ocrResult ? ocrResult.blocks.length : 0}
          imageUri={selectedImageUri}
        />

        {/* 3 Clean Controls: Library, Camera Shutter, Sample */}
        <View style={styles.controlsRow}>
          <Pressable
            onPress={handlePickImage}
            disabled={isProcessing}
            style={({ pressed }) => [styles.sideControlBtn, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="images-outline" size={20} color={colors.onSurface} />
            <Text style={[styles.sideControlText, { color: colors.onSurfaceVariant }]}>Thư viện</Text>
          </Pressable>

          {/* Minimalist Shutter Button */}
          <Pressable
            disabled={isProcessing}
            onPress={handleTakePhoto}
            style={({ pressed }) => [
              styles.shutterOuter,
              { borderColor: colors.primary },
              pressed && { transform: [{ scale: 0.94 }] }
            ]}
          >
            <View style={[styles.shutterInner, { backgroundColor: colors.primary }]}>
              {extractMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="camera" size={24} color="#FFFFFF" />
              )}
            </View>
          </Pressable>

          <Pressable
            onPress={handleScanSample}
            disabled={isProcessing}
            style={({ pressed }) => [styles.sideControlBtn, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="document-text-outline" size={20} color={colors.onSurface} />
            <Text style={[styles.sideControlText, { color: colors.onSurfaceVariant }]}>Mẫu</Text>
          </Pressable>
        </View>

        {/* Text Drawer (Flat card #161C28 / #FFFFFF, 16px radius) */}
        <View
          style={[
            styles.resultsCard,
            {
              backgroundColor: colors.surfaceContainer,
              borderColor: colors.outlineVariant
            }
          ]}
        >
          <View style={styles.resultsHeader}>
            <Text style={[styles.resultsTitle, { color: colors.onSurface }]}>Văn bản nhận diện</Text>
            {extractMutation.isPending && (
              <View style={styles.pendingRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.pendingText, { color: colors.primary }]}>
                  Đang nhận diện với Gemini 3.5...
                </Text>
              </View>
            )}
          </View>

          {/* Editable Text Area */}
          <View
            style={[
              styles.textBox,
              {
                backgroundColor: isDark ? colors.background : colors.surface,
                borderColor: colors.outlineVariant
              }
            ]}
          >
            <TextInput
              style={[styles.rawTextInput, { color: colors.onSurface }]}
              multiline
              value={editableText || (ocrResult ? ocrResult.rawText : '')}
              onChangeText={setEditableText}
              placeholder="Chưa có văn bản nào được quét. Chạm camera để chụp hoặc chọn ảnh từ thư viện..."
              placeholderTextColor={colors.onSurfaceVariant}
              textAlignVertical="top"
            />
          </View>

          {/* Single Action Button: "Lưu thành ghi chú" */}
          <Pressable
            onPress={handleSaveToNote}
            disabled={isProcessing || !hasText}
            style={({ pressed }) => [
              styles.primarySaveBtn,
              { backgroundColor: colors.primary },
              (!hasText || isProcessing) && {
                backgroundColor: isDark ? colors.surfaceContainerHigh : '#F1F5F9',
                borderWidth: 1,
                borderColor: colors.outlineVariant
              },
              pressed && hasText && { opacity: 0.85 }
            ]}
          >
            {createNoteMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons
                name="bookmark-outline"
                size={18}
                color={hasText ? '#FFFFFF' : colors.onSurfaceVariant}
              />
            )}
            <Text
              style={[
                styles.primarySaveText,
                { color: hasText ? '#FFFFFF' : colors.onSurfaceVariant }
              ]}
            >
              {createNoteMutation.isPending ? 'Đang lưu vào WatermelonDB...' : 'Lưu thành ghi chú'}
            </Text>
          </Pressable>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainer
  },
  activeFlash: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 1,
    borderColor: '#FBBF24'
  },
  headerTitle: {
    ...typography.titleMedium,
    color: colors.onSurface,
    fontWeight: '600'
  },
  scrollContent: {
    paddingBottom: 32
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    marginVertical: 18
  },
  sideControlBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    width: 64
  },
  sideControlText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    fontWeight: '500'
  },
  shutterOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent'
  },
  shutterInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  resultsCard: {
    marginHorizontal: 16,
    marginTop: 6,
    borderRadius: 16,
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
  resultsTitle: {
    ...typography.titleMedium,
    color: colors.onSurface,
    fontWeight: '600'
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  pendingText: {
    ...typography.labelSm,
    color: colors.primary
  },
  textBox: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
    minHeight: 140,
    maxHeight: 220,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginBottom: 16
  },
  rawTextInput: {
    ...typography.bodyMedium,
    color: colors.onSurface,
    lineHeight: 22,
    flex: 1
  },
  primarySaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12
  },
  disabledSaveBtn: {
    backgroundColor: colors.surfaceContainerHigh
  },
  primarySaveText: {
    ...typography.labelLarge,
    color: '#0B0F17',
    fontWeight: '600'
  },
  disabledSaveText: {
    color: colors.onSurfaceVariant
  }
});
