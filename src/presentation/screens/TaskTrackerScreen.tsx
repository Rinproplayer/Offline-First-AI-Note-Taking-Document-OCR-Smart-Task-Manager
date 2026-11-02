import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  StatusBar
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, radius } from '../theme/colors';
import { MaterialHeader } from '../components/MaterialHeader';
import { TaskItem } from '../components/TaskItem';
import { useTasks, useWeeklyMetrics, useToggleTaskComplete, useCreateTask, useDeleteTask } from '../hooks/useTasksQuery';
import { useFilterStore, TaskTab, PriorityFilter } from '../stores/useFilterStore';
import { TaskPriority } from '../../domain/entities/Task';

export const TaskTrackerScreen: React.FC = () => {
  const { taskTab, setTaskTab, priorityFilter, setPriorityFilter } = useFilterStore();
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const { data: metrics } = useWeeklyMetrics();
  const { data: tasks = [] } = useTasks({
    priority: priorityFilter === 'all' ? undefined : (priorityFilter as TaskPriority),
    dueDateCategory: taskTab === 'today' ? 'today' : taskTab === 'upcoming' ? 'upcoming' : undefined,
    source: taskTab === 'ai' ? 'ai_extracted' : undefined
  });

  const toggleCompleteMutation = useToggleTaskComplete();
  const createTaskMutation = useCreateTask();
  const deleteTaskMutation = useDeleteTask();

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    createTaskMutation.mutate({
      title: newTaskTitle.trim(),
      isCompleted: false,
      priority: priorityFilter === 'all' ? 'medium' : (priorityFilter as TaskPriority),
      source: 'manual',
      dueDate: new Date()
    });
    setNewTaskTitle('');
  };

  const progressPercent = metrics?.percentage || 78;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <MaterialHeader title="MindVault" subtitle="NHIỆM VỤ" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Title & Subtitle */}
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={styles.pageTitle}>Quản lý Nhiệm vụ</Text>
            <Text style={styles.pageSubtitle}>Tối ưu hóa học tập bằng nhận diện hành động tự động</Text>
          </View>
          <Pressable style={styles.circleButton}>
            <Ionicons name="options-outline" size={18} color={colors.onSurface} />
          </Pressable>
        </View>

        {/* Weekly Progress Card with Luminous Metrics */}
        <View style={styles.metricsCard}>
          <View style={styles.metricsHeaderRow}>
            <View style={styles.metricsIconTitle}>
              <Ionicons name="trending-up" size={18} color={colors.tertiary} />
              <Text style={styles.metricsLabel}>Tiến độ tuần này</Text>
            </View>
            <View style={styles.metricsScoreRow}>
              <Text style={styles.metricsFraction}>{metrics?.completed || 14}/{metrics?.total || 18}</Text>
              <Text style={styles.metricsPercentage}>({progressPercent}%)</Text>
            </View>
          </View>

          {/* Progress Bar with Dual Halo Gradient */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>

          <View style={styles.metricsFooterRow}>
            <View style={styles.trendIndicator}>
              <View style={styles.smallGreenDot} />
              <Text style={styles.trendText}>Vượt tiến độ 12% so với tuần trước</Text>
            </View>
            <Text style={styles.remainingText}>Còn {metrics?.remainingCount || 4} việc cần xử lý</Text>
          </View>
        </View>

        {/* Ergonomic Segmented Control Tabs */}
        <View style={styles.segmentedContainer}>
          <Pressable
            onPress={() => setTaskTab('today')}
            style={[styles.segmentTab, taskTab === 'today' && styles.activeSegmentTab]}
          >
            <Text style={[styles.segmentLabel, taskTab === 'today' && styles.activeSegmentLabel]}>
              Hôm nay
            </Text>
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>3</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => setTaskTab('upcoming')}
            style={[styles.segmentTab, taskTab === 'upcoming' && styles.activeSegmentTab]}
          >
            <Text style={[styles.segmentLabel, taskTab === 'upcoming' && styles.activeSegmentLabel]}>
              Sắp tới
            </Text>
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>8</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => setTaskTab('ai')}
            style={[styles.segmentTab, taskTab === 'ai' && styles.activeSegmentTab]}
          >
            <Ionicons
              name="sparkles"
              size={13}
              color={taskTab === 'ai' ? '#FFFFFF' : colors.secondary}
            />
            <Text style={[styles.segmentLabel, taskTab === 'ai' && styles.activeSegmentLabel]}>
              Từ AI
            </Text>
            <View style={[styles.tabBadge, { backgroundColor: 'rgba(56, 189, 248, 0.25)' }]}>
              <Text style={[styles.tabBadgeText, { color: colors.secondary }]}>5</Text>
            </View>
          </Pressable>
        </View>

        {/* Priority Filter Horizontal Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.priorityFilterRow}
        >
          {(['all', 'high', 'medium', 'low'] as PriorityFilter[]).map((p) => {
            const isSelected = priorityFilter === p;
            const labels: Record<PriorityFilter, string> = {
              all: 'Tất cả',
              high: 'Ưu tiên cao',
              medium: 'Trung bình',
              low: 'Thấp'
            };
            return (
              <Pressable
                key={p}
                onPress={() => setPriorityFilter(p)}
                style={[styles.priorityChip, isSelected && styles.activePriorityChip]}
              >
                <Text
                  style={[
                    styles.priorityChipText,
                    isSelected && styles.activePriorityChipText
                  ]}
                >
                  {labels[p]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Quick Add Task Input */}
        <View style={styles.quickAddRow}>
          <TextInput
            style={styles.quickAddInput}
            placeholder="Thêm nhiệm vụ mới..."
            placeholderTextColor={colors.onSurfaceVariant}
            value={newTaskTitle}
            onChangeText={setNewTaskTitle}
            onSubmitEditing={handleAddTask}
          />
          <Pressable onPress={handleAddTask} style={styles.quickAddButton}>
            <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Task List rendered with FlashList */}
        <View style={styles.flashListContainer}>
          <FlashList
            data={tasks}
            estimatedItemSize={70}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TaskItem
                task={item}
                onToggleComplete={() =>
                  toggleCompleteMutation.mutate({
                    id: item.id,
                    isCompleted: !item.isCompleted
                  })
                }
                onDelete={() => deleteTaskMutation.mutate(item.id)}
              />
            )}
            scrollEnabled={false}
          />
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
    paddingBottom: 40
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 10
  },
  pageTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontWeight: '700'
  },
  pageSubtitle: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2
  },
  circleButton: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center'
  },
  metricsCard: {
    backgroundColor: colors.surfaceLow,
    borderRadius: radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginBottom: 14
  },
  metricsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  metricsIconTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  metricsLabel: {
    ...typography.labelLg,
    color: colors.onSurface,
    fontWeight: '600'
  },
  metricsScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4
  },
  metricsFraction: {
    ...typography.headlineSm,
    color: colors.primary,
    fontWeight: '700'
  },
  metricsPercentage: {
    ...typography.labelSm,
    color: colors.tertiaryFixed,
    fontWeight: '600'
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainerHighest,
    overflow: 'hidden',
    marginVertical: 8
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.tertiary
  },
  metricsFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  smallGreenDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.tertiary
  },
  trendText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    fontSize: 11
  },
  remainingText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    fontSize: 11
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLowest || '#060E20',
    borderRadius: radius.full,
    padding: 4,
    marginBottom: 12
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: radius.full
  },
  activeSegmentTab: {
    backgroundColor: colors.primaryContainer
  },
  segmentLabel: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    fontWeight: '600'
  },
  activeSegmentLabel: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  tabBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.full
  },
  tabBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700'
  },
  priorityFilterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 12
  },
  priorityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant
  },
  activePriorityChip: {
    backgroundColor: colors.surfaceBright,
    borderColor: colors.primary
  },
  priorityChipText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    fontWeight: '500'
  },
  activePriorityChipText: {
    color: colors.onSurface,
    fontWeight: '700'
  },
  quickAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginBottom: 14,
    gap: 8
  },
  quickAddInput: {
    flex: 1,
    ...typography.bodyMd,
    color: colors.onSurface
  },
  quickAddButton: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  flashListContainer: {
    minHeight: 250
  }
});
