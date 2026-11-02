import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task, TaskPriority } from '../../domain/entities/Task';
import { colors, typography, radius } from '../theme/colors';

interface TaskItemProps {
  task: Task;
  onToggleComplete: () => void;
  onPress?: () => void;
  onDelete?: () => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggleComplete,
  onPress,
  onDelete
}) => {
  const priorityConfig = getPriorityConfig(task.priority);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        task.isCompleted && styles.completedContainer,
        pressed && { opacity: 0.85 }
      ]}
    >
      {/* Checkbox Touch Target (min 48x48) */}
      <Pressable
        hitSlop={8}
        onPress={onToggleComplete}
        style={({ pressed }) => [
          styles.checkbox,
          task.isCompleted && styles.checkedCheckbox,
          pressed && { transform: [{ scale: 0.92 }] }
        ]}
      >
        {task.isCompleted && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
      </Pressable>

      {/* Task Content */}
      <View style={styles.contentColumn}>
        <Text
          style={[styles.taskTitle, task.isCompleted && styles.completedTaskTitle]}
          numberOfLines={2}
        >
          {task.title}
        </Text>

        {task.description ? (
          <Text style={styles.description} numberOfLines={1}>
            {task.description}
          </Text>
        ) : null}

        {/* Badges Row */}
        <View style={styles.badgeRow}>
          {/* Priority Pill */}
          <View style={[styles.priorityBadge, { backgroundColor: priorityConfig.bg }]}>
            <Text style={[styles.priorityText, { color: priorityConfig.color }]}>
              {priorityConfig.label}
            </Text>
          </View>

          {/* Source Pill */}
          <View style={styles.sourceBadge}>
            <Ionicons
              name={
                task.source === 'ai_extracted'
                  ? 'sparkles'
                  : task.source === 'ocr'
                  ? 'scan'
                  : 'person-outline'
              }
              size={11}
              color={
                task.source === 'ai_extracted'
                  ? colors.primary
                  : task.source === 'ocr'
                  ? colors.secondary
                  : colors.onSurfaceVariant
              }
            />
            <Text style={styles.sourceText}>
              {task.source === 'ai_extracted'
                ? 'Từ AI'
                : task.source === 'ocr'
                ? 'Từ OCR'
                : 'Tự tạo'}
            </Text>
          </View>

          {/* Due date if present */}
          {task.dueDate && (
            <View style={styles.dueRow}>
              <Ionicons name="calendar-outline" size={11} color={colors.onSurfaceVariant} />
              <Text style={styles.dueText}>
                {new Date(task.dueDate).toLocaleDateString('vi-VN', {
                  day: 'numeric',
                  month: 'numeric'
                })}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Delete / Actions */}
      {onDelete && (
        <Pressable hitSlop={12} onPress={onDelete} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={18} color={colors.onSurfaceVariant} />
        </Pressable>
      )}
    </Pressable>
  );
};

function getPriorityConfig(priority: TaskPriority) {
  switch (priority) {
    case 'high':
      return {
        label: 'Ưu tiên cao',
        color: '#F87171',
        bg: 'rgba(239, 68, 68, 0.15)'
      };
    case 'medium':
      return {
        label: 'Trung bình',
        color: '#FBBF24',
        bg: 'rgba(245, 158, 11, 0.15)'
      };
    case 'low':
    default:
      return {
        label: 'Thấp',
        color: '#94A3B8',
        bg: 'rgba(148, 163, 184, 0.12)'
      };
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    minHeight: 56
  },
  completedContainer: {
    opacity: 0.6,
    backgroundColor: colors.surfaceLow
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2
  },
  checkedCheckbox: {
    backgroundColor: colors.tertiary,
    borderColor: colors.tertiary
  },
  contentColumn: {
    flex: 1
  },
  taskTitle: {
    ...typography.bodyLg,
    color: colors.onSurface,
    fontWeight: '600'
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
    color: colors.onSurfaceVariant
  },
  description: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full
  },
  priorityText: {
    ...typography.labelSm,
    fontWeight: '700'
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full
  },
  sourceText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    fontWeight: '500'
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  dueText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant
  },
  deleteButton: {
    padding: 6,
    marginLeft: 6
  }
});
