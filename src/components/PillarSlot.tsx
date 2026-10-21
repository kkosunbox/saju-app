import React, { useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import PrimaryButton from './PrimaryButton';
import Mascot from './Mascot';
import { STEMS, BRANCHES } from '../data/sajuData';
import { colors } from '../theme/colors';
import { fonts, radius } from '../theme/typography';
import { haptic } from '../utils/haptic';
import { useReducedMotion } from '../utils/motion';

const ITEM = 88;
const LOOPS = 2;
/** 60갑자 — 갑자 · 을축 · … · 계해 */
const PILLARS = Array.from({ length: 60 }, (_, i) => ({ h: STEMS[i % 10].hanja + BRANCHES[i % 12].hanja, ko: STEMS[i % 10].ko + BRANCHES[i % 12].ko }));

/**
 * 사주 캐릭터 찾기 — 60갑자가 돌다가 내 일주에서 멈춘다 (랜덤이 아니라 '60개 중 내 것 찾기').
 * 멈추면 마스코트가 튀어 오르고 onDone.
 */
export default function PillarSlot({ target, onDone }: { target: string; onDone(): void }) {
  const reduced = useReducedMotion();
  const idx = Math.max(0, PILLARS.findIndex(p => p.h === target));
  const reel = useMemo(() => [...Array.from({ length: LOOPS }, () => PILLARS).flat(), ...PILLARS.slice(0, idx + 2)], [idx]);
  const stop = LOOPS * 60 + idx;
  const [y] = useState(() => new Animated.Value(0));
  const [pop] = useState(() => new Animated.Value(0));
  const [state, setState] = useState<'idle' | 'spin' | 'stop'>('idle');
  const last = useRef(0);

  const spin = () => {
    if (state !== 'idle') return;
    if (reduced) { onDone(); return; }
    setState('spin');
    const id = y.addListener(({ value }) => {
      const n = Math.round(value / ITEM);
      if (n !== last.current) { last.current = n; if (n > stop - 14) haptic.tick(); }
    });
    Animated.timing(y, { toValue: stop * ITEM, duration: 3000, easing: Easing.bezier(0.15, 0.6, 0.15, 1), useNativeDriver: true }).start(() => {
      y.removeListener(id);
      setState('stop');
      haptic.pop();
      Animated.spring(pop, { toValue: 1, speed: 10, bounciness: 14, useNativeDriver: true }).start();
      setTimeout(onDone, 1200);
    });
  };

  const ko = PILLARS[idx].ko;
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={s.machine}>
        <Animated.View style={[s.mascot, { transform: [{ translateY: pop.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) }, { scale: pop.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }] }]}>
          <Mascot size={58} />
        </Animated.View>
        <View style={s.window}>
          <Animated.View style={{ transform: [{ translateY: Animated.multiply(y, -1) }] }}>
            {reel.map((p, i) => (
              <View key={i} style={s.item}>
                <Text style={[s.hanja, state === 'stop' && i === stop && { color: colors.moon }]}>{p.h}</Text>
              </View>
            ))}
          </Animated.View>
          <View pointerEvents="none" style={[s.fade, { top: 0 }]} />
          <View pointerEvents="none" style={[s.fade, { bottom: 0 }]} />
        </View>
        <Text style={s.caption}>{state === 'stop' ? `${ko}일주를 찾았어요!` : state === 'spin' ? '60갑자에서 찾는 중…' : '태어난 날의 기둥, 일주는?'}</Text>
      </View>
      {state === 'idle' ? <PrimaryButton label="내 일주 찾기" onPress={spin} style={{ marginTop: 20, alignSelf: 'stretch' }} /> : null}
    </View>
  );
}

const s = StyleSheet.create({
  machine: { alignSelf: 'stretch', alignItems: 'center', paddingTop: 44, paddingBottom: 22, borderRadius: radius.lg, backgroundColor: colors.heroBg, marginTop: 44 },
  mascot: { position: 'absolute', top: -34 },
  window: { width: 180, height: ITEM, overflow: 'hidden', borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 2, borderColor: colors.moon + '88' },
  item: { height: ITEM, alignItems: 'center', justifyContent: 'center' },
  hanja: { fontFamily: fonts.serif, fontSize: 52, lineHeight: 64, fontWeight: '700', color: colors.white, letterSpacing: 6 },
  fade: { position: 'absolute', left: 0, right: 0, height: 14, backgroundColor: colors.heroBg, opacity: 0.55 },
  caption: { color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: '600', marginTop: 14, letterSpacing: -0.4 },
});
