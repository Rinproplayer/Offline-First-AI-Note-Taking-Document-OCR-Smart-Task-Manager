import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, radius } from '../theme/colors';
import { AIAssistantBottomSheet } from '../components/AIAssistantBottomSheet';
import { useNoteById, useUpdateNote, useCreateNote, useDeleteNote } from '../hooks/useNotesQuery';
import { useAISummaryStream } from '../hooks/useAISummaryStream';
import { useAIStore } from '../stores/useAIStore';
import { useTheme } from '../stores/useThemeStore';
import { AIPromptType } from '../../domain/repositories/IAIService';
import { watermelonTaskRepository } from '../../data/repositories/WatermelonTaskRepository';

/**
 * Màn hình Soạn thảo Ghi chú (Note Editor Screen) - Phong cách Tối giản Notion / Craft
 * - Hỗ trợ cả 2 giao diện Sáng / Tối.
 * - Giao diện viết chữ tràn viền, sạch sẽ, không có thanh công cụ rườm rà.
 * - Tự động hiển thị trạng thái lưu trữ bằng chấm nhỏ tinh tế.
 * - Tích hợp AI Copilot gọn gàng mở Bottom Sheet tóm tắt & trích xuất việc cần làm.
 */
export const NoteEditorScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = !id || id === 'new';

  // TanStack Query & WatermelonDB
  const { data: existingNote } = useNoteById(isNew ? '' : (id as string));
  const updateNoteMutation = useUpdateNote();
  const createNoteMutation = useCreateNote();
  const deleteNoteMutation = useDeleteNote();

  // Zustand & Streaming LLM
  const { startStream, streamActionItems } = useAISummaryStream();
  const { openBottomSheet } = useAIStore();

  // Local Editor State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaved, setIsSaved] = useState(true);

  // Nạp dữ liệu ghi chú khi mở (mới thì để trống 100%)
  useEffect(() => {
    if (existingNote) {
      setTitle(existingNote.title);
      setContent(existingNote.content);
      setIsSaved(true);
    } else if (isNew) {
      setTitle('');
      setContent('');
      setIsSaved(false);
    }
  }, [existingNote, isNew]);

  /**
   * Lưu ghi chú vào WatermelonDB
   */
  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập tiêu đề ghi chú trước khi lưu.');
      return;
    }

    try {
      if (isNew) {
        const created = await createNoteMutation.mutateAsync({
          title: title.trim(),
          content,
          tags: ['GhiChu'],
          isPinned: false,
          isArchived: false,
          hasOcr: false
        });
        setIsSaved(true);
        router.replace(`/note-editor/${created.id}`);
      } else {
        await updateNoteMutation.mutateAsync({
          id: id as string,
          updates: { title: title.trim(), content }
        });
        setIsSaved(true);
      }
    } catch (err: any) {
      Alert.alert('Lỗi lưu trữ', err.message || 'Không thể lưu ghi chú.');
    }
  }, [title, content, isNew, id, createNoteMutation, updateNoteMutation, router]);

  /**
   * Yêu cầu AI xử lý
   */
  const handleRequestStream = useCallback(
    (promptType: AIPromptType, customPrompt?: string) => {
      const textToAnalyze = content.trim() || title.trim();
      startStream(isNew ? '' : (id || ''), textToAnalyze, promptType, customPrompt);
    },
    [startStream, content, title, isNew, id]
  );

  const handleOpenAI = useCallback(
    (promptType: AIPromptType, customPrompt?: string) => {
      openBottomSheet(promptType);
      handleRequestStream(promptType, customPrompt);
    },
    [openBottomSheet, handleRequestStream]
  );

  /**
   * Tạo nhiệm vụ từ Action Items được AI trích xuất
   */
  const handleCreateTasks = useCallback(
    async (customTasks?: string[]) => {
      try {
        if (customTasks && customTasks.length > 0) {
          for (const taskTitle of customTasks) {
            await watermelonTaskRepository.createTask({
              noteId: isNew ? undefined : (id || undefined),
              title: taskTitle,
              priority: 'medium',
              dueDate: new Date(Date.now() + 86400000 * 2),
              status: 'pending',
              isCompleted: false,
              source: 'ai_extracted'
            });
          }
          Alert.alert(
            'Thành công! ✅',
            `Đã thêm ${customTasks.length} nhiệm vụ mới vào Task Tracker.`,
            [
              { text: 'Mở Danh sách Việc', onPress: () => router.push('/tasks') },
              { text: 'Ở lại soạn thảo' }
            ]
          );
          return;
        }

        const textToAnalyze = content.trim() || title.trim();
        const res = await streamActionItems(isNew ? '' : (id || ''), textToAnalyze);
        Alert.alert('Thành công! ✅', `Đã trích xuất ${res.createdTasks.length} nhiệm vụ mới.`);
      } catch (err: any) {
        Alert.alert('Lỗi tạo nhiệm vụ', err.message);
      }
    },
    [content, title, isNew, id, streamActionItems, router]
  );

  const handleInsertSummary = (text: string) => {
    setContent((prev) => `${prev}\n\n${text}`);
    setIsSaved(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Minimal Top Bar (Notion Style) */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: insets.top + 6,
            borderBottomColor: colors.outlineVariant
          }
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
        </Pressable>

        {/* Status Dot */}
        <View style={styles.statusRow}>
          <View style={[styles.dot, !isSaved && styles.unsavedDot]} />
          <Text style={[styles.statusText, { color: colors.onSurfaceVariant }]}>
            {isSaved ? 'Đã lưu' : 'Chưa lưu'}
          </Text>
        </View>

        {/* Right Actions: AI, Save & Delete */}
        <View style={styles.actionsRow}>
          {!isNew && (
            <Pressable
              hitSlop={12}
              onPress={() => {
                Alert.alert(
                  'Xóa ghi chú',
                  'Bạn có chắc chắn muốn xóa ghi chú này không?',
                  [
                    { text: 'Hủy', style: 'cancel' },
                    {
                      text: 'Xóa',
                      style: 'destructive',
                      onPress: async () => {
                        await deleteNoteMutation.mutateAsync(id as string);
                        router.back();
                      }
                    }
                  ]
                );
              }}
              style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.6 }]}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </Pressable>
          )}

          <Pressable
            onPress={() => handleOpenAI('summary')}
            style={({ pressed }) => [
              styles.aiPill,
              {
                backgroundColor: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(79, 70, 229, 0.1)',
                borderColor: isDark ? 'rgba(99, 102, 241, 0.25)' : 'rgba(79, 70, 229, 0.25)'
              },
              pressed && { opacity: 0.75 }
            ]}
          >
            <Ionicons name="sparkles" size={14} color={colors.primary} />
            <Text style={[styles.aiPillText, { color: colors.primary }]}>AI</Text>
          </Pressable>

          <Pressable
            onPress={handleSave}
            disabled={updateNoteMutation.isPending || createNoteMutation.isPending}
            style={({ pressed }) => [
              styles.saveBtn,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.75 }
            ]}
          >
            <Text style={styles.saveBtnText}>
              {updateNoteMutation.isPending || createNoteMutation.isPending ? 'Đang lưu' : 'Lưu'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Full-bleed Minimalist Writing Canvas */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.canvasContent,
          { paddingBottom: insets.bottom + 80 }
        ]}
      >
        {/* Title Input */}
        <TextInput
          style={[styles.titleInput, { color: colors.onSurface }]}
          placeholder="Tiêu đề..."
          placeholderTextColor={colors.onSurfaceVariant}
          value={title}
          onChangeText={(val) => {
            setTitle(val);
            setIsSaved(false);
          }}
          multiline
        />

        {/* Body Text Input */}
        <TextInput
          style={[styles.bodyInput, { color: colors.onSurface }]}
          placeholder="Bắt đầu viết ghi chú..."
          placeholderTextColor={colors.onSurfaceVariant}
          value={content}
          onChangeText={(val) => {
            setContent(val);
            setIsSaved(false);
          }}
          multiline
          textAlignVertical="top"
        />
      </ScrollView>

      {/* Floating Action Bar at Bottom */}
      <View
        style={[
          styles.floatingBottomBar,
          {
            bottom: Math.max(insets.bottom + 12, 20),
            backgroundColor: colors.surfaceContainer,
            borderColor: colors.outlineVariant
          }
        ]}
      >
        <Pressable
          onPress={() => router.push('/ocr')}
          style={({ pressed }) => [
            styles.floatingPill,
            {
              backgroundColor: isDark ? '#1E2638' : '#F1F5F9',
              borderColor: colors.outlineVariant
            },
            pressed && { opacity: 0.75 }
          ]}
        >
          <Ionicons name="camera-outline" size={15} color={colors.secondary} />
          <Text style={[styles.floatingPillText, { color: colors.onSurface }]}>Quét OCR</Text>
        </Pressable>

        <Pressable
          onPress={() => handleOpenAI('summary')}
          style={({ pressed }) => [
            styles.floatingPill,
            {
              backgroundColor: isDark ? '#1E2638' : '#F1F5F9',
              borderColor: colors.outlineVariant
            },
            pressed && { opacity: 0.75 }
          ]}
        >
          <Ionicons name="sparkles-outline" size={15} color={colors.primary} />
          <Text style={[styles.floatingPillText, { color: colors.onSurface }]}>Tóm tắt AI</Text>
        </Pressable>

        <Pressable
          onPress={() => handleOpenAI('action_items')}
          style={({ pressed }) => [
            styles.floatingPill,
            {
              backgroundColor: isDark ? '#1E2638' : '#F1F5F9',
              borderColor: colors.outlineVariant
            },
            pressed && { opacity: 0.75 }
          ]}
        >
          <Ionicons name="checkbox-outline" size={15} color={colors.tertiary} />
          <Text style={[styles.floatingPillText, { color: colors.onSurface }]}>Trích việc</Text>
        </Pressable>
      </View>

      {/* Modal Bottom Sheet Trợ lý AI Streaming */}
      <AIAssistantBottomSheet
        onInsertToNote={handleInsertSummary}
        onRequestStream={handleRequestStream}
        onCreateTasks={handleCreateTasks}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background // #0B0F17
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#161C28'
  },
  backBtn: {
    padding: 4
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: '#10B981'
  },
  unsavedDot: {
    backgroundColor: colors.warning
  },
  statusText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    fontSize: 12
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  deleteBtn: {
    padding: 6,
    marginRight: 2
  },
  aiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)'
  },
  aiPillText: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: '700'
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full
  },
  saveBtnText: {
    ...typography.labelSm,
    color: '#FFFFFF',
    fontWeight: '600'
  },
  canvasContent: {
    paddingHorizontal: 22,
    paddingTop: 20
  },
  titleInput: {
    ...typography.headlineMd,
    fontSize: 24,
    fontWeight: '700',
    color: colors.onSurface,
    lineHeight: 32,
    marginBottom: 16,
    padding: 0
  },
  bodyInput: {
    ...typography.bodyLg,
    fontSize: 16,
    color: colors.onSurface,
    lineHeight: 26,
    minHeight: 400,
    padding: 0
  },
  floatingBottomBar: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#161C28',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#222B3D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },
  floatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: '#1E2638'
  },
  floatingPillText: {
    ...typography.labelSm,
    color: colors.onSurface,
    fontSize: 12,
    fontWeight: '500'
  }
});
