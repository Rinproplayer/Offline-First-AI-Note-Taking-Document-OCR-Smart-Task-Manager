import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  StatusBar
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

export const HomeScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { selectedTag, setSelectedTag, searchQuery, setSearchQuery } = useFilterStore();
  const { data: notes = [], isLoading, refetch } = useNotes(searchQuery, selectedTag);

  const tags = ['Tất cả', 'CleanArchitecture', 'OfflineFirst', 'AI', 'NLP', 'Capstone', 'Đại học'];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <MaterialHeader title="MindVault" subtitle="TRANG CHỦ" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* User Greeting & Notification Header */}
        <View style={styles.greetingRow}>
          <View style={styles.greetingTextColumn}>
            <View style={styles.greetingNameRow}>
              <Text style={styles.greetingName}>Chào buổi sáng, {user.name}</Text>
              <Text style={styles.waveEmoji}>👋</Text>
            </View>
            <Text style={styles.greetingSubtitle}>{user.subtitle}</Text>
          </View>

          <View style={styles.iconButtonsRow}>
            <Pressable style={styles.circleIconButton}>
              <Ionicons name="notifications-outline" size={20} color={colors.onSurface} />
              <View style={styles.notificationBadge} />
            </Pressable>
            <Pressable style={styles.circleIconButton}>
              <Ionicons name="options-outline" size={20} color={colors.onSurface} />
            </Pressable>
          </View>
        </View>

        {/* Offline-First Sync Banner */}
        <SyncStatusBanner />

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.primary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm ghi chú, thẻ hoặc công việc..."
            placeholderTextColor={colors.onSurfaceVariant}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Pressable style={styles.searchActionIcon}>
            <Ionicons name="mic-outline" size={18} color={colors.onSurfaceVariant} />
          </Pressable>
        </View>

        {/* Filter Chips Bar */}
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
                style={[styles.tagChip, isSelected && styles.activeTagChip]}
              >
                <Text style={[styles.tagChipText, isSelected && styles.activeTagChipText]}>
                  {tag}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Quick Actions 2x2 Grid */}
        <Text style={styles.sectionHeader}>Thao tác nhanh</Text>
        <View style={styles.quickGrid}>
          {/* Create Note */}
          <Pressable
            onPress={() => router.push('/note-editor/new')}
            style={({ pressed }) => [styles.quickCard, pressed && { opacity: 0.85 }]}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: 'rgba(99, 102, 241, 0.2)' }]}>
              <Ionicons name="create" size={20} color={colors.primary} />
            </View>
            <Text style={styles.quickTitle}>Ghi chú mới</Text>
            <Text style={styles.quickSub}>Soạn thảo & lưu offline</Text>
          </Pressable>

          {/* OCR Scanner */}
          <Pressable
            onPress={() => router.push('/ocr')}
            style={({ pressed }) => [styles.quickCard, pressed && { opacity: 0.85 }]}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.2)' }]}>
              <Ionicons name="camera" size={20} color={colors.secondary} />
            </View>
            <Text style={styles.quickTitle}>Quét OCR</Text>
            <Text style={styles.quickSub}>Google ML Kit on-device</Text>
          </Pressable>

          {/* Task Tracker */}
          <Pressable
            onPress={() => router.push('/tasks')}
            style={({ pressed }) => [styles.quickCard, pressed && { opacity: 0.85 }]}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
              <Ionicons name="checkbox" size={20} color={colors.tertiary} />
            </View>
            <Text style={styles.quickTitle}>Nhiệm vụ</Text>
            <Text style={styles.quickSub}>Theo dõi tiến độ tuần</Text>
          </Pressable>

          {/* AI Copilot */}
          <Pressable
            onPress={() => router.push('/note-editor/note_1')}
            style={({ pressed }) => [styles.quickCard, pressed && { opacity: 0.85 }]}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: 'rgba(192, 193, 255, 0.2)' }]}>
              <Ionicons name="sparkles" size={20} color={colors.primaryFixed} />
            </View>
            <Text style={styles.quickTitle}>Trợ lý AI</Text>
            <Text style={styles.quickSub}>Tóm tắt & trích xuất việc</Text>
          </Pressable>
        </View>

        {/* Recent Notes Section with FlashList */}
        <View style={styles.recentNotesHeaderRow}>
          <Text style={styles.sectionHeader}>Ghi chú gần đây</Text>
          <Text style={styles.notesCountBadge}>{notes.length} ghi chú</Text>
        </View>

        <View style={styles.flashListWrapper}>
          <FlashList
            data={notes}
            estimatedItemSize={120}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <NoteCard
                note={item}
                onPress={() => router.push(`/note-editor/${item.id}`)}
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
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
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
    paddingHorizontal: 14,
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
    paddingVertical: 6,
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
    minHeight: 100,
    justifyContent: 'center'
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
    marginTop: 14
  },
  notesCountBadge: {
    ...typography.labelSm,
    color: colors.primaryFixed,
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full
  },
  flashListWrapper: {
    minHeight: 200,
    marginTop: 6
  }
});
