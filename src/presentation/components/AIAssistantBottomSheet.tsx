import React, { useState, useEffect, useMemo } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, radius } from '../theme/colors';
import { useTheme } from '../stores/useThemeStore';
import { useAIStore } from '../stores/useAIStore';
import { AIPromptType } from '../../domain/repositories/IAIService';

interface AIAssistantBottomSheetProps {
  onInsertToNote: (text: string) => void;
  onRequestStream: (type: AIPromptType, customPrompt?: string) => void;
  onCreateTasks?: (tasks?: string[]) => void;
}

interface ActionItem {
  id: string;
  text: string;
  selected: boolean;
}

const PROMPT_PRESETS: { type: AIPromptType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { type: 'summary', label: 'Tóm tắt', icon: 'document-text-outline' },
  { type: 'action_items', label: 'Trích việc', icon: 'checkbox-outline' },
  { type: 'translate', label: 'Dịch thuật', icon: 'language-outline' },
  { type: 'explain', label: 'Giải thích', icon: 'bulb-outline' },
  { type: 'critique', label: 'Phản biện', icon: 'analytics-outline' }
];

/**
 * Bottom Sheet Trợ lý AI - Thiết kế Tối giản & Mạnh mẽ
 * - Hỗ trợ đầy đủ các tính năng: Tóm tắt, Trích việc, Dịch thuật, Giải thích, Phản biện.
 * - Ô nhập câu hỏi tùy ý người dùng ("Hỏi AI bất kỳ điều gì...").
 * - Luồng chữ Streaming thời gian thực mượt mà 60fps.
 * - Danh sách Action Items kèm checkbox & nút thêm vào Task Tracker.
 */
