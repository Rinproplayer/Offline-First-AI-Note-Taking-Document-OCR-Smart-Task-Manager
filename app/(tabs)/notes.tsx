import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { MaterialHeader } from '../../src/presentation/components/MaterialHeader';
import { NoteCard } from '../../src/presentation/components/NoteCard';
import { useNotes } from '../../src/presentation/hooks/useNotesQuery';
import { colors, radius, typography } from '../../src/presentation/theme/colors';

export default function NotesTab() {
  const router = useRouter();
  const { data: notes = [] } = useNotes();

  return (
    <View style={styles.container}>
      <MaterialHeader title="MindVault" subtitle="GHI CHÚ" />

      <View style={styles.listWrapper}>
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
          contentContainerStyle={styles.listPadding}
        />
      </View>

      {/* Floating Action Button (FAB) for Creating New Note */}
      <Pressable
        onPress={() => router.push('/note-editor/new')}
        style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.95 }] }]}
      >
        <Ionicons name="add" size={26} color="#FFFFFF" />
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
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: radius.full,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6
  },
  fabText: {
    ...typography.labelLg,
    color: '#FFFFFF',
    fontWeight: '700'
  }
});
