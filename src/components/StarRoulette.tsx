import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Circle, Path } from 'react-native-svg';
import CharacterArt from './CharacterArt';
import PrimaryButton from './PrimaryButton';
import { colors } from '../theme/colors';
import { radius, sansW, SCREEN_PX } from '../theme/typography';
import { haptic } from '../utils/haptic';
import { useReducedMotion } from '../utils/motion';
import type { StarScore } from '../types/content';

/** 돌림판 지름 · 바퀴 수 · 도는 시간 */
const SIZE = 284;
const R = SIZE / 2;
const TURNS = 6;
const SPIN_MS = 4200;
const WEDGES = ['#F2E5EC', '#F5EDF0', '#E8E1EB'];
const WEDGE_HOT = '#EAC3D7';
const RIM = '#D8C6D2';
const HUB_SIZE = 60;
const POINTER = '#9F5375';
const WHEEL_TOP = 12;

type Phase = 'idle' | 'show' | 'spin' | 'done';
/** 세 명을 한 명씩 공개하는 간격 · 다 공개하고 돌리기 전 쉼 */
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
 * 오늘 나와 궁합이 가장 잘 맞는 세 명이 실루엣으로 한 칸씩 자리해 있다. '돌림판 돌리기'를 누르면 세 명을
 * 한 명씩 공개한 뒤 돌림판이 돌고, 칸 경계를 지날 때마다 '똑',
 * 점점 느려지다 위쪽 바늘 아래에 오늘의 천생연분이 멈춘다. 멈추면 가운데 점수가 차오르고 onDone.
 * 결과(그날의 연예인)는 서버가 정해 둔 것이라 돌림판은 그 칸에 멈추도록 돈다. 누르면 건너뛴다.
 */
export default function StarRoulette({ pick, finalists, onDone }: { pick: StarScore; finalists: StarScore[]; onDone(): void }) {
  const reduced = useReducedMotion();
  const { width } = useWindowDimensions();
  const wheelSize = Math.min(SIZE, width - 2 * (SCREEN_PX + 12));
  const wheelScale = wheelSize / SIZE;
  const slotSize = 88 * wheelScale;
  const [phase, setPhase] = useState<Phase>('idle');
  const [score, setScore] = useState(0);
  /** 공개된 칸 수 (0~3) */
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

  // 세 명을 한 명씩 공개하고 나서 돌린다
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
      <View style={s.stage}>
        <Text style={s.title}>{done ? '오늘의 천생연분 연예인을 찾았어요' : `오늘 나와 궁합이 가장 잘 맞는 연예인 ${slots.length}명`}</Text>
        <Pressable onPress={phase === 'idle' ? start : finish} accessibilityRole="button" accessibilityLabel={phase === 'idle' ? '돌림판 돌리기' : '연출 건너뛰고 결과 보기'} style={[s.wheelBox, { width: wheelSize, height: wheelSize + WHEEL_TOP }]}>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Svg width={wheelSize} height={wheelSize} viewBox={`0 0 ${SIZE} ${SIZE}`}>
              <Circle cx={R} cy={R} r={R} fill="#F8F2F5" />
              {slots.length === 1 ? (
                <Circle cx={R} cy={R} r={R - 7} fill={done ? WEDGE_HOT : WEDGES[0]} />
              ) : slots.map((_, i) => (
                <Path key={i} d={wedgePath(i * step, step, R - 7)} fill={done && i === chosen ? WEDGE_HOT : WEDGES[i % WEDGES.length]} stroke="#FFF9FC" strokeWidth={1.5} />
              ))}
              <Circle cx={R} cy={R} r={R - 1} fill="none" stroke={RIM} strokeWidth={2} />
            </Svg>
            {slots.map((star, i) => {
              const p = point(i * step, R * 0.55);
              return (
                <View key={star.id} pointerEvents="none" style={[s.slot, { width: slotSize, height: slotSize, left: p.x * wheelScale - slotSize / 2, top: p.y * wheelScale - slotSize / 2, transform: [{ rotate: `${i * step}deg` }] }]}>
                  <Slot star={star} open={done || i < shown} artSize={52 * wheelScale} />
                </View>
              );
            })}
          </Animated.View>
          {/* 가운데 단추: 결과가 나오면 하트가 오늘의 점수로 바뀐다 */}
          <Animated.View pointerEvents="none" style={[s.hub, { left: (wheelSize - HUB_SIZE) / 2, top: WHEEL_TOP + (wheelSize - HUB_SIZE) / 2 }, done && { transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }] }]}>
            {done ? <><Text style={s.hubScore}>{score}</Text><Text style={s.hubUnit}>점</Text></>
              : <Image source={require('../../assets/figma/saju/heart-red.svg')} style={s.hubHeart} tintColor="#F3C5DD" contentFit="contain" accessible={false} />}
          </Animated.View>
          <View pointerEvents="none" style={[s.pointer, { left: wheelSize / 2 - 10 }]}>
            <Svg width={20} height={22}><Path d="M10 20 L2 4 Q10 0 18 4 Z" fill={POINTER} stroke="#FFF9FC" strokeWidth={1.5} strokeLinejoin="round" /></Svg>
          </View>
        </Pressable>
        {running ? <Text style={s.skip}>눌러서 건너뛰기</Text> : null}
      </View>
      {phase === 'idle' ? <PrimaryButton label="돌림판 돌리기" onPress={start} style={{ marginTop: 16 }} /> : <View style={{ height: 68 }} />}
    </View>
  );
}

