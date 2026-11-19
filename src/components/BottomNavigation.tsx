import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Icon, { IconName } from './Icon';
import { colors, isDark } from '../theme/colors';
import { shadow } from '../theme/typography';

const INACTIVE = isDark ? '#6B707C' : '#B0B0B0';
const BAR_LINE = isDark ? colors.line : '#EDEDED';

type BottomTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

/** 키는 src/app/(tabs) 의 라우트 이름. 운알톡이 첫 화면 */
const ITEMS: Record<string, { label: string; icon: IconName }> = {
  index: { label: '운알톡', icon: 'chat' },
  talks: { label: '대화 기록', icon: 'clock' },
  content: { label: '리포트', icon: 'sheet' },
  my: { label: '마이', icon: 'user' },
};

type ItemProps = { focused: boolean; label: string; onPress(): void };

function TabItem({ focused, label, icon, onPress }: ItemProps & { icon: IconName }) {
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
        <Icon name={icon} size={24} color={on} strokeWidth={2} />
      </Animated.View>
      <Text style={[s.label, { color: on }]}>{label}</Text>
    </Pressable>
  );
}

export default function BottomNavigation({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.bar, shadow.float, { paddingBottom: Math.max(insets.bottom, 20) }]}>
      {state.routes.map((route, i) => {
        const focused = state.index === i;
        const item = ITEMS[route.name];
        const onPress = () => {
          const e = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !e.defaultPrevented) {
            Haptics.selectionAsync().catch(() => {});
            navigateToTab(route.key);
          }
        };
        return <TabItem key={route.key} focused={focused} label={item.label} icon={item.icon} onPress={onPress} />;
      })}
    </View>
  );
}

const s = StyleSheet.create({
  // 피그마 Nav Bar: 위 모서리 16 · 위 선 1px. 탭은 화면 너비를 똑같이 나눠 넓은 화면에서도 고르게 퍼진다
  bar: {
    flexDirection: 'row', backgroundColor: colors.cream, paddingTop: 17, paddingHorizontal: 12.5, // 위 선 1px 포함 18
    borderTopWidth: 1, borderTopColor: BAR_LINE, borderTopLeftRadius: 16, borderTopRightRadius: 16,
  },
  item: { flex: 1, alignItems: 'center', gap: 4 },
  label: { fontSize: 12, fontWeight: '600' },
});
