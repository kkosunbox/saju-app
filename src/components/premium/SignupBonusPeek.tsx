import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import PressableScale from '../PressableScale';
import { colors } from '../../theme/colors';
import { sansW } from '../../theme/typography';
import { motion, useReducedMotion } from '../../utils/motion';

const TIGHT = Platform.OS === 'android' ? { includeFontPadding: false } : {};
const TAIL = 10; // 꼬리 밑변 폭
const TAIL_H = 7;
const TOP = 12; // 위 내용과 말풍선 사이
const BELOW = 16; // 아래 버튼의 marginTop — 꼬리 끝이 버튼 위 4에 닿도록 이만큼 겹쳐 둔다

/**
 * 열람 버튼 바로 위로 비집고 나오는 '지금 가입하면 50알' 말풍선 (게스트만). 버튼 바로 앞에 둔다.
 * 틈이 0에서 벌어지며 버튼을 밀어 내고, 말풍선은 아래 꼬리(버튼을 가리킨다) 쪽에서 부풀고, 이어 글자가 올라온다.
 */
export function SignupBonusPeek({ onPress }: { onPress(): void }) {
  const reduced = useReducedMotion();
  const [h, setH] = useState(0);
  const grow = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  const pop = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  const say = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  const measured = h > 0;
  useEffect(() => {
    if (!measured) return;
    if (reduced) { grow.setValue(1); pop.setValue(1); say.setValue(1); return; }
    const anim = Animated.parallel([
      // 틈이 벌어지고
      Animated.timing(grow, { toValue: 1, duration: 260, delay: 150, easing: motion.easeOut, useNativeDriver: false }),
      // 그 틈으로 말풍선이 부풀어 나오고
      Animated.sequence([Animated.delay(230), Animated.spring(pop, { toValue: 1, friction: 7, tension: 170, useNativeDriver: true })]),
      // 말풍선이 거의 다 커졌을 때 글자가 따라 나온다
      Animated.sequence([Animated.delay(420), Animated.timing(say, { toValue: 1, duration: 220, easing: motion.easeOut, useNativeDriver: true })]),
    ]);
    anim.start();
    return () => anim.stop();
  }, [measured, reduced, grow, pop, say]);

  const full = TOP + h + TAIL_H + 4 - BELOW;

  return (
    <Animated.View style={[s.gap, { height: measured ? grow.interpolate({ inputRange: [0, 1], outputRange: [0, full] }) : 0 }]}>
      <View style={s.slot} pointerEvents="box-none">
        <Animated.View
          onLayout={e => setH(e.nativeEvent.layout.height)}
          style={{
            transformOrigin: '50% 100%',
            opacity: measured ? pop.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1], extrapolate: 'clamp' }) : 0,
            transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) }],
          }}
        >
          <PressableScale onPress={onPress} scaleTo={0.96} accessibilityRole="button" accessibilityLabel="지금 가입하면 50알을 드려요. 지금 보는 미래 배우자를 바로 열어 볼 수 있어요">
            <View style={s.bubble}>
              <Animated.Text
                numberOfLines={1}
                style={[s.text, { opacity: say, transform: [{ translateY: say.interpolate({ inputRange: [0, 1], outputRange: [5, 0] }) }] }]}
              >
                지금 가입하면 <Text style={s.bonus}>50알</Text> 드려요!
              </Animated.Text>
            </View>
            <View style={s.tail} />
          </PressableScale>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  // 높이가 0에서 벌어지는 틈. 말풍선은 틈 위에서 TOP만큼 내려와 가운데에 뜬다 (꼬리는 아래 버튼과 겹치는 여백에 걸친다)
  gap: { alignSelf: 'stretch' },
  slot: { position: 'absolute', top: TOP, left: -40, right: -40, alignItems: 'center' },
  bubble: { backgroundColor: colors.accent, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, overflow: 'hidden' },
  tail: { position: 'absolute', bottom: -TAIL_H, left: '50%', marginLeft: -TAIL / 2, width: 0, height: 0, borderLeftWidth: TAIL / 2, borderRightWidth: TAIL / 2, borderTopWidth: TAIL_H, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: colors.accent },
  text: { ...sansW('700'), fontSize: 13, lineHeight: 17, letterSpacing: -0.5, color: colors.white, ...TIGHT },
  bonus: { color: '#FFE54A' },
});
