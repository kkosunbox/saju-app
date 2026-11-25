import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';
import PrimaryButton from './PrimaryButton';
import StarAvatar from './StarAvatar';
import { radius, sansW } from '../theme/typography';
import { haptic } from '../utils/haptic';
import { useReducedMotion } from '../utils/motion';
import type { StarScore } from '../types/content';

/** 돌림판 (피그마 연예인 궁합): 카드 327×449 · 바퀴 지름 235 · 바늘 28×32 · 가운데 단추 54 */
const CARD_H = 449;
const WHEEL = 235;
const R = WHEEL / 2;
/** 바퀴 그림 안쪽(테두리 안) 반지름 — 뽑힌 칸을 물들일 때 */
const INNER_R = R * 0.9;
const WHEEL_TOP = 147.5;
const PIN_TOP = 133;
const HUB = 54;
const AVATAR = 52;
const SLOT = 76;
const TURNS = 6;
const SPIN_MS = 4200;

type Phase = 'idle' | 'show' | 'spin' | 'done';
/** 세 명을 한 명씩 올리는 간격 · 다 올리고 돌리기 전 쉼 */
const SHOW_FIRST = 300;
const SHOW_GAP = 650;
const SHOW_REST = 450;
const point = (deg: number, r: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: R + r * Math.sin(a), y: R - r * Math.cos(a) };
};
/** 가운데에서 deg 방향(위 = 0, 시계 방향)을 중심으로 하는 칸 */
const wedgePath = (deg: number, step: number, r: number) => {
  const a = point(deg - step / 2, r);
  const b = point(deg + step / 2, r);
  return `M ${R} ${R} L ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${r} ${r} 0 0 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)} Z`;
};

/**
 * 연예인 궁합 — 오늘의 궁합 돌림판.
 * 빈 돌림판에서 '돌림판 돌리기'를 누르면 오늘 나와 가장 잘 맞는 세 명이 실루엣으로 한 칸씩 올라오고, 돌림판이 돈다.
 * 칸 경계를 지날 때마다 '똑', 점점 느려지다 위쪽 바늘 아래에 오늘의 천생연분이 멈춘다. 멈추면 가운데 점수가 차오르고 onDone.
 * 결과(그날의 연예인)는 서버가 정해 둔 것이라 돌림판은 그 칸에 멈추도록 돈다. 누르면 건너뛴다.
 */
export default function StarRoulette({ pick, finalists, onDone }: { pick: StarScore; finalists: StarScore[]; onDone(): void }) {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<Phase>('idle');
  const [score, setScore] = useState(0);
  /** 올라온 칸 수 (0~3) */
  const [shown, setShown] = useState(0);
  const [rot] = useState(() => new Animated.Value(0));
  const [glow] = useState(() => new Animated.Value(0));
  const finished = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (ms: number, run: () => void) => { timers.current.push(setTimeout(run, ms)); };

  // 세 칸: 뽑힐 연예인이 늘 같은 칸에 있지 않게 (같은 결과면 같은 배치)
  const slots = useMemo(() => {
    const list = finalists.some(f => f.id === pick.id) ? finalists.slice(0, 3) : [...finalists.slice(0, 2), pick];
    const shift = pick.id % list.length;
    return [...list.slice(shift), ...list.slice(0, shift)];
  }, [finalists, pick]);
  const chosen = Math.max(0, slots.findIndex(x => x.id === pick.id));
  const step = 360 / slots.length;

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    timers.current.forEach(clearTimeout);
    onDone();
  };

  const land = () => {
    setPhase('done');
    haptic.pop();
    Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0.35, duration: 420, useNativeDriver: true }),
    ]), { iterations: 3 }).start();
    const start = Date.now();
    const count = () => {
      const t = Math.min(1, (Date.now() - start) / 800);
      setScore(Math.round(pick.score * (1 - Math.pow(1 - t, 3))));
      if (t < 1) later(30, count);
      else haptic.done();
    };
    count();
    later(2400, finish);
  };

  const spin = () => {
    setPhase('spin');
    // 바늘(위) 아래에 운명의 칸 가운데가 오도록 — 칸 안에서 살짝 비껴 서게 해 매번 똑같아 보이지 않게
    const nudge = ((pick.id * 37) % 61) - 30;
    const total = TURNS * 360 + ((360 - chosen * step) % 360) + nudge;
    Animated.timing(rot, { toValue: total, duration: SPIN_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    // 칸 경계(바늘 기준 step/2 + k·step)를 지나는 순간마다 '똑' — 같은 감속 곡선을 거꾸로 풀어 시각을 구한다
    for (let a = step / 2; a < total; a += step) {
      const t = 1 - Math.cbrt(1 - a / total);
      later(t * SPIN_MS, haptic.tick);
    }
    // 프레임이 멈춰도(화면이 잠깐 가려짐) 시간이 되면 결과로 넘어간다
    later(SPIN_MS + 80, land);
  };

  // 세 명을 한 명씩 올리고 나서 돌린다
  const start = () => {
    if (phase !== 'idle') return;
    if (reduced) { finish(); return; }
    setPhase('show');
    slots.forEach((_, i) => later(SHOW_FIRST + i * SHOW_GAP, () => { setShown(i + 1); haptic.tap(); }));
    later(SHOW_FIRST + slots.length * SHOW_GAP + SHOW_REST, spin);
  };

  const done = phase === 'done';
  const running = phase === 'show' || phase === 'spin';
  const rotate = rot.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] });
  return (
    <View>
      <View style={s.card}>
        <Image source={require('../../assets/figma/content/star/roulette-bg.webp')} style={StyleSheet.absoluteFill} contentFit="cover" accessible={false} />
        <Text style={s.title}>오늘의 천생연분 연예인은?</Text>
        <Text style={s.sub}>나와 궁합이 잘 맞는 {slots.length}명의 연예인 중에서{'\n'}오늘의 특별한 인연을 만나보세요.</Text>
        <Pressable onPress={phase === 'idle' ? start : finish} accessibilityRole="button" accessibilityLabel={phase === 'idle' ? '돌림판 돌리기' : '연출 건너뛰고 결과 보기'} style={s.wheelBox}>
          <View style={s.wheelShadow} />
          <Animated.View style={{ width: WHEEL, height: WHEEL, transform: [{ rotate }] }}>
            <Image source={require('../../assets/figma/content/star/wheel.webp')} style={StyleSheet.absoluteFill} contentFit="contain" accessible={false} />
            {done && slots.length > 1 ? (
              <Svg width={WHEEL} height={WHEEL} style={StyleSheet.absoluteFill} pointerEvents="none">
                <Path d={wedgePath(chosen * step, step, INNER_R)} fill="rgba(255,105,170,0.16)" />
              </Svg>
            ) : null}
            {slots.map((star, i) => {
              if (!done && i >= shown) return null;
              const p = point(i * step, R * 0.56);
              return (
                <View key={star.id} pointerEvents="none" style={[s.slot, { left: p.x - SLOT / 2, top: p.y - SLOT / 2, transform: [{ rotate: `${i * step}deg` }] }]}>
                  <Slot star={star} pop={!done} />
                </View>
              );
            })}
          </Animated.View>
          {/* 가운데 단추: 결과가 나오면 하트가 오늘의 점수로 바뀐다 */}
          <Animated.View pointerEvents="none" style={[s.hub, done && { transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }] }]}>
            <Image source={require('../../assets/figma/content/star/hub.webp')} style={StyleSheet.absoluteFill} contentFit="contain" accessible={false} />
            {done ? <View style={s.hubFace}><Text style={s.hubScore}>{score}</Text></View> : null}
          </Animated.View>
        </Pressable>
        <Image source={require('../../assets/figma/content/star/pin.webp')} style={s.pin} contentFit="contain" accessible={false} />
        {running ? <Text style={s.skip}>눌러서 건너뛰기</Text> : null}
      </View>
      {phase === 'idle' ? <PrimaryButton size="medium" label="돌림판 돌리기" onPress={start} style={{ marginTop: 24 }} /> : <View style={{ height: 72 }} />}
    </View>
  );
}

