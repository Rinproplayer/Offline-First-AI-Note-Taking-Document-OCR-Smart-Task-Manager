import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  StatusBar
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography } from '../theme/colors';
import { MaterialHeader } from '../components/MaterialHeader';
import { TaskItem } from '../components/TaskItem';
import { useTasks, useToggleTaskComplete, useCreateTask, useDeleteTask } from '../hooks/useTasksQuery';
import { useNotes } from '../hooks/useNotesQuery';
import { useFilterStore, TaskTab } from '../stores/useFilterStore';
import { Task } from '../../domain/entities/Task';

/**
 * TaskTrackerScreen - Minimalist Apple HIG & Material 3 Refactored
 * - Bỏ toàn bộ banner thống kê tuần & tiến độ % rườm rà
 * - Bỏ các hàng chip lọc ưu tiên trùng lặp
 * - Giữ duy nhất 1 thanh chuyển tab ("Hôm nay", "Sắp tới", "Từ AI")
 * - Danh sách công việc thoáng đãng kèm tên ghi chú gốc
 */
export const TaskTrackerScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { taskTab, setTaskTab } = useFilterStore();
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Fetch tasks matching the active tab
  const { data: tasks = [] } = useTasks({
    dueDateCategory: taskTab === 'today' ? 'today' : taskTab === 'upcoming' ? 'upcoming' : undefined,
    source: taskTab === 'ai' ? 'ai_extracted' : undefined
  });

  // Fetch notes to resolve parent note titles for tasks
  const { data: notes = [] } = useNotes();
  const notesMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const note of notes) {
      map.set(note.id, note.title);
    }
    return map;
  }, [notes]);

  const toggleCompleteMutation = useToggleTaskComplete();
  const createTaskMutation = useCreateTask();
  const deleteTaskMutation = useDeleteTask();

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    createTaskMutation.mutate({
      title: newTaskTitle.trim(),
      status: 'pending',
      isCompleted: false,
      priority: 'medium',
      source: 'manual',
      dueDate: new Date()
    });
    setNewTaskTitle('');
  };

  const getParentTitle = (task: Task): string | undefined => {
    if (task.noteId && notesMap.has(task.noteId)) {
      return notesMap.get(task.noteId);
    }
    if (task.description && task.description.startsWith('Trích xuất từ: ')) {
      return task.description.replace('Trích xuất từ: ', '');
    }
    return undefined;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <MaterialHeader title="MindVault" subtitle="NHIỆM VỤ" />

      {/* 3-Tab Segmented Control ("Hôm nay", "Sắp tới", "Từ AI") */}
      <View style={styles.tabBarContainer}>
        <View style={styles.segmentedControl}>
          <Pressable
            onPress={() => setTaskTab('today')}
            style={[styles.segmentBtn, taskTab === 'today' && styles.activeSegmentBtn]}
          >
            <Text style={[styles.segmentText, taskTab === 'today' && styles.activeSegmentText]}>
              Hôm nay
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setTaskTab('upcoming')}
            style={[styles.segmentBtn, taskTab === 'upcoming' && styles.activeSegmentBtn]}
          >
            <Text style={[styles.segmentText, taskTab === 'upcoming' && styles.activeSegmentText]}>
              Sắp tới
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setTaskTab('ai')}
            style={[styles.segmentBtn, taskTab === 'ai' && styles.activeSegmentBtn]}
          >
            <Ionicons
              name="sparkles"
              size={12}
              color={taskTab === 'ai' ? colors.primary : colors.onSurfaceVariant}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.segmentText, taskTab === 'ai' && styles.activeSegmentText]}>
              Từ AI
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Quick Add Task Input */}
      <View style={styles.inputContainer}>
        <View style={styles.quickAddRow}>
          <TextInput
            style={styles.quickAddInput}
            placeholder="Thêm việc mới..."
            placeholderTextColor={colors.onSurfaceVariant}
            value={newTaskTitle}
            onChangeText={setNewTaskTitle}
            onSubmitEditing={handleAddTask}
            returnKeyType="done"
          />
          <Pressable
            onPress={handleAddTask}
            disabled={!newTaskTitle.trim()}
            style={({ pressed }) => [
              styles.quickAddBtn,
              !newTaskTitle.trim() && styles.disabledAddBtn,
              pressed && newTaskTitle.trim() && { opacity: 0.8 }
            ]}
          >
            <Ionicons
              name="arrow-up"
              size={18}
              color={newTaskTitle.trim() ? '#0B0F17' : colors.onSurfaceVariant}
            />
          </Pressable>
        </View>
      </View>

      {/* Spacious Task List with Parent Note Name */}
      <View style={styles.listContainer}>
        <FlashList
          data={tasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 24 }
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-done-circle-outline" size={44} color={colors.outlineVariant} />
              <Text style={styles.emptyTitle}>Không có việc cần làm</Text>
              <Text style={styles.emptySubtitle}>
                {taskTab === 'today'
                  ? 'Tuyệt vời! Bạn không còn việc tồn đọng hôm nay.'
                  : taskTab === 'upcoming'
                  ? 'Chưa có việc sắp tới nào được lên lịch.'
                  : 'Chưa có hành động nào được AI trích xuất từ ghi chú.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TaskItem
              task={item}
              parentNoteTitle={getParentTitle(item)}
              onToggleComplete={() =>
                toggleCompleteMutation.mutate({
                  id: item.id,
                  isCompleted: !item.isCompleted
                })
              }
              onDelete={() => deleteTaskMutation.mutate(item.id)}
            />
          )}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  tabBarContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.outlineVariant
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8
  },
  activeSegmentBtn: {
    backgroundColor: colors.outlineVariant
  },
  segmentText: {
    ...typography.labelMedium,
    color: colors.onSurfaceVariant,
    fontWeight: '500'
  },
  activeSegmentText: {
    color: colors.onSurface,
    fontWeight: '600'
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6
  },
  quickAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: colors.outlineVariant
  },
  quickAddInput: {
    flex: 1,
    ...typography.bodyMedium,
    color: colors.onSurface
  },
  quickAddBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  disabledAddBtn: {
    backgroundColor: colors.surfaceContainerHigh
  },
  listContainer: {
    flex: 1
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 8
  },
  emptyTitle: {
    ...typography.titleMedium,
    color: colors.onSurface,
    fontWeight: '600',
    marginTop: 4
  },
  emptySubtitle: {
    ...typography.bodySmall,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 260
  }
});
