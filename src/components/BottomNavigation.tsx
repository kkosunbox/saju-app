import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Icon, { IconName } from './Icon';
import { colors, isDark } from '../theme/colors';
import { shadow } from '../theme/typography';

const INACTIVE = isDark ? '#6B707C' : '#B0B0B0';

type BottomTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

/** 키는 src/app/(tabs) 의 라우트 이름 */
const ITEMS: Record<string, { label: string; icon: IconName }> = {
  index: { label: '홈', icon: 'home' },
  consult: { label: '상담', icon: 'chat' },
  content: { label: '콘텐츠', icon: 'grid' },
  compatibility: { label: '궁합', icon: 'chatHeart' },
  my: { label: '마이', icon: 'user' },
};

function TabItem({ focused, label, icon, onPress }: { focused: boolean; label: string; icon: IconName; onPress(): void }) {
  const v = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!focused) return;
    v.setValue(0.85);
    Animated.spring(v, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 10 }).start();
  }, [focused]);
  const on = focused ? colors.ink : INACTIVE;
  return (
    <Pressable onPress={onPress} style={s.item} accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={label}>
      <Animated.View style={{ transform: [{ scale: v }] }}>
        <Icon name={icon} size={24} color={on} strokeWidth={focused ? 2 : 1.7} />
      </Animated.View>
      <Text style={[s.label, { color: on }, focused && { fontWeight: '700' }]}>{label}</Text>
    </Pressable>
  );
}

export default function BottomNavigation({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.bar, shadow.float, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {state.routes.map((route, i) => {
        const focused = state.index === i;
        const item = ITEMS[route.name];
        return (
          <TabItem
            key={route.key}
            focused={focused}
            label={item.label}
            icon={item.icon}
            onPress={() => {
              const e = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !e.defaultPrevented) {
                Haptics.selectionAsync().catch(() => {});
                navigateToTab(route.key);
              }
            }}
          />
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: colors.cream, paddingTop: 14, paddingHorizontal: 13, borderTopWidth: 1, borderTopColor: isDark ? colors.line : '#EDEDED' },
  item: { flex: 1, alignItems: 'center', gap: 4 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: -0.3 },
});
