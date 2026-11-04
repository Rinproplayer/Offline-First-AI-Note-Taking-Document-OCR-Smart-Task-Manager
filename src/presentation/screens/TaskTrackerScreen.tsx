import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  StatusBar,
  Share,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, radius } from '../theme/colors';
import { MaterialHeader } from '../components/MaterialHeader';
import { TaskItem } from '../components/TaskItem';
import {
  useTasks,
  useToggleTaskComplete,
  useCreateTask,
  useDeleteTask
} from '../hooks/useTasksQuery';
import { useNotes } from '../hooks/useNotesQuery';
import { useFilterStore } from '../stores/useFilterStore';
import { useTheme } from '../stores/useThemeStore';
import { Task } from '../../domain/entities/Task';

interface SubtaskItem {
  id: string;
  text: string;
  completed: boolean;
}

const DEFAULT_SUBTASKS: SubtaskItem[] = [
  { id: 'sub_1', text: 'Hoàn thiện phần thực nghiệm mô hình CNN', completed: true },
  { id: 'sub_2', text: 'Viết phần đánh giá độ chính xác & F1-score', completed: true },
  { id: 'sub_3', text: 'Xuất file PDF và nộp lên hệ thống LMS', completed: false }
];

/**
 * TaskTrackerScreen - Nâng cấp toàn diện theo thiết kế Stitch "Chi tiết Nhiệm vụ & Lịch trình"
 * - Dải Lịch tuần (Weekly Calendar Strip) tương tác từ T2 -> CN.
 * - Thẻ chi tiết nhiệm vụ nổi bật với Checkbox tròn phong cách Things 3.
 * - Lưới 2 cột thông tin Hạn chót & Nhắc nhở / Mức ưu tiên.
 * - Thẻ Nguồn trích xuất từ Vault (AI Note Link) kèm nút "Xem ghi chú gốc →".
 * - Danh sách công việc con (Subtasks) có thanh tiến độ (Progress Bar) trực quan.
 * - Ghi chú cá nhân đính kèm & Thanh hành động Chia sẻ / Xóa / Hoàn thành.
 * - Hỗ trợ đầy đủ cả Giao diện Sáng (Light) và Giao diện Tối (Dark).
 */