/** 돌림판 한 칸의 연예인 — 공개 전엔 실루엣과 '?', 공개되면 통 튀어 오르며 그림과 이름이 드러난다 */
function Slot({ star, open, artSize }: { star: StarScore; open: boolean; artSize: number }) {
  const [pop] = useState(() => new Animated.Value(open ? 1 : 0));
  useEffect(() => {
    if (!open) return;
    pop.setValue(0);
    Animated.spring(pop, { toValue: 1, speed: 16, bounciness: 6, overshootClamping: true, useNativeDriver: true }).start();
  }, [open, pop]);
  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });
  return (
    <Animated.View style={[s.center, open && { transform: [{ scale }] }]}>
      <CharacterArt hanja={star.hanja} size={artSize} style={open ? undefined : { tintColor: 'rgba(42,33,53,0.55)' }} />
      <Text style={[s.slotName, !open && s.slotHidden]} numberOfLines={1}>{open ? star.name : '?'}</Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  center: { width: '100%', alignItems: 'center' },
  stage: { borderRadius: radius.lg, backgroundColor: colors.card, paddingTop: 20, paddingBottom: 28, alignItems: 'center', overflow: 'hidden' },
  title: { ...sansW('600'), fontSize: 14, lineHeight: 20, letterSpacing: -0.4, color: colors.inkSub, marginHorizontal: 12, textAlign: 'center' },
  wheelBox: { marginTop: 14, paddingTop: WHEEL_TOP },
  slot: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  slotName: { ...sansW('700'), fontSize: 13, lineHeight: 17, letterSpacing: -0.4, color: '#2A2135', marginTop: 2, maxWidth: '100%' },
  slotHidden: { fontSize: 16, color: 'rgba(42,33,53,0.55)' },
  hub: { position: 'absolute', width: HUB_SIZE, height: HUB_SIZE, borderRadius: HUB_SIZE / 2, backgroundColor: colors.heroBg, borderWidth: 2, borderColor: '#FFF9FC', alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  hubHeart: { width: 32, height: 32 },
  hubScore: { ...sansW('800'), fontSize: 23, lineHeight: 28, color: '#FFFFFF', letterSpacing: -0.8, fontVariant: ['tabular-nums'] },
  hubUnit: { ...sansW('700'), fontSize: 12, lineHeight: 16, color: 'rgba(255,255,255,0.75)', marginTop: 6 },
  pointer: { position: 'absolute', top: 0 },
  skip: { ...sansW('500'), position: 'absolute', bottom: 8, fontSize: 11, lineHeight: 14, color: colors.inkMute },
});
