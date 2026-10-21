import React, { useRef, useState } from 'react';
import { Animated, GestureResponderEvent, StyleSheet, Text, View } from 'react-native';
import PrimaryButton from './PrimaryButton';
import { colors } from '../theme/colors';
import { radius } from '../theme/typography';
import { haptic } from '../utils/haptic';
import { motion, useReducedMotion } from '../utils/motion';

const CLOSED = 54;
const OPEN = 380;

/**
 * 두루마리 펼치기 — 아래 막대를 끌어내리면 종이가 위에서부터 드러난다.
 * 60% 넘게 끌면 끝까지 저절로 펴지고 onDone, 덜 끌면 다시 말린다. 버튼으로도 펼 수 있다.
 */
export default function ScrollUnroll({ children, onDone }: { children: React.ReactNode; onDone(): void }) {
  const reduced = useReducedMotion();
  const [h] = useState(() => new Animated.Value(CLOSED));
  const base = useRef(CLOSED);
  const [done, setDone] = useState(false);
  const steps = useRef(0);

  const finish = () => {
    if (done) return;
    setDone(true);
    haptic.done();
    Animated.timing(h, { toValue: OPEN, duration: reduced ? 0 : 420, easing: motion.easeOut, useNativeDriver: false }).start(() => setTimeout(onDone, reduced ? 0 : 900));
  };

  const startY = useRef(0);
  const at = (e: GestureResponderEvent) => Math.min(OPEN, Math.max(CLOSED, base.current + e.nativeEvent.pageY - startY.current));
  const drag = {
    onStartShouldSetResponder: () => true,
    onMoveShouldSetResponder: () => true,
    onResponderTerminationRequest: () => false,
    onResponderGrant: (e: GestureResponderEvent) => { startY.current = e.nativeEvent.pageY; h.stopAnimation(v => { base.current = v; }); },
    onResponderMove: (e: GestureResponderEvent) => {
      const v = at(e);
      h.setValue(v);
      const n = Math.floor(((v - CLOSED) / (OPEN - CLOSED)) * 6);
      if (n > steps.current) haptic.tick();
      steps.current = n;
    },
    onResponderRelease: (e: GestureResponderEvent) => {
      if ((at(e) - CLOSED) / (OPEN - CLOSED) > 0.6) finish();
      else Animated.spring(h, { toValue: CLOSED, speed: 14, bounciness: 6, useNativeDriver: false }).start();
    },
  };

  return (
    <View style={s.root}>
      <View style={s.rod} />
      <Animated.View style={[s.paper, { height: h }]}>
        <View style={s.inner}>{children}</View>
      </Animated.View>
      <View style={s.rodWrap} {...(done ? {} : drag)} accessible accessibilityRole="adjustable" accessibilityLabel="두루마리 펼치기" accessibilityActions={[{ name: 'activate' }]} onAccessibilityAction={finish}>
        <View style={s.rod} />
        {done ? null : <Text style={s.hint}>막대를 아래로 끌어 펼쳐 보세요 ↓</Text>}
      </View>
      {done ? null : <PrimaryButton variant="text" small label="한 번에 펼치기" onPress={finish} style={{ alignSelf: 'center', marginTop: 4 }} />}
    </View>
  );
}

const s = StyleSheet.create({
  root: { userSelect: 'none' }, // 웹에서 끌 때 글자가 선택되지 않게
  rod: { height: 18, marginHorizontal: -6, borderRadius: 9, backgroundColor: '#8A5A2B', borderWidth: 2, borderColor: '#5E3A16' },
  paper: { overflow: 'hidden', marginHorizontal: 6, backgroundColor: colors.heroBg },
  inner: { height: OPEN, paddingHorizontal: 20, paddingTop: 22, alignItems: 'center' },
  rodWrap: { paddingBottom: 18, borderRadius: radius.lg },
  hint: { textAlign: 'center', fontSize: 13, fontWeight: '700', color: colors.inkMute, marginTop: 12 },
});
