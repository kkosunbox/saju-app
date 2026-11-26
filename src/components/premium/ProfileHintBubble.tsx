import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { profileType } from '../../theme/profileDesign';
import { useReducedMotion } from '../../utils/motion';

const TIGHT = Platform.OS === 'android' ? { includeFontPadding: false } : {};
/** 말풍선을 칩 왼쪽 끝에서 오른쪽으로 비켜 두는 거리 (꼬리가 칩 끝의 ⌄ 쪽을 가리킨다) */
const OFFSET_LEFT = 40;
const EASE = Easing.out(Easing.cubic);

/**
 * 프로필 칩 바로 아래에서 위(칩)를 가리키는 안내 말풍선. 자리를 차지하지 않고 아래 내용 위에 떠 있다.
 * 모양은 출석 보상 말풍선(HeaderPoints)과 맞춘다 — 남색 알약 + 옅은 테두리 + 그림자, 45° 돌린 네모 꼬리.
 * delay 뒤 말풍선이 살짝 내려앉듯 부드럽게 나타나고, 이어 글자가 천천히 떠오른다. 동작 줄이기면 바로 다 보여 준다.
 */
export default function ProfileHintBubble({ text, delay = 2000, style }: { text: string; delay?: number; style?: StyleProp<ViewStyle> }) {
  const reduced = useReducedMotion();
  const pop = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  const say = useRef(new Animated.Value(reduced ? 1 : 0)).current;

  useEffect(() => {
    if (reduced) { pop.setValue(1); say.setValue(1); return; }
    const anim = Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(pop, { toValue: 1, duration: 520, easing: EASE, useNativeDriver: true }),
        // 말풍선이 반쯤 나왔을 때 글자가 따라 떠오른다
        Animated.sequence([Animated.delay(260), Animated.timing(say, { toValue: 1, duration: 560, easing: EASE, useNativeDriver: true })]),
      ]),
    ]);
    anim.start();
    return () => anim.stop();
  }, [reduced, delay, pop, say]);

  return (
    <Animated.View
      accessibilityRole="text"
      accessibilityLabel={text}
      pointerEvents="none"
      style={[s.wrap, style, {
        opacity: pop,
        transform: [
          { translateY: pop.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) },
          { scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
        ],
      }]}
    >
      <View style={s.bubble}>
        <View style={s.tail} />
        <Animated.Text numberOfLines={1} style={[s.text, { opacity: say, transform: [{ translateY: say.interpolate({ inputRange: [0, 1], outputRange: [4, 0] }) }] }]}>
          {text}
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  // 꼬리 끝을 기준으로 커진다
  wrap: { position: 'absolute', top: '100%', left: OFFSET_LEFT, zIndex: 10, elevation: 10, paddingTop: 6, transformOrigin: '8% 0%' },
  bubble: {
    flexDirection: 'row', alignItems: 'center', height: 28, paddingHorizontal: 12, borderRadius: 14,
    backgroundColor: colors.heroBg, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.14)',
    boxShadow: '0 4px 14px rgba(29,33,45,0.22)',
  },
  tail: { position: 'absolute', top: -3, left: 16, width: 7, height: 7, borderTopLeftRadius: 1.5, backgroundColor: colors.heroBg, transform: [{ rotate: '45deg' }] },
  text: { ...profileType(12, '600', 15, -0.3, colors.white), ...TIGHT },
});
