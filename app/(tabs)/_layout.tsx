import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import { radius } from '../../src/presentation/theme/colors';
import { useTheme } from '../../src/presentation/stores/useThemeStore';

export default function TabLayout() {
  const { colors, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.96)',
          borderTopColor: colors.outlineVariant,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 86 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
          elevation: 8
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600'
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color, focused }: any) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={22}
              color={color}
            />
          )
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: 'Ghi chú',
          tabBarIcon: ({ color, focused }: any) => (
            <Ionicons
              name={focused ? 'document-text' : 'document-text-outline'}
              size={22}
              color={color}
            />
          )
        }}
      />
      <Tabs.Screen
        name="ocr"
        options={{
          title: 'Quét OCR',
          tabBarIcon: ({ color, focused }: any) => (
            <View style={focused ? [styles.activeOcrIcon, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.15)' }] : undefined}>
              <Ionicons
                name={focused ? 'scan' : 'scan-outline'}
                size={22}
                color={focused ? colors.secondary : color}
              />
            </View>
          )
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Nhiệm vụ',
          tabBarIcon: ({ color, focused }: any) => (
            <Ionicons
              name={focused ? 'checkbox' : 'checkbox-outline'}
              size={22}
              color={focused ? colors.tertiary : color}
            />
          )
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeOcrIcon: {
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: radius.full
  }
});
