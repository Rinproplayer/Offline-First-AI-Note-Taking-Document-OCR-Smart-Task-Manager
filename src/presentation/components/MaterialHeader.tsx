import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { typography, radius } from '../theme/colors';
import { useAuthStore } from '../stores/useAuthStore';
import { useSyncStore } from '../stores/useSyncStore';
import { useTheme } from '../stores/useThemeStore';

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
  const { colors, isDark, toggleTheme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          height: 56 + insets.top,
          backgroundColor: colors.background,
          borderBottomColor: colors.outlineVariant
        }
      ]}
    >
      {/* Brand Title */}
      <View style={styles.brandRow}>
        <View
          style={[
            styles.logoBadge,
            {
              backgroundColor: isDark
                ? 'rgba(99, 102, 241, 0.12)'
                : 'rgba(79, 70, 229, 0.1)'
            }
          ]}
        >
          <Ionicons name="infinite" size={18} color={colors.primary} />
        </View>
        <View style={styles.titleColumn}>
          <Text style={[styles.brandTitle, { color: colors.onSurface }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.brandSubtitle, { color: colors.onSurfaceVariant }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Offline-Ready, Theme Toggle & Profile Avatar */}
      <View style={styles.actionRow}>
        {showSyncBadge && (
          <Pressable
            onPress={triggerSync}
            style={({ pressed }) => [
              styles.offlinePill,
              {
                backgroundColor: isDark
                  ? 'rgba(16, 185, 129, 0.12)'
                  : 'rgba(16, 185, 129, 0.15)'
              },
              pressed && { opacity: 0.7 }
            ]}
          >
            <View style={[styles.emeraldDot, status === 'syncing' && styles.syncingDot]} />
            <Text style={[styles.offlineText, { color: colors.tertiary }]}>
              {status === 'syncing' ? 'Đang đồng bộ...' : 'Offline-Ready'}
            </Text>
          </Pressable>
        )}

        {/* Theme Toggle Button (Light/Dark Mode) */}
        <Pressable
          hitSlop={10}
          onPress={toggleTheme}
          style={({ pressed }) => [
            styles.themeBtn,
            {
              backgroundColor: colors.surfaceContainer,
              borderColor: colors.outlineVariant
            },
            pressed && { opacity: 0.7 }
          ]}
        >
          <Ionicons
            name={isDark ? 'sunny-outline' : 'moon-outline'}
            size={18}
            color={isDark ? '#FBBF24' : '#4F46E5'}
          />
        </Pressable>

        {/* Profile Avatar */}
        <View style={[styles.avatarWrapper, { borderColor: colors.outlineVariant }]}>
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
    borderBottomWidth: 1
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
    alignItems: 'center',
    justifyContent: 'center'
  },
  titleColumn: {
    justifyContent: 'center'
  },
  brandTitle: {
    ...typography.headlineSm,
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: -0.3
  },
  brandSubtitle: {
    ...typography.labelSm,
    fontSize: 9,
    letterSpacing: 0.6,
    fontWeight: '700'
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  offlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.full
  },
  emeraldDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981'
  },
  syncingDot: {
    backgroundColor: '#38BDF8'
  },
  offlineText: {
    ...typography.labelSm,
    fontSize: 11,
    fontWeight: '600'
  },
  themeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1
  },
  avatarWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1
  },
  avatarImage: {
    width: '100%',
    height: '100%'
  }
});
