import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, radius } from '../theme/colors';
import { ViewfinderOverlay, OCRScanMode } from '../components/ViewfinderOverlay';
import { useOCRMutation } from '../hooks/useOCRMutation';
import { OCRResult } from '../../domain/repositories/IAIService';

export const OCRScannerScreen: React.FC = () => {
  const router = useRouter();
  const [mode, setMode] = useState<OCRScanMode>('text');
  const [flashOn, setFlashOn] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);

  const ocrMutation = useOCRMutation();

  const handleScan = async () => {
    try {
      const response = await ocrMutation.mutateAsync({
        imageUri: 'file:///simulated/camera/scan_document.jpg',
        mode,
        autoCreateNote: false,
        autoExtractTasks: false
      });
      setOcrResult(response.ocrResult);
    } catch (e: any) {
      Alert.alert('Lỗi OCR', e.message || 'Không thể quét tài liệu');
    }
  };

  const handleSaveToNote = async () => {
    if (!ocrResult) return;
    try {
      const response = await ocrMutation.mutateAsync({
        imageUri: 'file:///simulated/camera/scan_document.jpg',
        mode,
        autoCreateNote: true,
        autoExtractTasks: true,
        noteTitle: `OCR ${mode.toUpperCase()} - ${new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit'
        })}`
      });

      if (response.createdNote) {
        Alert.alert(
          'Thành công',
          `Đã tạo ghi chú và tự động trích xuất ${response.extractedTaskCount} việc cần làm!`,
          [
            {
              text: 'Mở ghi chú',
              onPress: () => router.push(`/note-editor/${response.createdNote!.id}`)
            },
            { text: 'Đóng' }
          ]
        );
      }
    } catch (e: any) {
      Alert.alert('Lỗi', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Top Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.circleButton}>
          <Ionicons name="arrow-back" size={20} color={colors.onSurface} />
        </Pressable>

        <View style={styles.headerTitleColumn}>
          <Text style={styles.headerTitle}>Quét Tài Liệu OCR</Text>
          <Text style={styles.headerSubtitle}>Google ML Kit On-Device</Text>
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
          <Pressable style={styles.circleButton}>
            <Ionicons name="camera-reverse-outline" size={18} color={colors.onSurface} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Scanner Viewfinder Simulation */}
        <ViewfinderOverlay
          mode={mode}
          onModeChange={setMode}
          detectedBlocksCount={ocrResult ? ocrResult.blocks.length : 5}
        />

        {/* Shutter Capture Button */}
        <View style={styles.shutterRow}>
          <Pressable
            disabled={ocrMutation.isPending}
            onPress={handleScan}
            style={({ pressed }) => [
              styles.shutterOuter,
              pressed && { transform: [{ scale: 0.95 }] }
            ]}
          >
            <View style={styles.shutterInner}>
              {ocrMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="scan" size={26} color="#FFFFFF" />
              )}
            </View>
          </Pressable>
        </View>

        {/* Real-time OCR Results Drawer */}
        <View style={styles.resultsCard}>
          <View style={styles.resultsHeader}>
            <View style={styles.confidenceRow}>
              <View style={styles.greenDot} />
              <Text style={styles.confidenceText}>
                {ocrResult
                  ? `Độ chính xác ${(ocrResult.confidence * 100).toFixed(1)}% • Tiếng Việt`
                  : 'Sẵn sàng nhận diện on-device (ML Kit)'}
              </Text>
            </View>

            <View style={styles.offlinePill}>
              <Ionicons name="shield-checkmark-outline" size={12} color={colors.tertiary} />
              <Text style={styles.offlinePillText}>100% On-Device</Text>
            </View>
          </View>

          {/* Text Output Box */}
          <View style={styles.textBox}>
            <Text style={styles.rawText}>
              {ocrResult
                ? ocrResult.rawText
                : '1. Kiến trúc Clean Architecture 3 lớp: Domain, Data, Presentation.\n2. Tích hợp WatermelonDB cục bộ đồng bộ hai chiều với Supabase PostgreSQL.\n3. Nhiệm vụ cần làm: Hoàn thành kiểm thử hiệu năng 60fps với FlashList trước ngày 20/11.\n4. Tối ưu hóa mô hình OCR on-device Google ML Kit giảm độ trễ dưới 250ms.'}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.cardActionsRow}>
            <Pressable
              onPress={handleSaveToNote}
              style={({ pressed }) => [styles.primaryActionBtn, pressed && { opacity: 0.85 }]}
            >
              <Ionicons name="document-text-outline" size={16} color="#FFFFFF" />
              <Text style={styles.primaryActionBtnText}>Lưu vào Ghi chú</Text>
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
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant
  },
  circleButton: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center'
  },
  activeFlash: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)'
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
    color: colors.secondary
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8
  },
  scrollContent: {
    paddingBottom: 40
  },
  shutterRow: {
    alignItems: 'center',
    marginVertical: 10
  },
  shutterOuter: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    borderWidth: 3,
    borderColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4
  },
  shutterInner: {
    width: '100%',
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center'
  },
  resultsCard: {
    marginHorizontal: 16,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginTop: 8
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: radius.full,
    backgroundColor: colors.tertiary
  },
  confidenceText: {
    ...typography.labelSm,
    color: colors.onSurface,
    fontWeight: '600'
  },
  offlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full
  },
  offlinePillText: {
    ...typography.labelSm,
    color: colors.tertiaryFixed,
    fontWeight: '700',
    fontSize: 10
  },
  textBox: {
    backgroundColor: colors.surfaceLow,
    borderRadius: radius.md,
    padding: 12,
    minHeight: 110,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginBottom: 14
  },
  rawText: {
    ...typography.bodyMd,
    color: colors.onSurface,
    lineHeight: 20
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 10
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: radius.full
  },
  primaryActionBtnText: {
    ...typography.labelMd,
    color: '#FFFFFF',
    fontWeight: '700'
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    paddingVertical: 12,
    borderRadius: radius.full
  },
  secondaryActionBtnText: {
    ...typography.labelMd,
    color: colors.primary,
    fontWeight: '700'
  }
});
