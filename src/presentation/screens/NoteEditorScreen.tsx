import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  StatusBar,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, typography, radius } from '../theme/colors';
import { AIAssistantBottomSheet } from '../components/AIAssistantBottomSheet';
import { useNoteById, useUpdateNote, useCreateNote } from '../hooks/useNotesQuery';
import { useAISummaryStream } from '../hooks/useAISummaryStream';
import { useAIStore } from '../stores/useAIStore';
import { AIPromptType } from '../../domain/repositories/IAIService';

export const NoteEditorScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = !id || id === 'new';

  const { data: existingNote } = useNoteById(isNew ? '' : (id as string));
  const updateNoteMutation = useUpdateNote();
  const createNoteMutation = useCreateNote();
  const { startStream } = useAISummaryStream();
  const { openBottomSheet } = useAIStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>(['CleanArchitecture', 'OfflineFirst']);
  const [isSaved, setIsSaved] = useState(true);

  useEffect(() => {
    if (existingNote) {
      setTitle(existingNote.title);
      setContent(existingNote.content);
      setTags(existingNote.tags || []);
    } else if (isNew) {
      setTitle('Biên bản họp Capstone - Tích hợp Supabase & WatermelonDB');
      setContent(
        '1. Mục tiêu kiến trúc:\n- Tuân thủ nghiêm ngặt 3 lớp: Domain, Data, Presentation.\n- Domain hoàn toàn độc lập, không import UI hay SDK bên ngoài.\n\n2. Xử lý dữ liệu Offline-First:\n- WatermelonDB lưu trữ trực tiếp trên máy với SQLite adapter.\n- Supabase PostgreSQL đồng bộ hai chiều khi có mạng.\n\n3. Trợ lý AI và OCR:\n- Google ML Kit nhận diện văn bản on-device dưới 250ms.\n- LLM SSE client phát luồng tóm tắt trực tiếp.'
      );
    }
  }, [existingNote, isNew]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập tiêu đề ghi chú');
      return;
    }

    if (isNew) {
      const created = await createNoteMutation.mutateAsync({
        title,
        content,
        tags,
        isPinned: false,
        isArchived: false,
        hasOcr: false
      });
      setIsSaved(true);
      router.replace(`/note-editor/${created.id}`);
    } else {
      await updateNoteMutation.mutateAsync({
        id: id as string,
        updates: { title, content, tags }
      });
      setIsSaved(true);
    }
  };

  const handleRequestStream = (promptType: AIPromptType) => {
    startStream(id || 'temp_note', content, promptType);
  };

  const handleInsertSummary = (text: string) => {
    setContent((prev) => `${prev}\n\n${text}`);
    setIsSaved(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Editor Top Navigation Bar */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.circleButton, pressed && { opacity: 0.75 }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.onSurface} />
        </Pressable>

        <View style={styles.statusPill}>
          <View style={styles.savedDot} />
          <Text style={styles.savedText}>{isSaved ? 'Đã lưu WatermelonDB' : 'Chưa lưu'}</Text>
        </View>

        <View style={styles.rightActionsRow}>
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [styles.saveButton, pressed && { opacity: 0.75 }]}
          >
            <Ionicons name="cloud-upload-outline" size={16} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>Lưu</Text>
          </Pressable>

          <Pressable style={styles.circleButton}>
            <Ionicons name="ellipsis-vertical" size={18} color={colors.onSurface} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.editorContent}
      >
        {/* Title Input */}
        <TextInput
          style={styles.titleInput}
          placeholder="Tiêu đề ghi chú..."
          placeholderTextColor={colors.outline}
          value={title}
          onChangeText={(val) => {
            setTitle(val);
            setIsSaved(false);
          }}
          multiline
        />

        {/* Tags Row */}
        <View style={styles.tagsRow}>
          {tags.map((t, idx) => (
            <View key={idx} style={styles.tagChip}>
              <Text style={styles.tagText}>#{t}</Text>
            </View>
          ))}
          <Pressable style={styles.addTagButton}>
            <Ionicons name="add" size={14} color={colors.primaryFixed} />
            <Text style={styles.addTagText}>Thêm thẻ</Text>
          </Pressable>
        </View>

        {/* Luminous AI Copilot Banner */}
        <Pressable
          onPress={() => openBottomSheet('summary')}
          style={({ pressed }) => [styles.aiBanner, pressed && { opacity: 0.9 }]}
        >
          <View style={styles.aiBannerLeft}>
            <View style={styles.aiIconBubble}>
              <Ionicons name="sparkles" size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.aiBannerTitle}>MindVault AI Copilot</Text>
              <Text style={styles.aiBannerSub}>Chạm để tóm tắt hoặc trích xuất việc cần làm</Text>
            </View>
          </View>
          <View style={styles.aiButtonPill}>
            <Text style={styles.aiButtonText}>Mở AI</Text>
            <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
          </View>
        </Pressable>

        {/* Note Body Text Input */}
        <TextInput
          style={styles.bodyInput}
          placeholder="Bắt đầu ghi chú hoặc dán nội dung từ tài liệu OCR..."
          placeholderTextColor={colors.outline}
          value={content}
          onChangeText={(val) => {
            setContent(val);
            setIsSaved(false);
          }}
          multiline
          textAlignVertical="top"
        />
      </ScrollView>

      {/* Formatting Toolbar */}
      <View style={styles.toolbar}>
        <Pressable style={styles.toolIcon}>
          <Ionicons name="text" size={18} color={colors.onSurface} />
        </Pressable>
        <Pressable style={styles.toolIcon}>
          <Ionicons name="list" size={18} color={colors.onSurface} />
        </Pressable>
        <Pressable style={styles.toolIcon}>
          <Ionicons name="checkbox-outline" size={18} color={colors.onSurface} />
        </Pressable>
        <Pressable style={styles.toolIcon}>
          <Ionicons name="code-slash" size={18} color={colors.onSurface} />
        </Pressable>
        <Pressable
          onPress={() => router.push('/ocr')}
          style={[styles.toolIcon, styles.ocrToolIcon]}
        >
          <Ionicons name="camera-outline" size={18} color={colors.secondary} />
          <Text style={styles.ocrToolText}>OCR</Text>
        </Pressable>
        <Pressable
          onPress={() => openBottomSheet('action_items')}
          style={[styles.toolIcon, styles.aiToolIcon]}
        >
          <Ionicons name="sparkles" size={18} color={colors.primary} />
          <Text style={styles.aiToolText}>AI</Text>
        </Pressable>
      </View>

      {/* AI Assistant Bottom Sheet */}
      <AIAssistantBottomSheet
        onInsertToNote={handleInsertSummary}
        onRequestStream={handleRequestStream}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  topBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    backgroundColor: 'rgba(15, 23, 42, 0.95)'
  },
  circleButton: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center'
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full
  },
  savedDot: {
    width: 7,
    height: 7,
    borderRadius: radius.full,
    backgroundColor: colors.tertiary
  },
  savedText: {
    ...typography.labelSm,
    color: colors.tertiaryFixed,
    fontWeight: '600'
  },
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full
  },
  saveButtonText: {
    ...typography.labelSm,
    color: '#FFFFFF',
    fontWeight: '700'
  },
  editorContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 80
  },
  titleInput: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontWeight: '700',
    lineHeight: 32,
    marginBottom: 8
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16
  },
  tagChip: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full
  },
  tagText: {
    ...typography.labelSm,
    color: colors.primaryFixed,
    fontWeight: '600'
  },
  addTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.outline
  },
  addTagText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderRadius: radius.lg,
    padding: 12,
    marginBottom: 16
  },
  aiBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1
  },
  aiIconBubble: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  aiBannerTitle: {
    ...typography.labelLg,
    color: colors.onSurface,
    fontWeight: '700'
  },
  aiBannerSub: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    fontSize: 11
  },
  aiButtonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full
  },
  aiButtonText: {
    ...typography.labelSm,
    color: '#FFFFFF',
    fontWeight: '700'
  },
  bodyInput: {
    ...typography.bodyLg,
    color: colors.onSurface,
    minHeight: 350,
    lineHeight: 26
  },
  toolbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 52,
    backgroundColor: colors.surfaceContainer,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10
  },
  toolIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md
  },
  ocrToolIcon: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 10,
    width: 'auto'
  },
  ocrToolText: {
    ...typography.labelSm,
    color: colors.secondary,
    fontWeight: '700'
  },
  aiToolIcon: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
    paddingHorizontal: 10,
    width: 'auto'
  },
  aiToolText: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: '700'
  }
});
