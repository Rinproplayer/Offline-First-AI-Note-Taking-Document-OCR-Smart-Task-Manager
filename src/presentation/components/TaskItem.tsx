import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  PanResponder
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task, TaskPriority } from '../../domain/entities/Task';
import { colors, typography } from '../theme/colors';
import { useTheme } from '../stores/useThemeStore';

interface TaskItemProps {
  task: Task;
  parentNoteTitle?: string;
  onToggleComplete: () => void;
  onPress?: () => void;
  onDelete?: () => void;
}

/**
 * TaskItem - Minimalist Apple HIG & Material 3 Refactored
 * - Thẻ phẳng #161C28 (hoặc #FFFFFF trong Light Mode), bo góc 16px
 * - Hỗ trợ vuốt sang trái (Swipe-to-delete) mượt mà làm lộ nút Xóa màu đỏ (#EF4444)
 * - Checkbox gọn gàng (xanh ngọc #10B981 khi hoàn thành)
 * - Tên ghi chú gốc đi kèm (nếu có)
 */
export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  parentNoteTitle,
  onToggleComplete,
  onPress,
  onDelete
}) => {
  const { colors, isDark } = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Chỉ kích hoạt khi vuốt ngang có chủ đích (không chặn cuộn dọc danh sách)
        return (
          Math.abs(gestureState.dx) > 12 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5
        );
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          // Vuốt sang trái tối đa -120px
          translateX.setValue(Math.max(gestureState.dx, -120));
        } else if (isOpen.current && gestureState.dx > 0) {
          // Kéo đóng lại
          translateX.setValue(Math.min(-80 + gestureState.dx, 0));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -40) {
          // Mở nút xóa màu đỏ
          Animated.spring(translateX, {
            toValue: -80,
            useNativeDriver: true,
            bounciness: 4,
            speed: 14
          }).start(() => {
            isOpen.current = true;
          });
        } else {
          // Đóng lại
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
            speed: 14
          }).start(() => {
            isOpen.current = false;
          });
        }
      }
    })
  ).current;

  const handleCardPress = () => {
    if (isOpen.current) {
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
        speed: 14
      }).start(() => {
        isOpen.current = false;
      });
    } else if (onPress) {
      onPress();
    }
  };

  const handleDelete = () => {
    Animated.timing(translateX, {
      toValue: -300,
      duration: 180,
      useNativeDriver: true
    }).start(() => {
      if (onDelete) {
        onDelete();
      }
    });
  };

  return (
    <View style={styles.swipeContainer}>
      {/* Background Red Delete Button */}
      {onDelete && (
        <View style={styles.deleteBackground}>
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.8 }]}
          >
            <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
            <Text style={styles.deleteBtnText}>Xóa</Text>
          </Pressable>
        </View>
      )}

      {/* Foreground Sliding Task Card */}
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            backgroundColor: colors.background,
            transform: [{ translateX }]
          }
        ]}
        {...(onDelete ? panResponder.panHandlers : {})}
      >
        <Pressable
          onPress={handleCardPress}
          style={({ pressed }) => [
            styles.container,
            {
              backgroundColor: colors.surfaceContainer,
              borderColor: colors.outlineVariant
            },
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
              { borderColor: colors.outline },
              task.isCompleted && {
                backgroundColor: colors.primary,
                borderColor: colors.primary
              },
              pressed && { transform: [{ scale: 0.9 }] }
            ]}
          >
            {task.isCompleted && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
          </Pressable>

          {/* Task Content */}
          <View style={styles.contentColumn}>
            <Text
              style={[
                styles.taskTitle,
                { color: colors.onSurface },
                task.isCompleted && styles.completedTaskTitle
              ]}
              numberOfLines={2}
            >
              {task.title}
            </Text>

            {/* Note Source and Metadata Row */}
            <View style={styles.metaRow}>
              {parentNoteTitle ? (
                <View
                  style={[
                    styles.noteSourceTag,
                    {
                      backgroundColor: isDark
                        ? 'rgba(16, 185, 129, 0.1)'
                        : 'rgba(16, 185, 129, 0.15)'
                    }
                  ]}
                >
                  <Ionicons name="document-text-outline" size={12} color={colors.primary} />
                  <Text
                    style={[styles.noteSourceText, { color: colors.primary }]}
                    numberOfLines={1}
                  >
                    {parentNoteTitle}
                  </Text>
                </View>
              ) : null}

              {task.source === 'ai_extracted' && !parentNoteTitle && (
                <View
                  style={[
                    styles.aiTag,
                    {
                      backgroundColor: isDark
                        ? 'rgba(16, 185, 129, 0.1)'
                        : 'rgba(16, 185, 129, 0.15)'
                    }
                  ]}
                >
                  <Ionicons name="sparkles" size={11} color={colors.primary} />
                  <Text style={[styles.aiTagText, { color: colors.primary }]}>Từ AI</Text>
                </View>
              )}

              {task.dueDate && (
                <View style={styles.dateTag}>
                  <Ionicons name="calendar-outline" size={11} color={colors.onSurfaceVariant} />
                  <Text style={[styles.dateText, { color: colors.onSurfaceVariant }]}>
                    {new Date(task.dueDate).toLocaleDateString('vi-VN', {
                      day: 'numeric',
                      month: 'numeric'
                    })}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  swipeContainer: {
    position: 'relative',
    marginBottom: 10,
    borderRadius: 16,
    overflow: 'hidden'
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 76,
    backgroundColor: '#EF4444',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  deleteBtn: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2
  },
  deleteBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700'
  },
  cardWrapper: {
    backgroundColor: colors.background
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 16,
    padding: 14,
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
  }
});