/** 돌림판 한 칸의 연예인 — 올라올 때 통 튀어 오르며 실루엣과 이름이 드러난다 */
function Slot({ star, pop: animate }: { star: StarScore; pop: boolean }) {
  const [pop] = useState(() => new Animated.Value(animate ? 0 : 1));
  useEffect(() => {
    if (!animate) return;
    Animated.spring(pop, { toValue: 1, speed: 16, bounciness: 6, overshootClamping: true, useNativeDriver: true }).start();
  }, [animate, pop]);
  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
  return (
    <Animated.View style={[s.center, { opacity: pop, transform: [{ scale }] }]}>
      <StarAvatar name={star.name} gender={star.gender} size={AVATAR} style={s.slotAvatar} />
      <Text style={s.slotName} numberOfLines={1}>{star.name}</Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  card: { height: CARD_H, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#F6E6F6' },
  title: { ...sansW('800'), position: 'absolute', left: 32, top: 32, fontSize: 20, lineHeight: 24, letterSpacing: -0.8, color: '#000000' },
  sub: { ...sansW('500'), position: 'absolute', left: 32, top: 68, fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: '#666666' },
  wheelBox: { position: 'absolute', top: WHEEL_TOP, alignSelf: 'center', width: WHEEL, height: WHEEL },
  wheelShadow: { position: 'absolute', left: (WHEEL - 228) / 2, top: (WHEEL - 228) / 2, width: 228, height: 228, borderRadius: 114, backgroundColor: '#FFFFFF', boxShadow: '0px 4px 8px 8px rgba(90,31,148,0.12)' },
  pin: { position: 'absolute', top: PIN_TOP, alignSelf: 'center', width: 28, height: 32 },
  center: { width: '100%', alignItems: 'center' },
  slot: { position: 'absolute', width: SLOT, height: SLOT, alignItems: 'center', justifyContent: 'center' },
  slotAvatar: { borderWidth: 2, borderColor: '#FFFFFF' },
  slotName: { ...sansW('700'), fontSize: 12, lineHeight: 16, letterSpacing: -0.5, color: '#2A2135', marginTop: 3, maxWidth: '100%' },
  hub: { position: 'absolute', left: (WHEEL - HUB) / 2, top: (WHEEL - HUB) / 2, width: HUB, height: HUB, alignItems: 'center', justifyContent: 'center' },
  hubFace: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1D1F2B', alignItems: 'center', justifyContent: 'center' },
  hubScore: { ...sansW('800'), fontSize: 19, lineHeight: 22, color: '#FFFFFF', letterSpacing: -0.8, fontVariant: ['tabular-nums'] },
  skip: { ...sansW('500'), position: 'absolute', bottom: 14, alignSelf: 'center', fontSize: 11, lineHeight: 14, color: '#8A7A92' },
});
