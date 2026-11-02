import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, radius } from '../theme/colors';
import { useAIStore } from '../stores/useAIStore';
import { AIPromptType } from '../../domain/repositories/IAIService';

interface AIAssistantBottomSheetProps {
  onInsertToNote: (text: string) => void;
  onRequestStream: (type: AIPromptType, customPrompt?: string) => void;
  onCreateTasks?: () => void;
}

export const AIAssistantBottomSheet: React.FC<AIAssistantBottomSheetProps> = ({
  onInsertToNote,
  onRequestStream,
  onCreateTasks
}) => {
  const {
    isBottomSheetOpen,
    closeBottomSheet,
    isStreaming,
    streamedContent,
    activePrompt,
    setActivePrompt
  } = useAIStore();

  const [customInput, setCustomInput] = useState('');

  if (!isBottomSheetOpen) return null;

  const promptOptions: Array<{ type: AIPromptType; label: string; icon: string }> = [
    { type: 'summary', label: 'Tóm tắt ý chính', icon: 'document-text-outline' },
    { type: 'detailed_summary', label: 'Phân tích chi tiết', icon: 'reader-outline' },
    { type: 'action_items', label: 'Trích việc cần làm', icon: 'checkbox-outline' },
    { type: 'critique', label: 'Phản biện & Đóng góp', icon: 'analytics-outline' },
    { type: 'translate', label: 'Dịch tiếng Anh', icon: 'language-outline' },
    { type: 'explain', label: 'Giải thích thuật ngữ', icon: 'bulb-outline' }
  ];

  const quickSuggestions = [
    'Viết email tóm tắt gửi đồng nghiệp',
    'Tạo 3 câu hỏi ôn tập có đáp án',
    'Chỉ ra các điểm cần bổ sung trong kế hoạch',
    'Tóm tắt theo phong cách gạch đầu dòng ngắn nhất'
  ];

  const handleSendCustomPrompt = (queryText?: string) => {
    const textToSend = queryText || customInput;
    if (!textToSend.trim() || isStreaming) return;

    setActivePrompt('custom');
    onRequestStream('custom', textToSend.trim());
    setCustomInput('');
  };

  return (
    <Modal
      visible={isBottomSheetOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={closeBottomSheet}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <Pressable style={styles.dismissArea} onPress={closeBottomSheet} />

        <View style={styles.sheetContainer}>
          {/* Handle Bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleRow}>
              <View style={styles.aiBadge}>
                <Ionicons name="sparkles" size={16} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.sheetTitle}>MindVault AI Copilot</Text>
                <Text style={styles.sheetSubtitle}>Google Gemini • Phân tích tương tác thời gian thực</Text>
              </View>
            </View>

            <View style={styles.headerRightActions}>
              <Pressable
                disabled={isStreaming}
                onPress={() => onRequestStream(activePrompt)}
                style={({ pressed }) => [
                  styles.reloadButton,
                  pressed && { opacity: 0.7 },
                  isStreaming && { opacity: 0.5 }
                ]}
              >
                <Ionicons name="refresh-outline" size={18} color={colors.primaryFixed} />
              </Pressable>

              <Pressable onPress={closeBottomSheet} style={styles.closeButton}>
                <Ionicons name="close" size={20} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>
          </View>

          {/* Quick Action Chips Bar */}
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
            <ScrollView style={styles.scrollOutput} showsVerticalScrollIndicator={true}>
              {isStreaming && !streamedContent ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.loadingText}>Gemini AI đang suy nghĩ và chuẩn bị phát luồng...</Text>
                </View>
              ) : streamedContent ? (
                <View>
                  <Text style={styles.outputText}>{streamedContent}</Text>
                  {isStreaming && <View style={styles.cursor} />}
                </View>
              ) : (
                <Text style={styles.placeholderText}>
                  Chọn một thẻ tác vụ phía trên hoặc gõ câu hỏi tự do vào ô bên dưới để AI trả lời theo ý muốn của bạn.
                </Text>
              )}
            </ScrollView>
          </View>

          {/* Quick suggestions pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsRow}
          >
            {quickSuggestions.map((sug, idx) => (
              <Pressable
                key={idx}
                onPress={() => handleSendCustomPrompt(sug)}
                style={styles.suggestionPill}
              >
                <Ionicons name="sparkles" size={11} color={colors.secondary} />
                <Text style={styles.suggestionPillText}>{sug}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Free-form Custom Prompt Chat Input Bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.customTextInput}
              placeholder="Hỏi AI bất kỳ điều gì về ghi chú này..."
              placeholderTextColor={colors.outline}
              value={customInput}
              onChangeText={setCustomInput}
              onSubmitEditing={() => handleSendCustomPrompt()}
              returnKeyType="send"
            />
            <Pressable
              disabled={!customInput.trim() || isStreaming}
              onPress={() => handleSendCustomPrompt()}
              style={({ pressed }) => [
                styles.sendButton,
                (!customInput.trim() || isStreaming) && styles.disabledSend,
                pressed && { opacity: 0.8 }
              ]}
            >
              <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Bottom Actions Footer */}
          <View style={styles.actionsFooter}>
            {activePrompt === 'action_items' && onCreateTasks && (
              <Pressable
                disabled={!streamedContent || isStreaming}
                onPress={() => {
                  onCreateTasks();
                  closeBottomSheet();
                }}
                style={({ pressed }) => [
                  styles.taskCreateButton,
                  (!streamedContent || isStreaming) && styles.disabledButton,
                  pressed && { opacity: 0.85 }
                ]}
              >
                <Ionicons name="checkbox-outline" size={17} color={colors.secondary} />
                <Text style={styles.taskCreateButtonText}>Lưu thành Nhiệm vụ</Text>
              </Pressable>
            )}

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
      </KeyboardAvoidingView>
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
    paddingBottom: 24,
    maxHeight: '88%',
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
    marginBottom: 12
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  reloadButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)'
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
    marginBottom: 10
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
    minHeight: 160,
    maxHeight: 250,
    borderWidth: 1,
    borderColor: colors.outlineVariant
  },
  scrollOutput: {
    flex: 1
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 18
  },
  loadingText: {
    ...typography.bodyMd,
    color: colors.primaryFixed,
    fontWeight: '500'
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
    color: colors.outline,
    lineHeight: 22,
    fontStyle: 'italic'
  },
  suggestionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8
  },
  suggestionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)'
  },
  suggestionPillText: {
    ...typography.labelSm,
    color: colors.secondary
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceLow,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginTop: 4
  },
  customTextInput: {
    flex: 1,
    ...typography.bodyMd,
    color: colors.onSurface,
    paddingVertical: 4
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  disabledSend: {
    opacity: 0.4
  },
  actionsFooter: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10
  },
  taskCreateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: radius.full,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)'
  },
  taskCreateButtonText: {
    ...typography.labelLg,
    color: colors.secondary,
    fontWeight: '700'
  },
  primaryButton: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: radius.full,
    backgroundColor: colors.primary
  },
  disabledButton: {
    opacity: 0.4
  },
  primaryButtonText: {
    ...typography.labelLg,
    color: '#FFFFFF',
    fontWeight: '700'
  }
});
