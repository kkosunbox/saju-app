import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, usePathname, useSegments, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Icon, { IconName } from './Icon';
import { useKeyboardShown, useWebKeyboardInset } from './Screen';
import { colors, isDark } from '../theme/colors';
import { shadow } from '../theme/typography';

const INACTIVE = isDark ? '#6B707C' : '#B0B0B0';
const BAR_LINE = isDark ? colors.line : '#EDEDED';

const ITEMS = [
  { href: '/', label: '운알톡', icon: 'chat' },
  { href: '/talks', label: '대화 기록', icon: 'clock' },
  { href: '/content', label: '리포트', icon: 'sheet' },
  { href: '/my', label: '마이', icon: 'user' },
] as const satisfies readonly { href: Href; label: string; icon: IconName }[];

type ItemProps = { focused: boolean; label: string; onPress(): void };

function TabItem({ focused, label, icon, onPress }: ItemProps & { icon: IconName }) {
  const [scale] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (!focused) return;
    scale.setValue(0.85);
    const animation = Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 10 });
    animation.start();
    return () => {
      animation.stop();
      scale.setValue(1);
    };
  }, [focused, scale]);
  const on = focused ? colors.ink : INACTIVE;
  return (
    <Pressable onPress={onPress} style={s.item} accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={label}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Icon name={icon} size={24} color={on} strokeWidth={2} />
      </Animated.View>
      <Text style={[s.label, { color: on }]}>{label}</Text>
    </Pressable>
  );
}

export default function BottomNavigation() {
  const [section, screen] = useSegments();
  // 채팅 화면은 상단에 대화 메뉴를 쓴다. 별도의 뒤로 가기가 있는 상세 화면에는 탭 바를 두지 않는다.
  const isTab = section === '(tabs)';
  const isChat = section === 'today' || (section === 'consult' && screen === '[id]');
  return isTab || isChat ? <NavigationBar isTab={isTab} /> : null;
}

function NavigationBar({ isTab }: { isTab: boolean }) {
  const path = usePathname();
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboardShown();
  const webKeyboard = useWebKeyboardInset();
  if (keyboard || webKeyboard > 0) return null;

  return (
    <View style={[s.bar, shadow.float, { paddingBottom: Math.max(insets.bottom, 20) }]}>
      {ITEMS.map(({ href, label, icon }) => {
        const focused = path === href;
        const onPress = () => {
          if (focused) return;
          Haptics.selectionAsync().catch(() => {});
          if (isTab) router.navigate(href);
          else router.dismissTo(href);
        };
        return <TabItem key={href} focused={focused} label={label} icon={icon} onPress={onPress} />;
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
