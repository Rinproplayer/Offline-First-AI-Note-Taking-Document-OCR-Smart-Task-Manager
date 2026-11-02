import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, radius } from '../theme/colors';
import { useSyncStore } from '../stores/useSyncStore';

export const SyncStatusBanner: React.FC = () => {
  const { status, statusLabel, lastSyncTime, triggerSync } = useSyncStore();

  const formattedTime = lastSyncTime
    ? new Date(lastSyncTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : 'Vừa xong';

  return (
    <Pressable
      onPress={triggerSync}
      style={({ pressed }) => [styles.bannerContainer, pressed && { opacity: 0.85 }]}
    >
      <View style={styles.leftRow}>
        <View style={styles.pulseContainer}>
          <View
            style={[
              styles.pulseDot,
              { backgroundColor: status === 'syncing' ? colors.secondary : colors.tertiary }
            ]}
          />
        </View>
        <Text style={styles.statusTitle}>{statusLabel}</Text>
      </View>

      <View style={styles.rightRow}>
        <Ionicons
          name={status === 'syncing' ? 'sync' : 'cloud-done-outline'}
          size={16}
          color={status === 'syncing' ? colors.secondary : colors.tertiary}
        />
        <Text style={styles.statusSubtitle}>WatermelonDB • {formattedTime}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginVertical: 8
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  pulseContainer: {
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full
  },
  statusTitle: {
    ...typography.labelMd,
    color: colors.tertiary,
    fontWeight: '600',
    letterSpacing: 0.2
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  statusSubtitle: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant
  }
});