export const AIAssistantBottomSheet: React.FC<AIAssistantBottomSheetProps> = ({
  onInsertToNote,
  onRequestStream,
  onCreateTasks
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const {
    isBottomSheetOpen,
    closeBottomSheet,
    isStreaming,
    streamedContent,
    activePrompt,
    setActivePrompt
  } = useAIStore();

  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [customQuestion, setCustomQuestion] = useState('');

  // Tự động phân tích các dòng gạch đầu dòng / số thứ tự thành Action Items có checkbox
  const actionItems = useMemo<ActionItem[]>(() => {
    if (!streamedContent) return [];
    const lines = streamedContent.split('\n');
    const items: ActionItem[] = [];

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (/^[0-9]+[\.\)]|^\s*[-*•]\s*(\[[ xX]?\])?/.test(trimmed)) {
        const cleaned = trimmed
          .replace(/^[0-9]+[\.\)]|^\s*[-*•]\s*(\[[ xX]?\])?/, '')
          .replace(/\[(Ưu tiên|Hạn|Priority|Cao|Trung bình|Thấp)[^\]]*\]/gi, '')
          .trim();

        if (cleaned.length > 3) {
          items.push({
            id: `item_${idx}`,
            text: cleaned,
            selected: true
          });
        }
      }
    });

    return items;
  }, [streamedContent]);

  useEffect(() => {
    if (actionItems.length > 0) {
      const initial: Record<string, boolean> = {};
      actionItems.forEach((item) => {
        initial[item.id] = true;
      });
      setSelectedItems(initial);
    }
  }, [actionItems]);

  if (!isBottomSheetOpen) return null;

  const toggleItem = (id: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSelectPreset = (type: AIPromptType) => {
    if (isStreaming) return;
    setActivePrompt(type);
    setCustomQuestion('');
    onRequestStream(type);
  };

  const handleSendCustomQuestion = () => {
    const q = customQuestion.trim();
    if (!q || isStreaming) return;
    onRequestStream(activePrompt, q);
    setCustomQuestion('');
  };

  const handleAddTasks = () => {
    const tasksToAdd = actionItems
      .filter((item) => selectedItems[item.id] !== false)
      .map((item) => item.text);

    if (onCreateTasks) {
      onCreateTasks(tasksToAdd);
    }
    closeBottomSheet();
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

        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: colors.surfaceContainer,
              borderTopColor: colors.outlineVariant,
              paddingBottom: Math.max(insets.bottom + 12, 24)
            }
          ]}
        >
          {/* Handle */}
          <View style={[styles.handleBar, { backgroundColor: colors.outlineVariant }]} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleRow}>
              <View style={styles.dot} />
              <Text style={[styles.sheetTitle, { color: colors.onSurface }]}>MindVault AI Copilot</Text>
            </View>

            <Pressable
              onPress={closeBottomSheet}
              hitSlop={12}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceContainerHigh }]}
            >
              <Ionicons name="close" size={18} color={colors.onSurfaceVariant} />
            </Pressable>
          </View>

          {/* Prompt Presets Horizontal Scroll */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetsRow}
          >
            {PROMPT_PRESETS.map((preset) => {
              const isActive = activePrompt === preset.type;
              return (
                <Pressable
                  key={preset.type}
                  disabled={isStreaming}
                  onPress={() => handleSelectPreset(preset.type)}
                  style={[
                    styles.presetPill,
                    {
                      backgroundColor: isDark ? colors.background : colors.surface,
                      borderColor: colors.outlineVariant
                    },
                    isActive && {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary
                    },
                    isStreaming && { opacity: 0.5 }
                  ]}
                >
                  <Ionicons
                    name={preset.icon}
                    size={14}
                    color={isActive ? '#FFFFFF' : colors.onSurfaceVariant}
                  />
                  <Text
                    style={[
                      styles.presetText,
                      { color: colors.onSurfaceVariant },
                      isActive && styles.activePresetText
                    ]}
                  >
                    {preset.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Custom Question Input Row */}
          <View
            style={[
              styles.questionInputRow,
              {
                backgroundColor: isDark ? colors.background : colors.surface,
                borderColor: colors.outlineVariant
              }
            ]}
          >
            <TextInput
              style={[styles.questionInput, { color: colors.onSurface }]}
              placeholder="Hỏi AI bất kỳ điều gì về ghi chú này..."
              placeholderTextColor={colors.onSurfaceVariant}
              value={customQuestion}
              onChangeText={setCustomQuestion}
              onSubmitEditing={handleSendCustomQuestion}
              returnKeyType="send"
              editable={!isStreaming}
            />
            <Pressable
              disabled={isStreaming || !customQuestion.trim()}
              onPress={handleSendCustomQuestion}
              style={({ pressed }) => [
                styles.sendBtn,
                { backgroundColor: colors.primary },
                (!customQuestion.trim() || isStreaming) && {
                  backgroundColor: colors.surfaceContainerHigh
                },
                pressed && { opacity: 0.8 }
              ]}
            >
              <Ionicons
                name="arrow-up"
                size={16}
                color={customQuestion.trim() && !isStreaming ? '#FFFFFF' : colors.onSurfaceVariant}
              />
            </Pressable>
          </View>

          {/* Streaming Text Output Area */}
          <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
            {isStreaming && !streamedContent ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
                  Đang xử lý nội dung với Gemini 3.5...
                </Text>
              </View>
            ) : streamedContent ? (
              <View
                style={[
                  styles.summaryCard,
                  {
                    backgroundColor: isDark ? colors.background : colors.surface,
                    borderColor: colors.outlineVariant
                  }
                ]}
              >
                <Text style={[styles.summaryText, { color: colors.onSurface }]}>
                  {streamedContent}
                </Text>
                {isStreaming && <View style={[styles.cursor, { backgroundColor: colors.primary }]} />}
              </View>
            ) : null}

            {/* Checkbox Action Items List */}
            {actionItems.length > 0 && (
              <View style={styles.actionItemsSection}>
                <Text style={[styles.actionItemsTitle, { color: colors.primary }]}>
                  Việc cần làm được trích xuất:
                </Text>
                {actionItems.map((item) => {
                  const isChecked = selectedItems[item.id] !== false;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => toggleItem(item.id)}
                      style={[
                        styles.checkboxRow,
                        { borderBottomColor: colors.outlineVariant }
                      ]}
                    >
                      <Ionicons
                        name={isChecked ? 'checkbox' : 'square-outline'}
                        size={18}
                        color={isChecked ? colors.primary : colors.outline}
                      />
                      <Text
                        style={[
                          styles.itemText,
                          { color: colors.onSurface },
                          !isChecked && styles.unselectedItemText
                        ]}
                        numberOfLines={2}
                      >
                        {item.text}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Bottom Actions */}
          <View style={styles.footer}>
            {actionItems.length > 0 ? (
              <Pressable
                disabled={isStreaming}
                onPress={handleAddTasks}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  { backgroundColor: colors.primary },
                  isStreaming && styles.disabledBtn,
                  pressed && { opacity: 0.85 }
                ]}
              >
                <Ionicons name="add-circle" size={18} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>Thêm vào việc cần làm</Text>
              </Pressable>
            ) : null}

            {streamedContent && !isStreaming ? (
              <Pressable
                onPress={() => {
                  onInsertToNote(streamedContent);
                  closeBottomSheet();
                }}
                style={styles.insertLink}
              >
                <Ionicons name="return-down-forward" size={15} color={colors.primary} />
                <Text style={[styles.insertLinkText, { color: colors.primary }]}>
                  Chèn văn bản vào ghi chú
                </Text>
              </Pressable>
            ) : null}
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
    backgroundColor: '#161C28',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 18,
    maxHeight: '85%',
    borderTopWidth: 1,
    borderTopColor: '#222B3D'
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: '#2A364F',
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
    gap: 8
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981'
  },
  sheetTitle: {
    ...typography.titleMedium,
    color: '#F1F5F9',
    fontWeight: '700'
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#222B3D',
    alignItems: 'center',
    justifyContent: 'center'
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 10
  },
  presetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#0B0F17',
    borderWidth: 1,
    borderColor: '#222B3D'
  },
  activePresetPill: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  presetText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    fontWeight: '600'
  },
  activePresetText: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  questionInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B0F17',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#222B3D',
    marginBottom: 10,
    gap: 8
  },
  questionInput: {
    flex: 1,
    ...typography.bodySm,
    color: '#F1F5F9'
  },
  sendBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  disabledSendBtn: {
    backgroundColor: '#222B3D'
  },
  contentScroll: {
    maxHeight: 280,
    marginVertical: 4
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 24
  },
  loadingText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant
  },
  summaryCard: {
    backgroundColor: '#0B0F17',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#222B3D'
  },
  summaryText: {
    ...typography.bodyMd,
    color: '#F1F5F9',
    lineHeight: 22
  },
  cursor: {
    width: 6,
    height: 14,
    backgroundColor: colors.primary,
    marginTop: 4
  },
  actionItemsSection: {
    marginTop: 12,
    paddingTop: 8
  },
  actionItemsTitle: {
    ...typography.labelMd,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 8
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#222B3D'
  },
  itemText: {
    flex: 1,
    ...typography.bodySm,
    color: '#F1F5F9'
  },
  unselectedItemText: {
    textDecorationLine: 'line-through',
    color: '#64748B'
  },
  footer: {
    marginTop: 12,
    gap: 8
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12
  },
  disabledBtn: {
    opacity: 0.5
  },
  primaryBtnText: {
    ...typography.labelMd,
    color: '#FFFFFF',
    fontWeight: '700'
  },
  insertLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8
  },
  insertLinkText: {
    ...typography.labelMd,
    color: colors.primary,
    fontWeight: '600'
  }
});
