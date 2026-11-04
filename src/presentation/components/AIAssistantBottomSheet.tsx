import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, radius } from '../theme/colors';
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

/**
 * Bottom Sheet Trợ lý AI - Thiết kế Tối giản
 * - Chỉ hiển thị phần chữ tóm tắt đang chạy streaming.
 * - Danh sách checkbox Action Items bóc tách được.
 * - 1 nút bấm duy nhất: "Thêm vào việc cần làm".
 */
export const AIAssistantBottomSheet: React.FC<AIAssistantBottomSheetProps> = ({
  onInsertToNote,
  onRequestStream,
  onCreateTasks
}) => {
  const insets = useSafeAreaInsets();
  const {
    isBottomSheetOpen,
    closeBottomSheet,
    isStreaming,
    streamedContent
  } = useAIStore();

  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});

  // Tự động phân tích các dòng gạch đầu dòng / số thứ tự thành Action Items có checkbox
  const actionItems = useMemo<ActionItem[]>(() => {
    if (!streamedContent) return [];
    const lines = streamedContent.split('\n');
    const items: ActionItem[] = [];

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      // Nhận diện các dòng có định dạng danh sách (1., -, *, •, [ ])
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

  // Khởi tạo trạng thái đã chọn cho các items mới
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
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissArea} onPress={closeBottomSheet} />

        <View
          style={[
            styles.sheetContainer,
            { paddingBottom: Math.max(insets.bottom + 12, 28) }
          ]}
        >
          {/* Handle */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleRow}>
              <View style={styles.dot} />
              <Text style={styles.sheetTitle}>Trợ lý AI</Text>
            </View>

            <Pressable onPress={closeBottomSheet} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={colors.onSurfaceVariant} />
            </Pressable>
          </View>

          {/* Streaming Summary Text Area */}
          <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
            {isStreaming && !streamedContent ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>Đang tóm tắt nội dung...</Text>
              </View>
            ) : streamedContent ? (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryText}>{streamedContent}</Text>
                {isStreaming && <View style={styles.cursor} />}
              </View>
            ) : null}

            {/* Checkbox Action Items List */}
            {actionItems.length > 0 && (
              <View style={styles.actionItemsSection}>
                <Text style={styles.actionItemsTitle}>Việc cần làm được trích xuất:</Text>
                {actionItems.map((item) => {
                  const isChecked = selectedItems[item.id] !== false;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => toggleItem(item.id)}
                      style={styles.checkboxRow}
                    >
                      <Ionicons
                        name={isChecked ? 'checkbox' : 'square-outline'}
                        size={18}
                        color={isChecked ? colors.primary : colors.outline}
                      />
                      <Text
                        style={[styles.itemText, !isChecked && styles.unselectedItemText]}
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

          {/* Single Action Button: Thêm vào việc cần làm */}
          <View style={styles.footer}>
            <Pressable
              disabled={isStreaming || actionItems.length === 0}
              onPress={handleAddTasks}
              style={({ pressed }) => [
                styles.primaryBtn,
                (isStreaming || actionItems.length === 0) && styles.disabledBtn,
                pressed && { opacity: 0.85 }
              ]}
            >
              <Ionicons name="add-circle" size={18} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>Thêm vào việc cần làm</Text>
            </Pressable>

            {/* Secondary Link: Chèn vào ghi chú */}
            {streamedContent && !isStreaming ? (
              <Pressable
                onPress={() => {
                  onInsertToNote(streamedContent);
                  closeBottomSheet();
                }}
                style={styles.insertLink}
              >
                <Text style={styles.insertLinkText}>Chèn văn bản vào ghi chú</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end'
  },
  dismissArea: {
    flex: 1
  },
  sheetContainer: {
    backgroundColor: '#161C28', // Flat card #161C28
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    maxHeight: '80%',
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
    marginBottom: 14
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.primary
  },
  sheetTitle: {
    ...typography.headlineSm,
    fontSize: 16,
    fontWeight: '700',
    color: colors.onSurface
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: '#1E2638',
    alignItems: 'center',
    justifyContent: 'center'
  },
  contentScroll: {
    maxHeight: 380,
    marginBottom: 12
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 24,
    justifyContent: 'center'
  },
  loadingText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant
  },
  summaryCard: {
    backgroundColor: '#0E131F',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#222B3D',
    marginBottom: 14
  },
  summaryText: {
    ...typography.bodySm,
    color: colors.onSurface,
    lineHeight: 22,
    fontSize: 13
  },
  cursor: {
    width: 6,
    height: 14,
    backgroundColor: colors.primary,
    marginTop: 4
  },
  actionItemsSection: {
    marginTop: 4
  },
  actionItemsTitle: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(34, 43, 61, 0.4)'
  },
  itemText: {
    ...typography.bodySm,
    color: colors.onSurface,
    fontSize: 13,
    lineHeight: 18,
    flex: 1
  },
  unselectedItemText: {
    color: colors.onSurfaceVariant,
    textDecorationLine: 'line-through'
  },
  footer: {
    marginTop: 8,
    gap: 8
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: radius.full
  },
  disabledBtn: {
    opacity: 0.4
  },
  primaryBtnText: {
    ...typography.labelMd,
    color: '#FFFFFF',
    fontWeight: '600'
  },
  insertLink: {
    alignItems: 'center',
    paddingVertical: 6
  },
  insertLinkText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    fontSize: 12
  }
});
