import React, { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import ResultMascot from '../ResultMascot';
import MascotShadow from '../MascotShadow';
import { type MascotScores } from '../../utils/resultMascot';
import { colors } from '../../theme/colors';
import { motion, useReducedMotion, useScreenLive } from '../../utils/motion';
import { haptic } from '../../utils/haptic';

const SIZE = 103;
const BOX = 136;

/**
 * 홈의 말풍선 아래 운알이. 둥실 떠 있다가 누르면 폴짝 뛰고 오늘의 운세 대화로 넘어간다 (꾹 눌러 뽑기 없음).
 * 아직 안 본 날(sealed)엔 기본 모습에 '눌러서 들어 보기' 안내, 본 뒤엔 오늘 점수에 맞는 포즈.
 */
export default function HomeMascot({ sealed, hint, scores, onPress }: { sealed: boolean; hint?: string; scores?: MascotScores; onPress(): void }) {
  const reduced = useReducedMotion();
  const live = useScreenLive();
  const [y] = useState(() => new Animated.Value(0));
  const [hop] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduced || !live) { y.setValue(0); return; }
    const a = Animated.loop(Animated.sequence([
      Animated.timing(y, { toValue: -6, duration: 1400, easing: motion.easeInOut, useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: 1400, easing: motion.easeInOut, useNativeDriver: true }),
    ]));
    a.start();
    return () => a.stop();
  }, [reduced, live, y]);

  const press = () => {
    haptic.tap();
    if (!reduced) {
      hop.setValue(1);
      Animated.spring(hop, { toValue: 0, speed: 16, bounciness: 9, useNativeDriver: true }).start();
    }
    onPress();
  };

  const bounce = {
    transform: [
      { translateY: hop.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, -9, 2] }) },
      { scaleX: hop.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 0.96, 1.05] }) },
      { scaleY: hop.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 1.05, 0.95] }) },
    ],
  };

  return (
    <View style={[s.wrap, { marginTop: sealed ? 32 : -4, marginBottom: sealed ? 16 : 4 }]}>
      <Pressable
        onPress={press}
        accessibilityRole="button"
        accessibilityLabel={sealed ? '운알이에게 오늘의 운세 듣기' : '운알이에게 오늘의 운세 다시 듣기'}
        accessibilityHint="누르면 운알이와의 오늘의 운세 대화로 넘어가요"
        style={s.hit}
      >
        <Animated.View style={[s.shadowBox, {
          opacity: y.interpolate({ inputRange: [-6, 0], outputRange: [0.7, 1] }),
          transform: [{ scaleX: y.interpolate({ inputRange: [-6, 0], outputRange: [0.86, 1] }) }],
        }]} pointerEvents="none">
          <MascotShadow size={SIZE} />
        </Animated.View>
        <Animated.View style={{ transform: [{ translateY: y }] }}>
          <Animated.View style={bounce}>
            <ResultMascot pose={sealed ? null : undefined} scores={sealed ? undefined : scores} size={SIZE} accessible={false} revealed={!sealed} />
          </Animated.View>
        </Animated.View>
      </Pressable>
      {hint ? (
        <View style={s.hint} pointerEvents="none">
          <Text style={s.hintText}>{hint}</Text>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignSelf: 'center', alignItems: 'center' },
  hit: { width: BOX, height: BOX, alignItems: 'center', justifyContent: 'center' },
  // ResultMascot과 같은 칸을 가운데에 둔다
  shadowBox: { position: 'absolute', left: (BOX - SIZE * 1.08) / 2, top: (BOX - SIZE) / 2, width: SIZE * 1.08, height: SIZE },
  hint: { marginTop: 8, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: colors.navy },
  hintText: { fontSize: 12, fontWeight: '700', color: colors.white, letterSpacing: -0.3 },
});
