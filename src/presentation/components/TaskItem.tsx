import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task, TaskPriority } from '../../domain/entities/Task';
import { colors, typography } from '../theme/colors';

interface TaskItemProps {
  task: Task;
  parentNoteTitle?: string;
  onToggleComplete: () => void;
  onPress?: () => void;
  onDelete?: () => void;
}

/**
 * TaskItem - Minimalist Apple HIG & Material 3 Refactored
 * - Thẻ phẳng #161C28, bo góc 16px
 * - Checkbox gọn gàng (xanh ngọc #10B981 khi hoàn thành)
 * - Tên ghi chú gốc đi kèm (nếu có)
 * - Nút xóa tinh tế
 */
export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  parentNoteTitle,
  onToggleComplete,
  onPress,
  onDelete
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        task.isCompleted && styles.completedContainer,
        pressed && { opacity: 0.85 }
      ]}
    >
      {/* Checkbox */}
      <Pressable
        hitSlop={12}
        onPress={onToggleComplete}
        style={({ pressed }) => [
          styles.checkbox,
          task.isCompleted && styles.checkedCheckbox,
          pressed && { transform: [{ scale: 0.9 }] }
        ]}
      >
        {task.isCompleted && <Ionicons name="checkmark" size={14} color="#0B0F17" />}
      </Pressable>

      {/* Task Content */}
      <View style={styles.contentColumn}>
        <Text
          style={[styles.taskTitle, task.isCompleted && styles.completedTaskTitle]}
          numberOfLines={2}
        >
          {task.title}
        </Text>

        {/* Note Source and Metadata Row */}
        <View style={styles.metaRow}>
          {parentNoteTitle ? (
            <View style={styles.noteSourceTag}>
              <Ionicons name="document-text-outline" size={12} color={colors.primary} />
              <Text style={styles.noteSourceText} numberOfLines={1}>
                {parentNoteTitle}
              </Text>
            </View>
          ) : null}

          {task.source === 'ai_extracted' && !parentNoteTitle && (
            <View style={styles.aiTag}>
              <Ionicons name="sparkles" size={11} color={colors.primary} />
              <Text style={styles.aiTagText}>Từ AI</Text>
            </View>
          )}

          {task.dueDate && (
            <View style={styles.dateTag}>
              <Ionicons name="calendar-outline" size={11} color={colors.onSurfaceVariant} />
              <Text style={styles.dateText}>
                {new Date(task.dueDate).toLocaleDateString('vi-VN', {
                  day: 'numeric',
                  month: 'numeric'
                })}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Delete button */}
      {onDelete && (
        <Pressable hitSlop={12} onPress={onDelete} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={16} color={colors.onSurfaceVariant} />
        </Pressable>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.outlineVariant
  },
  completedContainer: {
    opacity: 0.5,
    backgroundColor: 'rgba(22, 28, 40, 0.6)'
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  checkedCheckbox: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  contentColumn: {
    flex: 1
  },
  taskTitle: {
    ...typography.bodyMedium,
    color: colors.onSurface,
    fontWeight: '500',
    fontSize: 15
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
    color: colors.onSurfaceVariant
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6
  },
  noteSourceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: 200
  },
  noteSourceText: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: '500',
    fontSize: 11
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6
  },
  aiTagText: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: '500',
    fontSize: 11
  },
  dateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  dateText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    fontSize: 11
  },
  deleteButton: {
    padding: 6,
    marginLeft: 8
  }
});
