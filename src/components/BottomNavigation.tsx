import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Icon, { IconName } from './Icon';
import { colors, isDark } from '../theme/colors';
import { shadow } from '../theme/typography';
import { motion, useReducedMotion, useScreenLive } from '../utils/motion';

const INACTIVE = isDark ? '#6B707C' : '#B0B0B0';
const BAR_LINE = isDark ? colors.line : '#EDEDED';
const MASCOT = require('../../assets/images/mascot.png');
const ORB_BG = require('../../assets/images/talk-orb-bg.webp');
const ORB = 56;
/** 운알톡 동그라미 테두리 — 피그마 138° 하늘색 그라데이션 1.5px */
const ORB_RING = ['#1BADFE', '#C4E3F3', '#3BB9FE'] as const;
const ORB_RING_W = 1.5;

type BottomTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

/** 키는 src/app/(tabs) 의 라우트 이름. 운알톡은 가운데에서 운알이 버튼으로 그린다 */
const ITEMS: Record<string, { label: string; icon?: IconName }> = {
  index: { label: '홈', icon: 'home' },
  content: { label: '콘텐츠', icon: 'grid' },
  consult: { label: '운알톡' },
  compatibility: { label: '궁합', icon: 'chatHeart' },
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

/**
 * 가운데 운알톡 버튼 — 바 위로 솟은 동그라미 안에서 운알이가 둥실 떠 있다가 가끔 고개를 갸웃한다.
 * 고르면 한 번 폴짝 뛰고, 누르는 동안 말랑하게 눌린다. 다른 화면이 덮였거나 동작 줄이기면 가만히 있는다
 */
function ChatItem({ focused, label, onPress }: ItemProps) {
  const reduced = useReducedMotion();
  const live = useScreenLive();
  const [float] = useState(() => new Animated.Value(0));
  const [tilt] = useState(() => new Animated.Value(0));
  const [hop] = useState(() => new Animated.Value(0));
  const [press] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (reduced || !live) { float.setValue(0); tilt.setValue(0); return; }
    const bob = Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: -2.5, duration: 1500, easing: motion.easeInOut, useNativeDriver: true }),
      Animated.timing(float, { toValue: 0, duration: 1500, easing: motion.easeInOut, useNativeDriver: true }),
    ]));
    const wiggle = Animated.loop(Animated.sequence([
      Animated.delay(3600),
      Animated.timing(tilt, { toValue: -1, duration: 140, easing: motion.easeOut, useNativeDriver: true }),
      Animated.timing(tilt, { toValue: 1, duration: 200, easing: motion.easeInOut, useNativeDriver: true }),
      Animated.timing(tilt, { toValue: 0, duration: 160, easing: motion.easeOut, useNativeDriver: true }),
    ]));
    bob.start();
    wiggle.start();
    return () => { bob.stop(); wiggle.stop(); };
  }, [reduced, live, float, tilt]);

  useEffect(() => {
    if (!focused || reduced) return;
    hop.setValue(0);
    Animated.sequence([
      Animated.timing(hop, { toValue: -7, duration: 150, easing: motion.easeOut, useNativeDriver: true }),
      Animated.spring(hop, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 12 }),
    ]).start();
  }, [focused, reduced, hop]);

  const squish = (to: number) => Animated.spring(press, { toValue: to, useNativeDriver: true, speed: 30, bounciness: to === 1 ? 10 : 0 }).start();
  const rotate = tilt.interpolate({ inputRange: [-1, 1], outputRange: ['-9deg', '9deg'] });

  return (
    <Pressable onPress={onPress} onPressIn={() => squish(0.9)} onPressOut={() => squish(1)} style={s.item} accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel="운알톡">
      <View style={s.orbSlot}>
        <Animated.View style={[s.orb, { transform: [{ scale: press }] }]}>
          <LinearGradient colors={ORB_RING} locations={[0, 0.47, 1]} start={{ x: 0.17, y: 0.13 }} end={{ x: 0.83, y: 0.87 }} style={s.ring}>
            <View style={s.orbInner}>
              <Image source={ORB_BG} style={StyleSheet.absoluteFill} contentFit="cover" accessible={false} />
              <Animated.View style={{ transform: [{ translateY: Animated.add(float, hop) }, { rotate }] }}>
                <Image source={MASCOT} style={s.mascot} contentFit="contain" accessible={false} />
              </Animated.View>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
      <Text style={[s.label, { color: focused ? colors.ink : INACTIVE }]}>{label}</Text>
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
        return item.icon
          ? <TabItem key={route.key} focused={focused} label={item.label} icon={item.icon} onPress={onPress} />
          : <ChatItem key={route.key} focused={focused} label={item.label} onPress={onPress} />;
      })}
    </View>
  );
}

const s = StyleSheet.create({
  // 피그마 Nav Bar: 위 모서리 16 · 위 선 1px. 탭은 화면 너비를 5등분해 넓은 화면에서도 고르게 퍼진다
  // (좌우 12.5면 375 폭에서 피그마의 칸 50 · 사이 20 배치와 탭 중심이 같다)
  bar: {
    flexDirection: 'row', backgroundColor: colors.cream, paddingTop: 17, paddingHorizontal: 12.5, // 위 선 1px 포함 18
    borderTopWidth: 1, borderTopColor: BAR_LINE, borderTopLeftRadius: 16, borderTopRightRadius: 16,
  },
  item: { flex: 1, alignItems: 'center', gap: 4 },
  label: { fontSize: 12, fontWeight: '600' },
  // 다른 탭의 아이콘 칸(24)과 높이를 맞춰 글자 줄이 나란히 서고, 동그라미만 위로 솟는다(아랫변이 아이콘 칸 아래에 맞음)
  orbSlot: { width: ORB, height: 24, alignItems: 'center' },
  orb: {
    position: 'absolute', top: 24 - ORB, width: ORB, height: ORB, borderRadius: ORB / 2, backgroundColor: colors.cream,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: -1, height: -3 }, elevation: 4,
  },
  ring: { flex: 1, borderRadius: ORB / 2, padding: ORB_RING_W },
  orbInner: { flex: 1, borderRadius: ORB / 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  mascot: { width: 40, height: 37 },
});
