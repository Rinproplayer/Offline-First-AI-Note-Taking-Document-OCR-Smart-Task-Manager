import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, radius } from '../theme/colors';

export type OCRScanMode = 'text' | 'receipt' | 'latex' | 'table';

interface ViewfinderOverlayProps {
  mode: OCRScanMode;
  onModeChange: (mode: OCRScanMode) => void;
  detectedBlocksCount: number;
  imageUri?: string | null;
}

export const ViewfinderOverlay: React.FC<ViewfinderOverlayProps> = ({
  mode,
  onModeChange,
  detectedBlocksCount,
  imageUri
}) => {
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
    outputRange: [0, 220]
  });

  const modes: Array<{ id: OCRScanMode; label: string; icon: string }> = [
    { id: 'text', label: 'Văn bản', icon: 'document-text-outline' },
    { id: 'receipt', label: 'Biên lai', icon: 'receipt-outline' },
    { id: 'latex', label: 'Công thức', icon: 'calculator-outline' },
    { id: 'table', label: 'Bảng biểu', icon: 'grid-outline' }
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
              style={[styles.modeChip, isSelected && styles.activeModeChip]}
            >
              <Ionicons
                name={m.icon as any}
                size={13}
                color={isSelected ? colors.onSecondary : colors.onSurfaceVariant}
              />
              <Text style={[styles.modeChipText, isSelected && styles.activeModeChipText]}>
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
            <Ionicons name="camera-outline" size={36} color="rgba(255,255,255,0.3)" />
            <Text style={styles.placeholderTip}>Hướng camera vào tài liệu hoặc chữ viết tay</Text>
          </View>
        )}

        {/* Corner Brackets */}
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />

        {/* Animated Laser Scanning Line */}
        <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]}>
          <View style={styles.scanLineGlow} />
        </Animated.View>

        {/* Real-time Bounding Boxes Overlay Simulation */}
        <View style={styles.boundingBox1}>
          <Text style={styles.boundingTag}>ML Kit • 99.2%</Text>
        </View>
        <View style={styles.boundingBox2}>
          <Text style={styles.boundingTag}>Tiếng Việt • 98.6%</Text>
        </View>

        {/* Detection Status Pill */}
        <View style={styles.detectionStatus}>
          <View style={styles.detectionDot} />
          <Text style={styles.detectionText}>
            Phát hiện {detectedBlocksCount} đoạn văn bản • Google ML Kit
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 12
  },
  modesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14
  },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: 'rgba(34, 42, 61, 0.75)',
    borderWidth: 1,
    borderColor: colors.outlineVariant
  },
  activeModeChip: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary
  },
  modeChipText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    fontWeight: '600'
  },
  activeModeChipText: {
    color: colors.onSecondary,
    fontWeight: '700'
  },
  viewport: {
    width: '94%',
    height: 250,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(6, 14, 32, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'space-between',
    padding: 16
  },
  capturedImage: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.xl
  },
  placeholderContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20
  },
  placeholderTip: {
    ...typography.bodySm,
    color: 'rgba(255, 255, 255, 0.45)',
    textAlign: 'center',
    marginTop: 8
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: colors.secondary
  },
  topLeft: {
    top: 12,
    left: 12,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 6
  },
  topRight: {
    top: 12,
    right: 12,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 6
  },
  bottomLeft: {
    bottom: 12,
    left: 12,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 6
  },
  bottomRight: {
    bottom: 12,
    right: 12,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 6
  },
  scanLine: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 12,
    height: 2,
    backgroundColor: colors.secondary,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8
  },
  scanLineGlow: {
    height: 14,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    marginTop: -6
  },
  boundingBox1: {
    position: 'absolute',
    top: 50,
    left: 30,
    right: 30,
    height: 38,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.secondary,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 4,
    padding: 2
  },
  boundingBox2: {
    position: 'absolute',
    top: 105,
    left: 30,
    right: 50,
    height: 34,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.tertiary,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 4,
    padding: 2
  },
  boundingTag: {
    fontSize: 9,
    color: colors.secondary,
    fontWeight: '700'
  },
  detectionStatus: {
    position: 'absolute',
    bottom: 14,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(11, 19, 38, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.outlineVariant
  },
  detectionDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.tertiary
  },
  detectionText: {
    ...typography.labelSm,
    color: colors.onSurface
  }
});
