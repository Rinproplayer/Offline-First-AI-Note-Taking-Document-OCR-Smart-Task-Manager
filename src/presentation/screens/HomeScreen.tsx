import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  StatusBar,
  RefreshControl,
  Alert
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, radius } from '../theme/colors';
import { MaterialHeader } from '../components/MaterialHeader';
import { NoteCard } from '../components/NoteCard';
import { useAuthStore } from '../stores/useAuthStore';
import { useFilterStore } from '../stores/useFilterStore';
import { useNotes, useDeleteNote } from '../hooks/useNotesQuery';
import { useTasks, useToggleTaskComplete } from '../hooks/useTasksQuery';
import { useTheme } from '../stores/useThemeStore';
import { Note } from '../../domain/entities/Note';

/**
 * Màn hình Trang Chủ (Home Dashboard) - Phong cách Tối giản Apple HIG & Material 3
 * - Hỗ trợ cả 2 giao diện Sáng (Light Mode) và Tối (Dark Mode).
 * - Không có banner thống kê phức tạp.
 * - Danh sách 1 cột dọc thoáng đãng với FlashList 60fps.
 * - Khu vực 3 dòng checkbox "Việc cần làm hôm nay" gọn gàng.
 */
export const HomeScreen: React.FC = () => {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  // Zustand Store
  const { user } = useAuthStore();
  const { selectedTag, setSelectedTag, searchQuery, setSearchQuery } = useFilterStore();

  // TanStack Query Hooks
  const { data: notes = [], isLoading, refetch } = useNotes(searchQuery, selectedTag);
  const { data: allTasks = [] } = useTasks();
  const toggleCompleteMutation = useToggleTaskComplete();
  const deleteNoteMutation = useDeleteNote();

  // Lấy tối đa 3 nhiệm vụ hôm nay
  const todayTasks = useMemo(() => {
    return allTasks.slice(0, 3);
  }, [allTasks]);

  const categories = useMemo(
    () => ['Tất cả', 'Học tập', 'Dự án', 'Công việc', 'Ý tưởng'],
    []
  );

  const renderHeader = () => (
    <View style={styles.headerArea}>
      {/* Search Input Bar */}
      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: colors.surfaceContainer,
            borderColor: colors.outlineVariant
          }
        ]}
      >
        <Ionicons name="search" size={16} color={colors.onSurfaceVariant} />
        <TextInput
          style={[styles.searchInput, { color: colors.onSurface }]}
          placeholder="Tìm kiếm ghi chú..."
          placeholderTextColor={colors.onSurfaceVariant}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <Pressable hitSlop={8} onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={16} color={colors.onSurfaceVariant} />
          </Pressable>
        )}
      </View>

      {/* Subtle Category Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
      >
        {categories.map((cat) => {
          const isSelected = selectedTag === cat;
          return (
            <Pressable
              key={cat}
              onPress={() => setSelectedTag(cat === 'Tất cả' ? '' : cat)}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surfaceContainer,
                  borderColor: isSelected ? colors.primary : colors.outlineVariant
                }
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  { color: isSelected ? '#FFFFFF' : colors.onSurfaceVariant },
                  isSelected && styles.activeCategoryText
                ]}
              >
                {cat}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Việc cần làm hôm nay (Gom gọn 3 dòng Checkbox) */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Việc hôm nay</Text>
        <Pressable onPress={() => router.push('/tasks')}>
          <Text style={[styles.viewAllText, { color: colors.primary }]}>Xem tất cả</Text>
        </Pressable>
      </View>

      <View
        style={[
          styles.tasksBox,
          {
            backgroundColor: colors.surfaceContainer,
            borderColor: colors.outlineVariant
          }
        ]}
      >
        {todayTasks.length > 0 ? (
          todayTasks.map((t) => (
            <Pressable
              key={t.id}
              onPress={() =>
                toggleCompleteMutation.mutate({ id: t.id, isCompleted: !t.isCompleted })
              }
              style={styles.taskRow}
            >
              <Ionicons
                name={t.isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={t.isCompleted ? colors.tertiary : colors.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.taskTitle,
                  { color: t.isCompleted ? colors.onSurfaceVariant : colors.onSurface },
                  t.isCompleted && styles.completedTaskTitle
                ]}
                numberOfLines={1}
              >
                {t.title}
              </Text>
            </Pressable>
          ))
        ) : (
          <Text style={[styles.emptyTasksText, { color: colors.onSurfaceVariant }]}>
            Không có việc cần làm hôm nay ✨
          </Text>
        )}
      </View>

      {/* Recent Notes Header */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Ghi chú gần đây</Text>
        <Text style={[styles.countText, { color: colors.onSurfaceVariant }]}>{notes.length}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <MaterialHeader title="MindVault" subtitle="" />

      <View style={styles.listContainer}>
        <FlashList
          data={notes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NoteCard
              note={item}
              onPress={() => router.push(`/note-editor/${item.id}`)}
              onDelete={(id) => {
                Alert.alert(
                  'Xóa ghi chú',
                  `Bạn có chắc chắn muốn xóa "${item.title || 'ghi chú này'}" không?`,
                  [
                    { text: 'Hủy', style: 'cancel' },
                    {
                      text: 'Xóa',
                      style: 'destructive',
                      onPress: () => deleteNoteMutation.mutate(id)
                    }
                  ]
                );
              }}
            />
          )}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listPadding}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => {
                refetch();
              }}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={32} color={colors.outline} />
                <Text style={styles.emptyText}>Chưa có ghi chú nào</Text>
                <Pressable
                  onPress={() => router.push('/note-editor/new')}
                  style={styles.createNoteBtn}
                >
                  <Text style={styles.createNoteBtnText}>Tạo ghi chú mới</Text>
                </Pressable>
              </View>
            ) : null
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background // #0B0F17
  },
  listContainer: {
    flex: 1
  },
  listPadding: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40
  },
  headerArea: {
    marginBottom: 8
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161C28', // Thẻ phẳng #161C28
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#222B3D',
    marginBottom: 12
  },
  searchInput: {
    flex: 1,
    ...typography.bodyMd,
    color: colors.onSurface,
    marginLeft: 8,
    paddingVertical: 0
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: '#161C28',
    borderWidth: 1,
    borderColor: '#222B3D'
  },
  activeCategoryChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  categoryText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    fontWeight: '500'
  },
  activeCategoryText: {
    color: '#FFFFFF',
    fontWeight: '600'
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 6
  },
  sectionTitle: {
    ...typography.labelLg,
    color: colors.onSurface,
    fontWeight: '700',
    fontSize: 15
  },
  viewAllText: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: '600'
  },
  countText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    fontSize: 12
  },
  tasksBox: {
    backgroundColor: '#161C28', // Thẻ phẳng #161C28
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#222B3D',
    marginBottom: 16
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9
  },
  taskTitle: {
    ...typography.bodySm,
    color: colors.onSurface,
    fontSize: 13,
    flex: 1
  },
  completedTaskTitle: {
    color: colors.onSurfaceVariant,
    textDecorationLine: 'line-through'
  },
  emptyTasksText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    paddingVertical: 8,
    fontSize: 12
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10
  },
  emptyText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant
  },
  createNoteBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full
  },
  createNoteBtnText: {
    ...typography.labelSm,
    color: '#FFFFFF',
    fontWeight: '600'
  }
});
