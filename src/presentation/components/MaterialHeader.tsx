import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { status, triggerSync } = useSyncStore();

  return (
    <View style={[styles.container, { paddingTop: insets.top, height: 56 + insets.top }]}>
      {/* Brand Title */}
      <View style={styles.brandRow}>
        <View style={styles.logoBadge}>
          <Ionicons name="infinite" size={18} color={colors.primary} />
        </View>
        <View style={styles.titleColumn}>
          <Text style={styles.brandTitle}>{title}</Text>
          {subtitle ? <Text style={styles.brandSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>

      {/* Offline-Ready Small Green Dot & Profile Avatar */}
      <View style={styles.actionRow}>
        {showSyncBadge && (
          <Pressable
            onPress={triggerSync}
            style={({ pressed }) => [
              styles.offlinePill,
              pressed && { opacity: 0.7 }
            ]}
          >
            <View style={[styles.emeraldDot, status === 'syncing' && styles.syncingDot]} />
            <Text style={styles.offlineText}>
              {status === 'syncing' ? 'Đang đồng bộ...' : 'Offline-Ready'}
            </Text>
          </Pressable>
        )}

        {/* Profile Avatar */}
        <View style={styles.avatarWrapper}>
          <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 6,
    backgroundColor: colors.background, // #0B0F17
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  logoBadge: {
    width: 30,
    height: 30,
    borderRadius: radius.md,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  titleColumn: {
    justifyContent: 'center'
  },
  brandTitle: {
    ...typography.headlineSm,
    color: colors.onSurface,
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: -0.3
  },
  brandSubtitle: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    fontSize: 10,
    letterSpacing: 1
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  offlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)'
  },
  emeraldDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: '#10B981'
  },
  syncingDot: {
    backgroundColor: colors.secondary
  },
  offlineText: {
    ...typography.labelSm,
    color: '#10B981',
    fontWeight: '600',
    fontSize: 11
  },
  avatarWrapper: {
    width: 30,
    height: 30
  },
  avatarImage: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainer
  }
});
