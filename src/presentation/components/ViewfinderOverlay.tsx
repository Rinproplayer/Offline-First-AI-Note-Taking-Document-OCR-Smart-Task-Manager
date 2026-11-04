import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, radius } from '../theme/colors';
import { useTheme } from '../stores/useThemeStore';

export type OCRScanMode = 'text' | 'receipt' | 'latex' | 'table';

interface ViewfinderOverlayProps {
  mode: OCRScanMode;
  onModeChange: (mode: OCRScanMode) => void;
  detectedBlocksCount?: number;
  imageUri?: string | null;
}

/**
 * Khung ngắm OCR - Tối giản & Tập trung
 * - Bỏ toàn bộ các nhãn phần trăm độ tin cậy rối mắt.
 * - Chỉ giữ khung viền nhận diện tài liệu và tia quét laser chuyển động.
 */
export const ViewfinderOverlay: React.FC<ViewfinderOverlayProps> = ({
  mode,
  onModeChange,
  imageUri
}) => {
  const { colors, isDark } = useTheme();
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true
        })
      ])
    ).start();
  }, [scanLineAnim]);

  const translateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200]
  });

  const modes: Array<{ id: OCRScanMode; label: string }> = [
    { id: 'text', label: 'Văn bản' },
    { id: 'receipt', label: 'Hóa đơn' },
    { id: 'latex', label: 'Toán học' },
    { id: 'table', label: 'Bảng biểu' }
  ];

  return (
    <View style={styles.container}>
      {/* Mode Chips Bar */}
      <View style={styles.modesRow}>
        {modes.map((m) => {
          const isSelected = mode === m.id;
          return (
            <Pressable
              key={m.id}
              onPress={() => onModeChange(m.id)}
              style={[
                styles.modeChip,
                {
                  backgroundColor: colors.surfaceContainer,
                  borderColor: colors.outlineVariant
                },
                isSelected && {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary
                }
              ]}
            >
              <Text
                style={[
                  styles.modeChipText,
                  { color: colors.onSurfaceVariant },
                  isSelected && { color: '#0B0F17', fontWeight: '700' }
                ]}
              >
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Frame Viewport */}
      <View style={styles.viewport}>
        {/* Real captured/picked image */}
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.capturedImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <Ionicons name="scan-outline" size={32} color="rgba(255,255,255,0.25)" />
            <Text style={styles.placeholderTip}>Căn chỉnh tài liệu bên trong khung viền</Text>
          </View>
        )}

        {/* 4 Clean Corner Brackets */}
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />

        {/* Animated Laser Scanning Line */}
        <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]}>
          <View style={styles.scanLineGlow} />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10
  },
  modesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12
  },
  modeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: '#161C28',
    borderWidth: 1,
    borderColor: '#222B3D'
  },
  activeModeChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  modeChipText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '500'
  },
  activeModeChipText: {
    color: '#FFFFFF',
    fontWeight: '600'
  },
  viewport: {
    width: '92%',
    height: 220,
    borderRadius: 16,
    backgroundColor: '#0E131F',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    position: 'relative',
    overflow: 'hidden'
  },
  capturedImage: {
    ...StyleSheet.absoluteFill,
    borderRadius: 16
  },
  placeholderContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20
  },
  placeholderTip: {
    ...typography.bodySm,
    color: 'rgba(255, 255, 255, 0.35)',
    textAlign: 'center',
    fontSize: 12
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: colors.primary
  },
  topLeft: {
    top: 10,
    left: 10,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5
  },
  topRight: {
    top: 10,
    right: 10,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5
  },
  bottomLeft: {
    bottom: 10,
    left: 10,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5
  },
  bottomRight: {
    bottom: 10,
    right: 10,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5
  },
  scanLine: {
    width: '100%',
    height: 2,
    backgroundColor: colors.primary,
    position: 'absolute',
    top: 0
  },
  scanLineGlow: {
    position: 'absolute',
    top: -4,
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.25)'
  }
});
