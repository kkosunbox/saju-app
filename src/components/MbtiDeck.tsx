import React, { useMemo, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import PressableScale from './PressableScale';
import Mascot from './Mascot';
import PrimaryButton from './PrimaryButton';
import { MbtiMatch } from '../types/content';
import { colors } from '../theme/colors';
import { radius } from '../theme/typography';
import { haptic } from '../utils/haptic';
import { useReducedMotion } from '../utils/motion';

/** 16장은 늘 같은 자리 (MBTI 표 순서) — 어디를 눌러도 결과는 같고, 점수 순으로 뒤집힌다 */
const ORDER = ['ISTJ', 'ISFJ', 'INFJ', 'INTJ', 'ISTP', 'ISFP', 'INFP', 'INTP', 'ESTP', 'ESFP', 'ENFP', 'ENTP', 'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'];
const STEP = 110;

/**
 * 찰떡 MBTI 뽑기 — 엎어 둔 16장을 낮은 점수부터 차례로 뒤집고, 마지막에 1위가 튀어 오른다.
 * 실제 궁합 점수(all)를 그대로 보여주는 연출이라 '랜덤'처럼 속이지 않는다.
 */
export default function MbtiDeck({ all, top, onDone }: { all: MbtiMatch[]; top: string; onDone(): void }) {
  const reduced = useReducedMotion();
  const cards = useMemo(() => ORDER.map(t => all.find(m => m.type === t)).filter((m): m is MbtiMatch => !!m), [all]);
  const [flips] = useState(() => cards.map(() => new Animated.Value(0))); // 0 뒷면 · 1 앞면
  const [face, setFace] = useState<boolean[]>(() => cards.map(() => false));
  const [lift] = useState(() => new Animated.Value(0));
  const [started, setStarted] = useState(false);

  const start = () => {
    if (started) return;
    setStarted(true);
    if (reduced) { onDone(); return; }
    // 낮은 점수 → 높은 점수, 1위는 마지막
    const seq = cards.map((m, i) => ({ i, m })).sort((a, b) => a.m.score - b.m.score);
    seq.forEach(({ i }, n) => {
      const last = n === seq.length - 1;
      const wait = n * STEP + (last ? 380 : 0);
      Animated.sequence([
        Animated.delay(wait),
        Animated.timing(flips[i], { toValue: 0.5, duration: 110, useNativeDriver: true }),
      ]).start(() => {
        setFace(f => f.map((v, k) => (k === i ? true : v)));
        if (last) haptic.pop(); else haptic.tap();
        Animated.timing(flips[i], { toValue: 1, duration: 130, useNativeDriver: true }).start(() => {
          if (!last) return;
          Animated.spring(lift, { toValue: 1, speed: 10, bounciness: 14, useNativeDriver: true }).start();
          setTimeout(onDone, 1100);
        });
      });
    });
  };

  return (
    <View>
      <View style={s.grid}>
        {cards.map((m, i) => {
          const isTop = m.type === top;
          const scaleX = flips[i].interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0, 1] });
          const scale = isTop ? lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] }) : 1;
          const open = face[i];
          return (
            <Animated.View key={m.type} style={[s.slot, { zIndex: isTop ? 2 : 1, transform: [{ scale }, { scaleX }] }]}>
              <PressableScale onPress={start} disabled={started} scaleTo={0.92} style={[s.card, open ? (isTop ? s.faceTop : s.face) : s.back]} accessibilityLabel={open ? `${m.type} ${m.score}점` : '엎어 둔 카드'}>
                {open ? (
                  <>
                    <Text style={[s.type, isTop && { color: colors.white }]}>{m.type}</Text>
                    <Text style={[s.score, isTop && { color: '#DFEEA5' }]}>{m.score}</Text>
                  </>
                ) : (
                  <Mascot size={26} style={{ opacity: 0.9 }} />
                )}
              </PressableScale>
            </Animated.View>
          );
        })}
      </View>
      {started ? null : <PrimaryButton label="카드 뒤집기" onPress={start} style={{ marginTop: 20 }} />}
    </View>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  slot: { width: '23%', aspectRatio: 0.74 },
  card: { flex: 1, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', gap: 2 },
  back: { backgroundColor: colors.heroBg, borderWidth: 2, borderColor: colors.accent + '66' },
  face: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  faceTop: { backgroundColor: colors.heroBg, borderWidth: 2, borderColor: '#DFEEA5' },
  type: { fontSize: 15, fontWeight: '700', color: colors.ink, letterSpacing: -0.5 },
  score: { fontSize: 13, fontWeight: '600', color: colors.inkMute, fontVariant: ['tabular-nums'] },
});
