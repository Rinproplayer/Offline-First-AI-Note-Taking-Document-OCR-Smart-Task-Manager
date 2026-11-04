import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Note } from '../../domain/entities/Note';
import { colors, typography } from '../theme/colors';

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
      {/* Title & Time Row */}
      <View style={styles.topRow}>
        <View style={styles.titleContainer}>
          {note.isPinned && (
            <Ionicons name="pin" size={13} color={colors.primary} style={styles.pinIcon} />
          )}
          <Text style={styles.title} numberOfLines={1}>
            {note.title || 'Ghi chú không tiêu đề'}
          </Text>
        </View>

        <Text style={styles.timeText}>{timeAgo}</Text>
      </View>

      {/* 1 Short Content Preview Line */}
      <Text style={styles.contentPreview} numberOfLines={1}>
        {note.content ? note.content.replace(/\n+/g, ' ') : 'Chưa có nội dung...'}
      </Text>
    </Pressable>
  );
};

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Vừa xong';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}p trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#161C28', // Flat card #161C28
    borderRadius: 16, // Bo góc 16px
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#222B3D'
  },
  pinnedCard: {
    borderColor: 'rgba(99, 102, 241, 0.35)'
  },
  pressedCard: {
    transform: [{ scale: 0.99 }],
    opacity: 0.85
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10
  },
  pinIcon: {
    marginRight: 6
  },
  title: {
    ...typography.headlineSm,
    fontSize: 16,
    fontWeight: '600',
    color: colors.onSurface
  },
  timeText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    fontSize: 11
  },
  contentPreview: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 18
  }
});
