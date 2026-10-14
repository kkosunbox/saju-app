import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Icon, { IconName } from './Icon';
import { colors } from '../theme/colors';
import { radius, shadow } from '../theme/typography';

type BottomTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

/** 키는 src/app/(tabs) 의 라우트 이름 */
const ITEMS: Record<string, { label: string; icon: IconName }> = {
  index: { label: '홈', icon: 'home' },
  fortune: { label: '운세', icon: 'sheet' },
  content: { label: '콘텐츠', icon: 'grid' },
  compatibility: { label: '궁합', icon: 'heart' },
  my: { label: '마이', icon: 'user' },
};

function TabItem({ focused, label, icon, onPress }: { focused: boolean; label: string; icon: IconName; onPress(): void }) {
  const v = useRef(new Animated.Value(focused ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(v, { toValue: focused ? 1 : 0, useNativeDriver: true, speed: 18, bounciness: 8 }).start();
  }, [focused]);
  const pillScale = v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
  return (
    <Pressable onPress={onPress} style={s.item} accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={label}>
      <View style={s.iconBox}>
        <Animated.View style={[s.pill, { opacity: v, transform: [{ scaleX: pillScale }] }]} />
        <View>
          <Icon name={icon} size={22} color={focused ? colors.purple : colors.inkMute} filled={focused} strokeWidth={focused ? 2 : 1.7} />
        </View>
      </View>
      <Text style={[s.label, focused && { color: colors.purple, fontWeight: '700' }]}>{label}</Text>
    </Pressable>
  );
}

export default function BottomNavigation({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.bar, shadow.float, { paddingBottom: Math.max(insets.bottom, 10) }]}>
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
              const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !e.defaultPrevented) {
                Haptics.selectionAsync().catch(() => {});
                navigation.navigate(route.name as never);
              }
            }}
          />
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: colors.card, paddingTop: 8, borderTopLeftRadius: 22, borderTopRightRadius: 22 },
  item: { flex: 1, alignItems: 'center', gap: 3 },
  iconBox: { width: 56, height: 30, alignItems: 'center', justifyContent: 'center' },
  pill: { position: 'absolute', width: 56, height: 30, borderRadius: radius.sm, backgroundColor: colors.lavenderSoft },
  label: { fontSize: 11, color: colors.inkMute, fontWeight: '500' },
});
