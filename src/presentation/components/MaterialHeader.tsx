import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, radius } from '../theme/colors';
import { useAuthStore } from '../stores/useAuthStore';
import { useSyncStore } from '../stores/useSyncStore';

interface MaterialHeaderProps {
  title?: string;
  subtitle?: string;
  showSyncBadge?: boolean;
  onNotificationPress?: () => void;
  onSettingsPress?: () => void;
}

export const MaterialHeader: React.FC<MaterialHeaderProps> = ({
  title = 'MindVault',
  subtitle = 'TRANG CHỦ',
  showSyncBadge = true,
  onNotificationPress,
  onSettingsPress
}) => {
  const { user } = useAuthStore();
  const { status, triggerSync } = useSyncStore();

  return (
    <View style={styles.container}>
      {/* Brand Logo & Title */}
      <View style={styles.brandRow}>
        <View style={styles.logoBadge}>
          <Ionicons name="infinite" size={22} color={colors.primaryFixed} />
        </View>
        <View style={styles.titleColumn}>
          <Text style={styles.brandTitle}>{title}</Text>
          <Text style={styles.brandSubtitle}>{subtitle}</Text>
        </View>
      </View>

      {/* Sync Badge & Profile Avatar */}
      <View style={styles.actionRow}>
        {showSyncBadge && (
          <Pressable
            onPress={triggerSync}
            style={({ pressed }) => [
              styles.syncBadge,
              status === 'syncing' && styles.syncingBadge,
              pressed && { opacity: 0.75 }
            ]}
          >
            <Ionicons
              name={status === 'syncing' ? 'sync' : 'checkmark-circle-outline'}
              size={14}
              color={status === 'syncing' ? colors.secondary : colors.tertiary}
            />
            <Text style={styles.syncText}>
              {status === 'syncing' ? 'Đang sync...' : 'Ngoại tuyến'}
            </Text>
          </Pressable>
        )}

        {/* Profile Avatar with Status Dot */}
        <View style={styles.avatarWrapper}>
          <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
          <View style={styles.onlineDot} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(11, 19, 38, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center'
  },
  titleColumn: {
    justifyContent: 'center'
  },
  brandTitle: {
    ...typography.headlineSm,
    color: colors.primary,
    fontWeight: '700',
    letterSpacing: -0.5
  },
  brandSubtitle: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    letterSpacing: 1.5,
    marginTop: -2
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)'
  },
  syncingBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: 'rgba(56, 189, 248, 0.3)'
  },
  syncText: {
    ...typography.labelSm,
    color: colors.tertiaryFixed,
    fontWeight: '600'
  },
  avatarWrapper: {
    position: 'relative',
    width: 36,
    height: 36
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainerHigh
  },
  onlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.tertiary,
    borderWidth: 2,
    borderColor: colors.surfaceLow
  }
});
