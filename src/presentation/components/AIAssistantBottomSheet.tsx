import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, radius } from '../theme/colors';
import { useAIStore } from '../stores/useAIStore';
import { AIPromptType } from '../../domain/repositories/IAIService';

interface AIAssistantBottomSheetProps {
  onInsertToNote: (text: string) => void;
  onRequestStream: (type: AIPromptType) => void;
}

export const AIAssistantBottomSheet: React.FC<AIAssistantBottomSheetProps> = ({
  onInsertToNote,
  onRequestStream
}) => {
  const {
    isBottomSheetOpen,
    closeBottomSheet,
    isStreaming,
    streamedContent,
    activePrompt,
    setActivePrompt
  } = useAIStore();

  if (!isBottomSheetOpen) return null;

  const promptOptions: Array<{ type: AIPromptType; label: string; icon: string }> = [
    { type: 'summary', label: 'Tóm tắt ý chính', icon: 'document-text-outline' },
    { type: 'action_items', label: 'Trích việc cần làm', icon: 'checkbox-outline' },
    { type: 'translate', label: 'Dịch tiếng Anh', icon: 'language-outline' },
    { type: 'explain', label: 'Giải thích thuật ngữ', icon: 'bulb-outline' }
  ];

  return (
    <Modal
      visible={isBottomSheetOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={closeBottomSheet}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissArea} onPress={closeBottomSheet} />

        <View style={styles.sheetContainer}>
          {/* Handle */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleRow}>
              <View style={styles.aiBadge}>
                <Ionicons name="sparkles" size={16} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.sheetTitle}>Trợ lý AI Streaming</Text>
                <Text style={styles.sheetSubtitle}>MindVault Copilot • Offline-Ready LLM</Text>
              </View>
            </View>

            <Pressable onPress={closeBottomSheet} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={colors.onSurfaceVariant} />
            </Pressable>
          </View>

          {/* Quick Action Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {promptOptions.map((opt) => {
              const isSelected = activePrompt === opt.type;
              return (
                <Pressable
                  key={opt.type}
                  onPress={() => {
                    setActivePrompt(opt.type);
                    onRequestStream(opt.type);
                  }}
                  style={[styles.chip, isSelected && styles.activeChip]}
                >
                  <Ionicons
                    name={opt.icon as any}
                    size={14}
                    color={isSelected ? colors.onPrimary : colors.primaryFixed}
                  />
                  <Text style={[styles.chipText, isSelected && styles.activeChipText]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Streaming Output Container */}
          <View style={styles.outputBox}>
            <ScrollView style={styles.scrollOutput}>
              {isStreaming && !streamedContent ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.loadingText}>Đang xử lý luồng AI thời gian thực...</Text>
                </View>
              ) : streamedContent ? (
                <View>
                  <Text style={styles.outputText}>{streamedContent}</Text>
                  {isStreaming && <View style={styles.cursor} />}
                </View>
              ) : (
                <Text style={styles.placeholderText}>
                  Chọn một hành động phía trên để AI tóm tắt hoặc trích xuất thông tin ghi chú.
                </Text>
              )}
            </ScrollView>
          </View>

          {/* Bottom Actions */}
          <View style={styles.actionsFooter}>
            <Pressable
              disabled={!streamedContent || isStreaming}
              onPress={() => {
                onInsertToNote(streamedContent);
                closeBottomSheet();
              }}
              style={({ pressed }) => [
                styles.primaryButton,
                (!streamedContent || isStreaming) && styles.disabledButton,
                pressed && { opacity: 0.85 }
              ]}
            >
              <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Chèn vào ghi chú</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end'
  },
  dismissArea: {
    flex: 1
  },
  sheetContainer: {
    backgroundColor: colors.surfaceContainer,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 16,
    paddingBottom: 28,
    maxHeight: '80%',
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.outline,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 14
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  aiBadge: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sheetTitle: {
    ...typography.headlineSm,
    color: colors.onSurface,
    fontWeight: '700'
  },
  sheetSubtitle: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center'
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 6,
    marginBottom: 12
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: colors.outlineVariant
  },
  activeChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  chipText: {
    ...typography.labelMd,
    color: colors.onSurface,
    fontWeight: '600'
  },
  activeChipText: {
    color: '#FFFFFF'
  },
  outputBox: {
    backgroundColor: colors.surfaceLow,
    borderRadius: radius.lg,
    padding: 14,
    minHeight: 180,
    maxHeight: 280,
    borderWidth: 1,
    borderColor: colors.outlineVariant
  },
  scrollOutput: {
    flex: 1
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    gap: 10
  },
  loadingText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant
  },
  outputText: {
    ...typography.bodyMd,
    color: colors.onSurface,
    lineHeight: 22
  },
  cursor: {
    width: 8,
    height: 16,
    backgroundColor: colors.primary,
    marginTop: 4
  },
  placeholderText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 40
  },
  actionsFooter: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.full,
    width: '100%'
  },
  disabledButton: {
    opacity: 0.5
  },
  primaryButtonText: {
    ...typography.labelLg,
    color: '#FFFFFF',
    fontWeight: '700'
  }
});