export const TaskTrackerScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { taskTab, setTaskTab } = useFilterStore();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedDayIndex, setSelectedDayIndex] = useState(4); // Thứ 6 mặc định
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Subtasks state
  const [subtasks, setSubtasks] = useState<SubtaskItem[]>(DEFAULT_SUBTASKS);
  const [newSubtaskInput, setNewSubtaskInput] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  // TanStack Query
  const { data: tasks = [] } = useTasks({
    dueDateCategory: taskTab === 'today' ? 'today' : taskTab === 'upcoming' ? 'upcoming' : undefined,
    source: taskTab === 'ai' ? 'ai_extracted' : undefined
  });

  const { data: notes = [] } = useNotes();
  const notesMap = useMemo(() => {
    const map = new Map<string, { title: string; content: string; tags: string[] }>();
    for (const note of notes) {
      map.set(note.id, {
        title: note.title,
        content: note.content,
        tags: note.tags || []
      });
    }
    return map;
  }, [notes]);

  const toggleCompleteMutation = useToggleTaskComplete();
  const createTaskMutation = useCreateTask();
  const deleteTaskMutation = useDeleteTask();

  // Active task to display in the rich detail view
  const activeTask: Task | null = useMemo(() => {
    if (tasks.length === 0) return null;
    if (selectedTaskId) {
      const found = tasks.find((t) => t.id === selectedTaskId);
      if (found) return found;
    }
    return tasks[0];
  }, [tasks, selectedTaskId]);

  // Compute parent note details
  const parentNote = useMemo(() => {
    if (!activeTask?.noteId) return null;
    return notesMap.get(activeTask.noteId) || null;
  }, [activeTask, notesMap]);

  // Days of the week strip
  const weekDays = useMemo(() => {
    const current = new Date();
    const day = current.getDay(); // 0 is Sunday
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(current);
    monday.setDate(diff);

    const labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    return labels.map((label, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      return {
        label,
        dayNumber: d.getDate(),
        date: d,
        isToday: d.toDateString() === new Date().toDateString()
      };
    });
  }, []);

  // Subtask progress
  const completedSubtasksCount = subtasks.filter((s) => s.completed).length;
  const subtasksTotal = subtasks.length;
  const progressPercent =
    subtasksTotal > 0 ? (completedSubtasksCount / subtasksTotal) * 100 : 0;

  const handleToggleSubtask = (id: string) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  const handleAddSubtask = () => {
    if (!newSubtaskInput.trim()) {
      setIsAddingSubtask(false);
      return;
    }
    setSubtasks((prev) => [
      ...prev,
      {
        id: `sub_${Date.now()}`,
        text: newSubtaskInput.trim(),
        completed: false
      }
    ]);
    setNewSubtaskInput('');
    setIsAddingSubtask(false);
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    createTaskMutation.mutate({
      title: newTaskTitle.trim(),
      status: 'pending',
      isCompleted: false,
      priority: 'high',
      source: 'manual',
      dueDate: new Date()
    });
    setNewTaskTitle('');
  };

  const handleShareTask = async () => {
    if (!activeTask) return;
    try {
      await Share.share({
        message: `[MindVault Task] ${activeTask.title}\n${
          parentNote ? `Nguồn: ${parentNote.title}\n` : ''
        }Trạng thái: ${activeTask.isCompleted ? 'Đã hoàn thành' : 'Đang thực hiện'}`
      });
    } catch {
      // Ignored
    }
  };

  const handleDeleteActiveTask = () => {
    if (!activeTask) return;
    Alert.alert(
      'Xóa nhiệm vụ',
      `Bạn có chắc chắn muốn xóa "${activeTask.title}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            deleteTaskMutation.mutate(activeTask.id);
            setSelectedTaskId(null);
          }
        }
      ]
    );
  };

  // Helper format remaining time
  const remainingTimeStr = useMemo(() => {
    if (!activeTask?.dueDate) return 'Còn 2 giờ 45 phút';
    const now = Date.now();
    const diff = new Date(activeTask.dueDate).getTime() - now;
    if (diff < 0) return 'Đã quá hạn';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) return `Còn ${Math.floor(hours / 24)} ngày nữa`;
    if (hours > 0) return `Còn ${hours} giờ ${minutes} phút`;
    return `Còn ${minutes} phút`;
  }, [activeTask]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <MaterialHeader title="MindVault" subtitle="NHIỆM VỤ" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
      >
        {/* 1. Dải Lịch trình tuần (Compact Horizontal Week Strip) */}
        <View style={styles.calendarSection}>
          <View style={styles.calendarHeaderRow}>
            <View style={styles.monthBadgeRow}>
              <Text style={[styles.monthText, { color: colors.onSurfaceVariant }]}>
                THÁNG 11, 2026
              </Text>
              <View style={[styles.dotSep, { backgroundColor: colors.outlineVariant }]} />
              <Text style={[styles.weekText, { color: colors.primary }]}>Tuần 45</Text>
            </View>

            <View style={styles.syncRow}>
              <View style={[styles.pulseDot, { backgroundColor: colors.tertiary }]} />
              <Text style={[styles.syncText, { color: colors.tertiary }]}>Đồng bộ ngoại tuyến</Text>
            </View>
          </View>

          {/* 7 Days Strip */}
          <View style={styles.weekStripRow}>
            {weekDays.map((dayItem, idx) => {
              const isSelected = selectedDayIndex === idx;
              return (
                <Pressable
                  key={dayItem.label}
                  onPress={() => setSelectedDayIndex(idx)}
                  style={[
                    styles.dayPill,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? '#273147'
                          : '#E2E8F0'
                        : colors.surfaceContainer,
                      borderColor: isSelected ? colors.primary : colors.outlineVariant
                    }
                  ]}
                >
                  <Text
                    style={[
                      styles.dayLabel,
                      { color: isSelected ? colors.primary : colors.onSurfaceVariant },
                      isSelected && { fontWeight: '700' }
                    ]}
                  >
                    {dayItem.label}
                  </Text>
                  <Text
                    style={[
                      styles.dayNumber,
                      { color: colors.onSurface },
                      isSelected && { fontWeight: '700' }
                    ]}
                  >
                    {dayItem.dayNumber}
                  </Text>
                  <View
                    style={[
                      styles.dayDot,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : dayItem.isToday
                          ? colors.tertiary
                          : 'transparent'
                      }
                    ]}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 2. Bộ lọc Tab ("Hôm nay", "Sắp tới", "Từ AI") */}
        <View style={styles.tabBarContainer}>
          <View
            style={[
              styles.segmentedControl,
              {
                backgroundColor: colors.surfaceContainer,
                borderColor: colors.outlineVariant
              }
            ]}
          >
            <Pressable
              onPress={() => setTaskTab('today')}
              style={[
                styles.segmentBtn,
                taskTab === 'today' && { backgroundColor: isDark ? '#273147' : '#E2E8F0' }
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: taskTab === 'today' ? colors.onSurface : colors.onSurfaceVariant },
                  taskTab === 'today' && styles.activeSegmentText
                ]}
              >
                Hôm nay
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setTaskTab('upcoming')}
              style={[
                styles.segmentBtn,
                taskTab === 'upcoming' && { backgroundColor: isDark ? '#273147' : '#E2E8F0' }
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: taskTab === 'upcoming' ? colors.onSurface : colors.onSurfaceVariant },
                  taskTab === 'upcoming' && styles.activeSegmentText
                ]}
              >
                Sắp tới
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setTaskTab('ai')}
              style={[
                styles.segmentBtn,
                taskTab === 'ai' && { backgroundColor: isDark ? '#273147' : '#E2E8F0' }
              ]}
            >
              <Ionicons
                name="sparkles"
                size={12}
                color={taskTab === 'ai' ? colors.primary : colors.onSurfaceVariant}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.segmentText,
                  { color: taskTab === 'ai' ? colors.onSurface : colors.onSurfaceVariant },
                  taskTab === 'ai' && styles.activeSegmentText
                ]}
              >
                Từ AI
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 3. Chi Tiết Nhiệm Vụ Nổi Bật (Featured Task Hero Card) */}
        {activeTask ? (
          <View style={styles.taskDetailSection}>
            {/* Header & Status Card */}
            <View
              style={[
                styles.heroCard,
                {
                  backgroundColor: colors.surfaceContainer,
                  borderColor: colors.outlineVariant
                }
              ]}
            >
              <View style={styles.heroRow}>
                {/* Things 3 Circular Checkbox */}
                <Pressable
                  hitSlop={12}
                  onPress={() =>
                    toggleCompleteMutation.mutate({
                      id: activeTask.id,
                      isCompleted: !activeTask.isCompleted
                    })
                  }
                  style={[
                    styles.thingsCheckbox,
                    { borderColor: colors.outline },
                    activeTask.isCompleted && {
                      backgroundColor: colors.tertiary,
                      borderColor: colors.tertiary
                    }
                  ]}
                >
                  {activeTask.isCompleted && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </Pressable>

                <View style={styles.heroContentColumn}>
                  {/* Category Tags */}
                  <View style={styles.tagsRow}>
                    <View
                      style={[
                        styles.tagBadge,
                        {
                          backgroundColor: isDark
                            ? 'rgba(99, 102, 241, 0.15)'
                            : 'rgba(79, 70, 229, 0.1)'
                        }
                      ]}
                    >
                      <Text style={[styles.tagBadgeText, { color: colors.primary }]}>
                        {parentNote?.tags?.[0] ? `#${parentNote.tags[0]}` : '#CS402'}
                      </Text>
                    </View>
                    <Text style={[styles.bullet, { color: colors.onSurfaceVariant }]}>•</Text>
                    <Text
                      style={[styles.categoryText, { color: colors.onSurfaceVariant }]}
                      numberOfLines={1}
                    >
                      {parentNote?.title || 'Đồ án cuối kỳ'}
                    </Text>
                  </View>

                  {/* Big Task Title */}
                  <Text
                    style={[
                      styles.heroTitle,
                      { color: colors.onSurface },
                      activeTask.isCompleted && styles.completedTitle
                    ]}
                  >
                    {activeTask.title}
                  </Text>
                </View>
              </View>
            </View>

            {/* 4. Schedule Details Grid (2 Columns: Hạn chót & Nhắc nhở) */}
            <View style={styles.gridTwoColumns}>
              {/* Left Column: Hạn chót */}
              <View
                style={[
                  styles.gridCard,
                  {
                    backgroundColor: colors.surfaceContainer,
                    borderColor: colors.outlineVariant
                  }
                ]}
              >
                <View style={styles.gridCardHeader}>
                  <Ionicons name="time-outline" size={16} color={colors.onSurfaceVariant} />
                  <Text style={[styles.gridCardLabel, { color: colors.onSurfaceVariant }]}>
                    Hạn chót
                  </Text>
                </View>
                <View style={{ marginTop: 8 }}>
                  <Text style={[styles.gridCardValue, { color: colors.onSurface }]}>
                    Hôm nay, 17:00
                  </Text>
                  <Text style={[styles.gridCardSub, { color: colors.onSurfaceVariant }]}>
                    {remainingTimeStr}
                  </Text>
                </View>
              </View>

              {/* Right Column: Nhắc nhở & Ưu tiên */}
              <View
                style={[
                  styles.gridCard,
                  {
                    backgroundColor: colors.surfaceContainer,
                    borderColor: colors.outlineVariant
                  }
                ]}
              >
                <View style={styles.gridCardHeaderBetween}>
                  <View style={styles.gridCardHeader}>
                    <Ionicons
                      name="notifications-outline"
                      size={16}
                      color={colors.onSurfaceVariant}
                    />
                    <Text style={[styles.gridCardLabel, { color: colors.onSurfaceVariant }]}>
                      Nhắc nhở
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.priorityPill,
                      {
                        backgroundColor:
                          activeTask.priority === 'high'
                            ? 'rgba(239, 68, 68, 0.12)'
                            : 'rgba(16, 185, 129, 0.12)'
                      }
                    ]}
                  >
                    <View
                      style={[
                        styles.priorityDot,
                        {
                          backgroundColor:
                            activeTask.priority === 'high' ? colors.error : colors.tertiary
                        }
                      ]}
                    />
                    <Text
                      style={[
                        styles.priorityText,
                        {
                          color:
                            activeTask.priority === 'high' ? colors.error : colors.tertiary
                        }
                      ]}
                    >
                      {activeTask.priority === 'high' ? 'Cao' : 'Bình thường'}
                    </Text>
                  </View>
                </View>
                <View style={{ marginTop: 8 }}>
                  <Text style={[styles.gridCardValue, { color: colors.onSurface }]}>16:30</Text>
                  <Text style={[styles.gridCardSub, { color: colors.onSurfaceVariant }]}>
                    Trước 30 phút
                  </Text>
                </View>
              </View>
            </View>

            {/* 5. Ghi chú nguồn / AI Note Link (Nguồn trích xuất từ Vault) */}
            <View
              style={[
                styles.vaultSourceCard,
                {
                  backgroundColor: colors.surfaceContainer,
                  borderColor: colors.outlineVariant
                }
              ]}
            >
              <View style={styles.vaultHeaderRow}>
                <View style={styles.vaultTitleLeft}>
                  <Ionicons name="link-outline" size={17} color={colors.primary} />
                  <Text style={[styles.vaultTitle, { color: colors.onSurface }]}>
                    Nguồn trích xuất từ Vault
                  </Text>
                </View>
                <View
                  style={[
                    styles.aiLinkBadge,
                    {
                      backgroundColor: isDark
                        ? 'rgba(99, 102, 241, 0.15)'
                        : 'rgba(79, 70, 229, 0.1)'
                    }
                  ]}
                >
                  <Text style={[styles.aiLinkBadgeText, { color: colors.primary }]}>
                    AI Note Link
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.vaultNoteBox,
                  {
                    backgroundColor: isDark ? colors.background : colors.surfaceLow,
                    borderColor: colors.outlineVariant
                  }
                ]}
              >
                <View style={styles.vaultNoteTitleRow}>
                  <Ionicons name="document-text-outline" size={16} color={colors.onSurfaceVariant} />
                  <Text
                    style={[styles.vaultNoteTitleText, { color: colors.onSurface }]}
                    numberOfLines={1}
                  >
                    {parentNote?.title || 'Biên bản họp Lab NCKH Tuần 5'}
                  </Text>
                </View>
                <Text
                  style={[styles.vaultNoteExcerpt, { color: colors.onSurfaceVariant }]}
                  numberOfLines={2}
                >
                  {parentNote?.content
                    ? `“${parentNote.content.replace(/\n+/g, ' ').slice(0, 110)}...”`
                    : '“Hoàn thiện bản báo cáo xử lý ảnh trước 17:00 thứ 6 để kịp tổng hợp gửi thầy phụ trách.”'}
                </Text>
              </View>

              {activeTask.noteId ? (
                <Pressable
                  onPress={() => router.push(`/note-editor/${activeTask.noteId}`)}
                  style={styles.viewNoteLink}
                >
                  <Text style={[styles.viewNoteText, { color: colors.primary }]}>
                    Xem ghi chú gốc
                  </Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                </Pressable>
              ) : null}
            </View>

            {/* 6. Danh sách công việc con (Subtasks / Checklist) & Mini Progress Bar */}
            <View
              style={[
                styles.subtasksCard,
                {
                  backgroundColor: colors.surfaceContainer,
                  borderColor: colors.outlineVariant
                }
              ]}
            >
              <View style={styles.subtasksHeader}>
                <View style={styles.subtasksTitleLeft}>
                  <Text style={[styles.subtasksHeading, { color: colors.onSurface }]}>
                    Công việc con
                  </Text>
                  <View
                    style={[
                      styles.counterPill,
                      {
                        backgroundColor: isDark
                          ? 'rgba(99, 102, 241, 0.15)'
                          : 'rgba(79, 70, 229, 0.1)'
                      }
                    ]}
                  >
                    <Text style={[styles.counterText, { color: colors.primary }]}>
                      {completedSubtasksCount}/{subtasksTotal}
                    </Text>
                  </View>
                </View>

                {/* Mini Progress Bar */}
                <View
                  style={[
                    styles.progressBarTrack,
                    { backgroundColor: isDark ? '#273147' : '#E2E8F0' }
                  ]}
                >
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${progressPercent}%`, backgroundColor: colors.primary }
                    ]}
                  />
                </View>
              </View>

              {/* Subtask items */}
              <View style={styles.subtasksList}>
                {subtasks.map((sub) => (
                  <Pressable
                    key={sub.id}
                    onPress={() => handleToggleSubtask(sub.id)}
                    style={[
                      styles.subtaskRow,
                      {
                        backgroundColor: isDark ? colors.background : colors.surfaceLow,
                        borderColor: colors.outlineVariant
                      }
                    ]}
                  >
                    <Ionicons
                      name={sub.completed ? 'checkmark-circle' : 'ellipse-outline'}
                      size={18}
                      color={sub.completed ? colors.tertiary : colors.onSurfaceVariant}
                    />
                    <Text
                      style={[
                        styles.subtaskText,
                        { color: colors.onSurface },
                        sub.completed && styles.subtaskTextDone
                      ]}
                      numberOfLines={2}
                    >
                      {sub.text}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Add subtask */}
              {isAddingSubtask ? (
                <View style={styles.addSubtaskInputRow}>
                  <TextInput
                    style={[
                      styles.subtaskTextInput,
                      {
                        backgroundColor: isDark ? colors.background : colors.surfaceLow,
                        borderColor: colors.primary,
                        color: colors.onSurface
                      }
                    ]}
                    placeholder="Nhập bước tiếp theo..."
                    placeholderTextColor={colors.onSurfaceVariant}
                    value={newSubtaskInput}
                    onChangeText={setNewSubtaskInput}
                    onSubmitEditing={handleAddSubtask}
                    autoFocus
                  />
                  <Pressable
                    onPress={handleAddSubtask}
                    style={[styles.addSubtaskConfirmBtn, { backgroundColor: colors.primary }]}
                  >
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => setIsAddingSubtask(true)}
                  style={[
                    styles.addSubtaskBtn,
                    {
                      backgroundColor: isDark ? colors.background : colors.surfaceLow,
                      borderColor: colors.outlineVariant
                    }
                  ]}
                >
                  <Ionicons name="add" size={16} color={colors.onSurfaceVariant} />
                  <Text style={[styles.addSubtaskText, { color: colors.onSurfaceVariant }]}>
                    Thêm bước tiếp theo...
                  </Text>
                </Pressable>
              )}
            </View>

            {/* 7. Ghi chú đính kèm (Personal Notes / Quick Memo) */}
            <View
              style={[
                styles.memoCard,
                {
                  backgroundColor: colors.surfaceContainer,
                  borderColor: colors.outlineVariant
                }
              ]}
            >
              <View style={styles.memoHeader}>
                <Ionicons name="create-outline" size={17} color={colors.onSurfaceVariant} />
                <Text style={[styles.memoHeading, { color: colors.onSurface }]}>
                  Ghi chú đính kèm
                </Text>
              </View>
              <View
                style={[
                  styles.memoBox,
                  {
                    backgroundColor: isDark ? colors.background : colors.surfaceLow,
                    borderColor: colors.outlineVariant
                  }
                ]}
              >
                <Text style={[styles.memoText, { color: colors.onSurfaceVariant }]}>
                  {activeTask.description ||
                    'Chú ý đính kèm link Google Colab và file checkpoint trong báo cáo nộp thầy Hoàng. Kiểm tra lại format trang bìa theo chuẩn khoa CNTT.'}
                </Text>
              </View>
            </View>

            {/* 8. Thanh thao tác Action Bar (Chia sẻ, Xóa, Hoàn thành) */}
            <View style={styles.actionBarContainer}>
              <Pressable
                onPress={handleShareTask}
                hitSlop={10}
                style={[
                  styles.secondaryActionBtn,
                  {
                    backgroundColor: colors.surfaceContainer,
                    borderColor: colors.outlineVariant
                  }
                ]}
              >
                <Ionicons name="share-outline" size={20} color={colors.onSurfaceVariant} />
              </Pressable>

              <Pressable
                onPress={handleDeleteActiveTask}
                hitSlop={10}
                style={[
                  styles.secondaryActionBtn,
                  {
                    backgroundColor: colors.surfaceContainer,
                    borderColor: colors.outlineVariant
                  }
                ]}
              >
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </Pressable>

              {/* Main Complete Action Button */}
              <Pressable
                onPress={() =>
                  toggleCompleteMutation.mutate({
                    id: activeTask.id,
                    isCompleted: !activeTask.isCompleted
                  })
                }
                style={({ pressed }) => [
                  styles.primaryCompleteBtn,
                  {
                    backgroundColor: activeTask.isCompleted ? colors.tertiary : colors.primary
                  },
                  pressed && { opacity: 0.85 }
                ]}
              >
                <Ionicons
                  name={activeTask.isCompleted ? 'checkmark-circle' : 'checkmark-done'}
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.primaryCompleteText}>
                  {activeTask.isCompleted ? 'Đã hoàn thành' : 'Hoàn thành nhiệm vụ'}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* 9. Danh sách tất cả nhiệm vụ khác trong ngày */}
        <View style={styles.otherTasksSection}>
          <View style={styles.otherTasksHeader}>
            <Text style={[styles.otherTasksTitle, { color: colors.onSurface }]}>
              Danh sách nhiệm vụ ({tasks.length})
            </Text>
          </View>

          {/* Quick Add Task Input */}
          <View
            style={[
              styles.quickAddRow,
              {
                backgroundColor: colors.surfaceContainer,
                borderColor: colors.outlineVariant
              }
            ]}
          >
            <TextInput
              style={[styles.quickAddInput, { color: colors.onSurface }]}
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
                { backgroundColor: colors.primary },
                !newTaskTitle.trim() && {
                  backgroundColor: isDark ? colors.surfaceContainerHigh : '#E2E8F0'
                },
                pressed && newTaskTitle.trim() && { opacity: 0.8 }
              ]}
            >
              <Ionicons
                name="arrow-up"
                size={18}
                color={newTaskTitle.trim() ? '#FFFFFF' : colors.onSurfaceVariant}
              />
            </Pressable>
          </View>

          {/* List of Tasks */}
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                parentNoteTitle={parentNote?.title}
                onToggleComplete={() =>
                  toggleCompleteMutation.mutate({
                    id: task.id,
                    isCompleted: !task.isCompleted
                  })
                }
                onPress={() => setSelectedTaskId(task.id)}
                onDelete={() => deleteTaskMutation.mutate(task.id)}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="checkmark-done-circle-outline"
                size={44}
                color={colors.outlineVariant}
              />
              <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
                Không có việc cần làm
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.onSurfaceVariant }]}>
                {taskTab === 'today'
                  ? 'Tuyệt vời! Bạn không còn việc tồn đọng hôm nay.'
                  : taskTab === 'upcoming'
                  ? 'Chưa có việc sắp tới nào được lên lịch.'
                  : 'Chưa có hành động nào được AI trích xuất từ ghi chú.'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10
  },
  // Calendar Strip
  calendarSection: {
    marginBottom: 12
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4
  },
  monthBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  monthText: {
    ...typography.labelSm,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  dotSep: {
    width: 3,
    height: 3,
    borderRadius: 1.5
  },
  weekText: {
    ...typography.labelSm,
    fontWeight: '600'
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  syncText: {
    ...typography.labelSm,
    fontWeight: '500',
    fontSize: 11
  },
  weekStripRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6
  },
  dayPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1
  },
  dayLabel: {
    ...typography.labelSm,
    fontSize: 11,
    marginBottom: 2
  },
  dayNumber: {
    ...typography.bodyMedium,
    fontWeight: '600',
    fontSize: 15
  },
  dayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4
  },
  // Tab Bar
  tabBarContainer: {
    marginBottom: 14
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 9
  },
  segmentText: {
    ...typography.labelMedium,
    fontWeight: '500',
    fontSize: 13
  },
  activeSegmentText: {
    fontWeight: '700'
  },
  // Task Detail Section
  taskDetailSection: {
    marginBottom: 20,
    gap: 12
  },
  heroCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14
  },
  thingsCheckbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2
  },
  heroContentColumn: {
    flex: 1
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6
  },
  tagBadgeText: {
    ...typography.labelSm,
    fontWeight: '700',
    fontSize: 11
  },
  bullet: {
    fontSize: 12
  },
  categoryText: {
    ...typography.labelSm,
    fontSize: 12,
    flex: 1
  },
  heroTitle: {
    ...typography.titleMedium,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    opacity: 0.6
  },
  // 2-Column Grid
  gridTwoColumns: {
    flexDirection: 'row',
    gap: 10
  },
  gridCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    justifyContent: 'space-between'
  },
  gridCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  gridCardHeaderBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  gridCardLabel: {
    ...typography.labelSm,
    fontSize: 12
  },
  priorityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  priorityDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5
  },
  priorityText: {
    ...typography.labelSm,
    fontSize: 10,
    fontWeight: '700'
  },
  gridCardValue: {
    ...typography.bodyMedium,
    fontWeight: '700',
    fontSize: 15
  },
  gridCardSub: {
    ...typography.labelSm,
    fontSize: 11,
    marginTop: 2
  },
  // Vault Source Card
  vaultSourceCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12
  },
  vaultHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  vaultTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  vaultTitle: {
    ...typography.labelMedium,
    fontWeight: '600',
    fontSize: 13
  },
  aiLinkBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6
  },
  aiLinkBadgeText: {
    ...typography.labelSm,
    fontWeight: '600',
    fontSize: 10
  },
  vaultNoteBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 6
  },
  vaultNoteTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  vaultNoteTitleText: {
    ...typography.bodyMedium,
    fontWeight: '600',
    fontSize: 13,
    flex: 1
  },
  vaultNoteExcerpt: {
    ...typography.bodySm,
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
    paddingLeft: 22
  },
  viewNoteLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    paddingTop: 2
  },
  viewNoteText: {
    ...typography.labelSm,
    fontWeight: '600',
    fontSize: 12
  },
  // Subtasks Card
  subtasksCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12
  },
  subtasksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  subtasksTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  subtasksHeading: {
    ...typography.titleMedium,
    fontWeight: '700',
    fontSize: 15
  },
  counterPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10
  },
  counterText: {
    ...typography.labelSm,
    fontWeight: '700',
    fontSize: 11
  },
  progressBarTrack: {
    width: 72,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3
  },
  subtasksList: {
    gap: 8
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1
  },
  subtaskText: {
    ...typography.bodySm,
    fontSize: 13,
    flex: 1
  },
  subtaskTextDone: {
    textDecorationLine: 'line-through',
    opacity: 0.5
  },
  addSubtaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1
  },
  addSubtaskText: {
    ...typography.labelSm,
    fontWeight: '600',
    fontSize: 12
  },
  addSubtaskInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  subtaskTextInput: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13
  },
  addSubtaskConfirmBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  // Memo Card
  memoCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8
  },
  memoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  memoHeading: {
    ...typography.titleMedium,
    fontWeight: '700',
    fontSize: 14
  },
  memoBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12
  },
  memoText: {
    ...typography.bodySm,
    fontSize: 13,
    lineHeight: 19
  },
  // Action Bar
  actionBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4
  },
  secondaryActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryCompleteBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  primaryCompleteText: {
    ...typography.labelLarge,
    color: '#FFFFFF',
    fontWeight: '700'
  },
  // Other Tasks Section
  otherTasksSection: {
    marginTop: 6
  },
  otherTasksHeader: {
    marginBottom: 10
  },
  otherTasksTitle: {
    ...typography.titleMedium,
    fontWeight: '700',
    fontSize: 15
  },
  quickAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 14,
    gap: 8
  },
  quickAddInput: {
    flex: 1,
    ...typography.bodyMedium,
    fontSize: 14
  },
  quickAddBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8
  },
  emptyTitle: {
    ...typography.titleMedium,
    fontWeight: '600'
  },
  emptySubtitle: {
    ...typography.bodySmall,
    textAlign: 'center',
    paddingHorizontal: 20
  }
});
