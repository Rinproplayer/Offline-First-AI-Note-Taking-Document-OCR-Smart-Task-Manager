import React from 'react';
import { View, StyleSheet, Pressable, Text, StatusBar } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { MaterialHeader } from '../../src/presentation/components/MaterialHeader';
import { NoteCard } from '../../src/presentation/components/NoteCard';
import { useNotes, useDeleteNote } from '../../src/presentation/hooks/useNotesQuery';
import { colors, radius, typography } from '../../src/presentation/theme/colors';
import { useTheme } from '../../src/presentation/stores/useThemeStore';

/**
 * NotesTab - Minimalist Apple HIG & Material 3 Refactored
 * - Hỗ trợ đầy đủ Giao diện Sáng (Light) & Tối (Dark).
 * - Danh sách dọc 1 cột với hiệu ứng vuốt xóa (Swipe-to-delete) mượt mà 60fps.
 * - Trạng thái trống sạch sẽ, hiện đại.
 * - Nút tạo ghi chú nổi (FAB) tinh tế.
 */
export default function NotesTab() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { data: notes = [] } = useNotes();
  const deleteNoteMutation = useDeleteNote();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <MaterialHeader title="MindVault" subtitle="GHI CHÚ" />

      <View style={styles.listWrapper}>
        <FlashList
          data={notes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NoteCard
              note={item}
              onPress={() => router.push(`/note-editor/${item.id}`)}
              onDelete={(id) => deleteNoteMutation.mutate(id)}
            />
          )}
          contentContainerStyle={styles.listPadding}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="document-text-outline"
                size={48}
                color={colors.outlineVariant}
                style={{ marginBottom: 12 }}
              />
              <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
                Chưa có ghi chú nào
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.onSurfaceVariant }]}>
                Chạm vào nút "+ Tạo ghi chú" bên dưới để viết ghi chú đầu tiên của bạn.
              </Text>
            </View>
          }
        />
      </View>

      {/* Floating Action Button (FAB) for Creating New Note */}
      <Pressable
        onPress={() => router.push('/note-editor/new')}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: colors.primary,
            shadowColor: colors.primary
          },
          pressed && { transform: [{ scale: 0.95 }], opacity: 0.9 }
        ]}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
        <Text style={styles.fabText}>Tạo ghi chú</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  listWrapper: {
    flex: 1
  },
  listPadding: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 90
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32
  },
  emptyTitle: {
    ...typography.titleMedium,
    color: colors.onSurface,
    fontWeight: '600',
    marginBottom: 6
  },
  emptySubtitle: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: radius.full,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6
  },
  fabText: {
    ...typography.labelLarge,
    color: '#FFFFFF',
    fontWeight: '700'
  }
});
