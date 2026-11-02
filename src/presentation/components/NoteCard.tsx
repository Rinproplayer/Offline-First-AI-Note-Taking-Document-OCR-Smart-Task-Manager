import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Note } from '../../domain/entities/Note';
import { colors, typography, radius } from '../theme/colors';

interface NoteCardProps {
  note: Note;
  onPress: () => void;
  onLongPress?: () => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, onPress, onLongPress }) => {
  const timeAgo = formatTimeAgo(note.updatedAt);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.card,
        note.isPinned && styles.pinnedCard,
        pressed && styles.pressedCard
      ]}
    >
      {/* Header Row: Title & Badges */}
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          {note.isPinned && (
            <Ionicons name="pin" size={14} color={colors.primary} style={styles.pinIcon} />
          )}
          <Text style={styles.title} numberOfLines={1}>
            {note.title}
          </Text>
        </View>

        {note.hasOcr && (
          <View style={styles.ocrBadge}>
            <Ionicons name="scan-outline" size={12} color={colors.secondary} />
            <Text style={styles.ocrBadgeText}>OCR</Text>
          </View>
        )}
      </View>

      {/* Content Preview */}
      <Text style={styles.contentPreview} numberOfLines={2}>
        {note.content}
      </Text>

      {/* Footer: Tags & Time */}
      <View style={styles.footerRow}>
        <View style={styles.tagsContainer}>
          {note.tags.slice(0, 3).map((tag, idx) => (
            <View key={idx} style={styles.tagChip}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>

        <View style={styles.timeRow}>
          <Ionicons name="time-outline" size={12} color={colors.onSurfaceVariant} />
          <Text style={styles.timeText}>{timeAgo}</Text>
        </View>
      </View>
    </Pressable>
  );
};

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Vừa xong';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3
  },
  pinnedCard: {
    borderColor: 'rgba(99, 102, 241, 0.4)',
    backgroundColor: 'rgba(23, 31, 51, 0.95)'
  },
  pressedCard: {
    transform: [{ scale: 0.985 }],
    opacity: 0.9
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8
  },
  pinIcon: {
    marginRight: 6
  },
  title: {
    ...typography.headlineSm,
    color: colors.onSurface,
    fontWeight: '700',
    flex: 1
  },
  ocrBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full
  },
  ocrBadgeText: {
    ...typography.labelSm,
    color: colors.secondary,
    fontWeight: '700'
  },
  contentPreview: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: 12
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  tagChip: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full
  },
  tagText: {
    ...typography.labelSm,
    color: colors.primaryFixed,
    fontWeight: '500'
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  timeText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant
  }
});
