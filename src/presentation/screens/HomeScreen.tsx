import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  StatusBar,
  RefreshControl
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, radius } from '../theme/colors';
import { MaterialHeader } from '../components/MaterialHeader';
import { SyncStatusBanner } from '../components/SyncStatusBanner';
import { NoteCard } from '../components/NoteCard';
import { useAuthStore } from '../stores/useAuthStore';
import { useFilterStore } from '../stores/useFilterStore';
import { useNotes } from '../hooks/useNotesQuery';
import { Note } from '../../domain/entities/Note';

/**
 * Màn hình Trang Chủ (Home Dashboard) - MindVault
 *
 * TỐI ƯU HIỆU NĂNG 60FPS:
 * - Sử dụng @shopify/flash-list làm container cuộn chính duy nhất với ListHeaderComponent.
 * - Tái sử dụng ô (Cell recycling) với estimatedItemSize={125}.
 * - Áp dụng bảng màu Dark Mode Material 3 chuẩn (Slate #0F172A, Indigo #6366F1, Emerald #10B981).
 * - Kết nối dữ liệu thời gian thực từ WatermelonDB qua TanStack Query & Zustand.
 */
export const HomeScreen: React.FC = () => {
  const router = useRouter();

  // 1. Kết nối Zustand Stores
  const { user } = useAuthStore();
  const { selectedTag, setSelectedTag, searchQuery, setSearchQuery } = useFilterStore();

  // 2. Kết nối TanStack Query Hook lấy dữ liệu từ WatermelonNoteRepository
  const { data: notes = [], isLoading, refetch } = useNotes(searchQuery, selectedTag);

  const tags = useMemo(
    () => ['Tất cả', 'CleanArchitecture', 'OfflineFirst', 'AI', 'NLP', 'Capstone', 'Đại học'],
    []
  );

  /**
   * Component Header của FlashList chứa toàn bộ phần chào mừng, banner đồng bộ,
   * thanh tìm kiếm, bộ lọc thẻ và lưới thao tác nhanh.
   */
  const renderListHeader = () => (
    <View style={styles.headerContainer}>
      {/* Lời chào người dùng & nút thông báo */}
      <View style={styles.greetingRow}>
        <View style={styles.greetingTextColumn}>
          <View style={styles.greetingNameRow}>
            <Text style={styles.greetingName}>Chào buổi sáng, {user.name}</Text>
            <Text style={styles.waveEmoji}>👋</Text>
          </View>
          <Text style={styles.greetingSubtitle}>{user.subtitle}</Text>
        </View>

        <View style={styles.iconButtonsRow}>
          <Pressable
            accessibilityLabel="Thông báo"
            style={({ pressed }) => [styles.circleIconButton, pressed && { opacity: 0.75 }]}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.onSurface} />
            <View style={styles.notificationBadge} />
          </Pressable>
          <Pressable
            accessibilityLabel="Cài đặt"
            style={({ pressed }) => [styles.circleIconButton, pressed && { opacity: 0.75 }]}
          >
            <Ionicons name="options-outline" size={20} color={colors.onSurface} />
          </Pressable>
        </View>
      </View>

      {/* Banner trạng thái Offline-First WatermelonDB & Supabase Sync */}
      <SyncStatusBanner />

      {/* Thanh tìm kiếm toàn văn */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.primary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm ghi chú, thẻ hoặc công việc..."
          placeholderTextColor={colors.onSurfaceVariant}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 ? (
          <Pressable hitSlop={8} onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.onSurfaceVariant} />
          </Pressable>
        ) : (
          <Pressable style={styles.searchActionIcon}>
            <Ionicons name="mic-outline" size={18} color={colors.onSurfaceVariant} />
          </Pressable>
        )}
      </View>

      {/* Danh sách chip lọc thẻ ngang */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterChipsContainer}
      >
        {tags.map((tag) => {
          const isSelected = selectedTag === tag;
          return (
            <Pressable
              key={tag}
              onPress={() => setSelectedTag(tag)}
              style={({ pressed }) => [
                styles.tagChip,
                isSelected && styles.activeTagChip,
                pressed && { opacity: 0.8 }
              ]}
            >
              <Text style={[styles.tagChipText, isSelected && styles.activeTagChipText]}>
                {tag}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Lưới thao tác nhanh 2x2 (Material 3 Touch Targets >= 48dp) */}
      <Text style={styles.sectionHeader}>Thao tác nhanh</Text>
      <View style={styles.quickGrid}>
        {/* Tạo ghi chú mới */}
        <Pressable
          onPress={() => router.push('/note-editor/new')}
          style={({ pressed }) => [styles.quickCard, pressed && styles.cardPressed]}
        >
          <View style={[styles.quickIconCircle, { backgroundColor: 'rgba(99, 102, 241, 0.2)' }]}>
            <Ionicons name="create" size={20} color={colors.primary} />
          </View>
          <Text style={styles.quickTitle}>Ghi chú mới</Text>
          <Text style={styles.quickSub}>Soạn thảo & lưu offline</Text>
        </Pressable>

        {/* Quét OCR Google ML Kit */}
        <Pressable
          onPress={() => router.push('/ocr')}
          style={({ pressed }) => [styles.quickCard, pressed && styles.cardPressed]}
        >
          <View style={[styles.quickIconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.2)' }]}>
            <Ionicons name="camera" size={20} color={colors.secondary} />
          </View>
          <Text style={styles.quickTitle}>Quét OCR</Text>
          <Text style={styles.quickSub}>Google ML Kit on-device</Text>
        </Pressable>

        {/* Theo dõi công việc */}
        <Pressable
          onPress={() => router.push('/tasks')}
          style={({ pressed }) => [styles.quickCard, pressed && styles.cardPressed]}
        >
          <View style={[styles.quickIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
            <Ionicons name="checkbox" size={20} color={colors.tertiary} />
          </View>
          <Text style={styles.quickTitle}>Nhiệm vụ</Text>
          <Text style={styles.quickSub}>Theo dõi tiến độ tuần</Text>
        </Pressable>

        {/* Trợ lý AI Streaming */}
        <Pressable
          onPress={() => router.push('/note-editor/note_1')}
          style={({ pressed }) => [styles.quickCard, pressed && styles.cardPressed]}
        >
          <View style={[styles.quickIconCircle, { backgroundColor: 'rgba(192, 193, 255, 0.2)' }]}>
            <Ionicons name="sparkles" size={20} color={colors.primaryFixed} />
          </View>
          <Text style={styles.quickTitle}>Trợ lý AI</Text>
          <Text style={styles.quickSub}>Tóm tắt & trích xuất việc</Text>
        </Pressable>
      </View>

      {/* Tiêu đề danh sách ghi chú gần đây */}
      <View style={styles.recentNotesHeaderRow}>
        <Text style={styles.sectionHeader}>Ghi chú gần đây</Text>
        <Text style={styles.notesCountBadge}>
          {notes.length} ghi chú {selectedTag !== 'Tất cả' ? `• #${selectedTag}` : ''}
        </Text>
      </View>
    </View>
  );

  /**
   * Component hiển thị khi không tìm thấy ghi chú phù hợp
   */
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={44} color={colors.outline} />
      <Text style={styles.emptyTitle}>Chưa có ghi chú nào</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery ? 'Không tìm thấy kết quả phù hợp với từ khóa.' : 'Hãy tạo ghi chú đầu tiên hoặc quét tài liệu OCR!'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <MaterialHeader title="MindVault" subtitle="TRANG CHỦ" />

      {/* FlashList 60fps Scrolling Container */}
      <FlashList
        data={notes}
        keyExtractor={(item: Note) => item.id}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyList}
        renderItem={({ item }: { item: Note }) => (
          <NoteCard
            note={item}
            onPress={() => router.push(`/note-editor/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.flashListContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              refetch();
            }}
            tintColor={colors.primary}
            colors={[colors.primary, colors.secondary]}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background // Slate #0F172A
  },
  flashListContent: {
    paddingHorizontal: 16,
    paddingBottom: 40
  },
  headerContainer: {
    paddingBottom: 6
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 8
  },
  greetingTextColumn: {
    flex: 1
  },
  greetingNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  greetingName: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontWeight: '700'
  },
  waveEmoji: {
    fontSize: 18
  },
  greetingSubtitle: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2
  },
  iconButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  circleIconButton: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  notificationBadge: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.error
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.full,
    paddingHorizontal: 16,
    height: 48,
    gap: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.outlineVariant
  },
  searchInput: {
    flex: 1,
    ...typography.bodyMd,
    color: colors.onSurface
  },
  searchActionIcon: {
    padding: 4
  },
  filterChipsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 12
  },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant
  },
  activeTagChip: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primary
  },
  tagChipText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    fontWeight: '600'
  },
  activeTagChipText: {
    color: '#FFFFFF'
  },
  sectionHeader: {
    ...typography.headlineSm,
    color: colors.onSurface,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 10
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  quickCard: {
    width: '48%',
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    minHeight: 104,
    justifyContent: 'center'
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9
  },
  quickIconCircle: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  quickTitle: {
    ...typography.labelLg,
    color: colors.onSurface,
    fontWeight: '700'
  },
  quickSub: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    fontSize: 11,
    marginTop: 2
  },
  recentNotesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 8
  },
  notesCountBadge: {
    ...typography.labelSm,
    color: colors.primaryFixed,
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    gap: 8
  },
  emptyTitle: {
    ...typography.headlineSm,
    color: colors.onSurface,
    fontWeight: '600'
  },
  emptySubtitle: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 240
  }
});
