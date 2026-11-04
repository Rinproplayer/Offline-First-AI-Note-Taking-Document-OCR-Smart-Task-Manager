import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  PanResponder
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Note } from '../../domain/entities/Note';
import { colors, typography } from '../theme/colors';
import { useTheme } from '../stores/useThemeStore';

interface NoteCardProps {
  note: Note;
  onPress: () => void;
  onDelete?: (id: string) => void;
}

/**
 * NoteCard - Thiết kế Tối giản Hiện đại Apple HIG
 * - Hỗ trợ vuốt sang trái (Swipe-to-delete) mượt mà làm lộ nút Xóa màu đỏ (#EF4444).
 * - Hiển thị tiêu đề, 1 dòng tóm tắt ngắn và thời gian sửa đổi.
 * - Hỗ trợ cả 2 giao diện Sáng / Tối.
 */
export const NoteCard: React.FC<NoteCardProps> = ({ note, onPress, onDelete }) => {
  const { colors, isDark } = useTheme();
  const timeAgo = formatTimeAgo(note.updatedAt);
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
    } else {
      onPress();
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(note.id);
    }
  };

  return (
    <View style={styles.swipeContainer}>
      {/* Background Red Delete Button */}
      <View style={styles.deleteBackground}>
        <Pressable
          onPress={handleDelete}
          style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.8 }]}
        >
          <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
          <Text style={styles.deleteBtnText}>Xóa</Text>
        </Pressable>
      </View>

      {/* Foreground Sliding Note Card */}
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            transform: [{ translateX }]
          }
        ]}
        {...panResponder.panHandlers}
      >
        <Pressable
          onPress={handleCardPress}
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: colors.surfaceContainer,
              borderColor: colors.outlineVariant
            },
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
              <Text style={[styles.title, { color: colors.onSurface }]} numberOfLines={1}>
                {note.title || 'Ghi chú không tiêu đề'}
              </Text>
            </View>

            <Text style={[styles.timeText, { color: colors.onSurfaceVariant }]}>{timeAgo}</Text>
          </View>

          {/* 1 Short Content Preview Line */}
          <Text style={[styles.contentPreview, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
            {note.content ? note.content.replace(/\n+/g, ' ') : 'Chưa có nội dung...'}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
};

function formatTimeAgo(date: Date): string {
  if (!date) return 'Vừa xong';
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
    backgroundColor: '#EF4444', // Red button
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
    borderRadius: 16
  },
  card: {
    backgroundColor: '#161C28', // Flat card #161C28
    borderRadius: 16, // Bo góc 16px
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#222B3D'
  },
  pinnedCard: {
    borderColor: 'rgba(16, 185, 129, 0.35)'
  },
  pressedCard: {
    opacity: 0.9
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
    lineHeight: 18
  }
});
