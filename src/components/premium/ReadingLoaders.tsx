/**
 * 재화를 써서 연 콘텐츠의 AI 풀이를 기다리는 동안의 연출 — 두루마리에 글을 쓰는 마스코트로 (스프라이트 시트에서 만든 애니메이션 WebP, scripts/build-loading-mascot.py).
 *
 * - FullReadingLoader : 화면 전체를 로딩 화면으로 덮고, 다 쓰면 본문을 한 번에 보여 준다
 * - StepReadingLoader : 풀이 파트를 체크리스트로 보여 주며 하나씩 지워 나간다
 * - FloatingReadingPill + TypeReveal : 본문은 바로 보이고, 다 쓴 파트부터 글자가 써지듯 나타난다
 */
import { Image } from 'expo-image';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import PressableScale from '../PressableScale';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { colors, isDark } from '../../theme/colors';
import { sansW, shadow } from '../../theme/typography';
import { useReducedMotion } from '../../utils/motion';

export const SCROLL_MASCOT = require('../../../assets/images/loading-scroll.webp');

/** glow: 뒤에 숨 쉬듯 움직이는 은은한 후광을 깐다 (큰 로딩 화면용) */
export function ScrollMascot({ size = 160, style, glow }: { size?: number; style?: StyleProp<ViewStyle>; glow?: boolean }) {
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]} accessibilityLabel="두루마리에 풀이를 쓰는 중">
      {glow ? <MascotGlow size={size} /> : null}
      <Image source={SCROLL_MASCOT} style={{ width: size, height: size }} contentFit="contain" autoplay />
    </View>
  );
}

// 마스코트 몸의 하늘·크림·민트 색을 옅게
const GLOW = isDark ? ['#3A5C86', '#4A4630'] as const : ['#D6EBFC', '#FBF1CC'] as const;
function MascotGlow({ size }: { size: number }) {
  const reduced = useReducedMotion();
  const breath = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) return;
    const a = Animated.loop(Animated.sequence([
      Animated.timing(breath, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(breath, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    a.start();
    return () => a.stop();
  }, [reduced]);
  const halo = size * 1.6;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* 숨 쉬듯 커졌다 작아지는 후광 — 가장자리로 갈수록 투명해진다 */}
      <Animated.View style={{ position: 'absolute', width: halo, height: halo, left: (size - halo) / 2, top: (size - halo) / 2,
        opacity: breath.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] }), transform: [{ scale: breath.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.05] }) }] }}>
        <Svg width={halo} height={halo}>
          <Defs>
            <RadialGradient id="halo" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={GLOW[0]} stopOpacity={1} />
              <Stop offset="0.45" stopColor={GLOW[1]} stopOpacity={0.85} />
              <Stop offset="1" stopColor={GLOW[1]} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={halo / 2} cy={halo / 2} r={halo / 2} fill="url(#halo)" />
        </Svg>
      </Animated.View>
    </View>
  );
}

/** 실제 진행(done/total)보다 조금씩 앞서 차오르는 막대 값 — 파트 사이 긴 공백에도 멈춰 보이지 않게 */
function useCreepingProgress(done: number, total: number) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const now = done / Math.max(total, 1);
    if (done >= total) {
      Animated.timing(v, { toValue: 1, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
      return;
    }
    const next = (done + 0.85) / Math.max(total, 1);
    const a = Animated.sequence([
      Animated.timing(v, { toValue: now, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.timing(v, { toValue: next, duration: 9000, easing: Easing.out(Easing.quad), useNativeDriver: false }),
    ]);
    a.start();
    return () => a.stop();
  }, [done, total]);
  return v;
}

/** 일정 간격으로 바뀌는 안내 문구 (교차 페이드) */
function useRotatingMessage(messages: string[], every = 2400) {
  const [i, setI] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (messages.length < 2) return;
    const t = setInterval(() => {
      Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setI(n => (n + 1) % messages.length);
        Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      });
    }, every);
    return () => clearInterval(t);
  }, [messages.length, every]);
  return { text: messages[i] ?? '', fade };
}

/* ---------- A. 전체 로딩 화면 ---------- */

export function FullReadingLoader({ title, done, total, messages }: { title: string; done: number; total: number; messages: string[] }) {
  const p = useCreepingProgress(done, total);
  const { text, fade } = useRotatingMessage(messages);
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const id = p.addListener(({ value }) => setPct(Math.round(value * 100)));
    return () => p.removeListener(id);
  }, [p]);
  return (
    <View style={s.full} accessibilityLabel={`${title}. ${pct}%`}>
      <ScrollMascot size={90} glow style={{ marginBottom: 16 }} />
      <Text style={s.fullTitle}>{title}</Text>
      <Animated.Text style={[s.fullMsg, { opacity: fade }]}>{text}</Animated.Text>
      <View style={s.fullBarWrap}>
        <View style={s.track}>
          <Animated.View style={[s.fill, { width: p.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
        </View>
        <Text style={s.pct}>{pct}%</Text>
      </View>
      <Text style={s.note}>화면을 나가도 계속 써요. 다 쓰면 알려 드릴게요.</Text>
    </View>
  );
}

/* ---------- B. 단계 체크리스트 ---------- */

export interface LoaderStep { key: string; label: string; sub: string; done: boolean }

export function StepReadingLoader({ title, steps }: { title: string; steps: LoaderStep[] }) {
  const all = steps.every(x => x.done);
  const count = steps.filter(x => x.done).length;
  return (
    <View style={s.full}>
      <ScrollMascot size={66} glow style={{ marginBottom: 12 }} />
      <Text style={s.fullTitle}>{all ? '풀이를 다 썼어요!' : title}</Text>
      <Text style={s.fullMsg}>{all ? '곧 보여 드릴게요' : `${steps.length}개 중 ${count}개 완성`}</Text>
      <View style={s.steps}>
        {steps.map(x => <StepRow key={x.key} step={x} />)}
      </View>
    </View>
  );
}

function StepRow({ step }: { step: LoaderStep }) {
  const pop = useRef(new Animated.Value(step.done ? 1 : 0)).current;
  useEffect(() => {
    if (step.done) Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 12 }).start();
  }, [step.done]);
  return (
    <View style={s.stepRow}>
      <View style={s.stepIco}>
        {step.done ? (
          <Animated.View style={[s.check, { transform: [{ scale: pop }] }]}>
            <Text style={s.checkMark}>✓</Text>
          </Animated.View>
        ) : <ActivityIndicator size="small" color={colors.inkMute} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.stepLabel, !step.done && { color: colors.inkSub }]}>{step.label}</Text>
        <Text style={s.stepSub}>{step.done ? step.sub : '쓰는 중…'}</Text>
      </View>
    </View>
  );
}

/* ---------- C. 떠 있는 진행 알약 + 써지듯 나타나는 글 ---------- */

export function FloatingReadingPill({ done, total, onPress }: { done: number; total: number; onPress?(): void }) {
  const finished = done >= total;
  const show = useRef(new Animated.Value(0)).current;
  const [gone, setGone] = useState(false);
  useEffect(() => {
    if (!finished) { setGone(false); Animated.spring(show, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 6 }).start(); return; }
    const t = setTimeout(() => Animated.timing(show, { toValue: 0, duration: 260, useNativeDriver: true }).start(() => setGone(true)), 1400);
    return () => clearTimeout(t);
  }, [finished]);
  if (gone) return null;
  return (
    <Animated.View pointerEvents="box-none" style={[s.pillWrap, { opacity: show, transform: [{ translateY: show.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }]}>
      <PressableScale onPress={onPress} style={s.pill} scaleTo={0.96}>
        {finished ? <Text style={s.pillDone}>✓</Text> : <Image source={SCROLL_MASCOT} style={{ width: 34, height: 34 }} contentFit="contain" autoplay />}
        <Text style={s.pillText}>{finished ? '풀이를 다 썼어요' : '풀이를 쓰고 있어요'}</Text>
        {finished ? null : <Text style={s.pillCount}>{done}/{total}</Text>}
      </PressableScale>
    </Animated.View>
  );
}

/** 글자가 써지듯 나타나는 문단. 동작 줄이기면 바로 다 보여 준다 */
export function TypeReveal({ text, style, cps = 90 }: { text: string; style?: StyleProp<TextStyle>; cps?: number }) {
  const reduced = useReducedMotion();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (reduced) { setN(text.length); return; }
    setN(0);
    const step = Math.max(1, Math.round(cps / 30));
    const t = setInterval(() => setN(v => {
      if (v + step >= text.length) { clearInterval(t); return text.length; }
      return v + step;
    }), 33);
    return () => clearInterval(t);
  }, [text, reduced]);
  return <Text style={style}>{text.slice(0, n)}{n < text.length ? <Text style={{ color: colors.accent }}>▍</Text> : null}</Text>;
}

/** 아직 쓰지 않은 파트 자리 — 회색 막대 대신 작은 마스코트와 한 줄 */
export function WritingLine({ label = '이 부분을 쓰고 있어요' }: { label?: string }) {
  const v = useRef(new Animated.Value(0.45)).current;
  useEffect(() => {
    const a = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(v, { toValue: 0.45, duration: 700, useNativeDriver: true }),
    ]));
    a.start();
    return () => a.stop();
  }, []);
  return (
    <View style={s.writing}>
      <Image source={SCROLL_MASCOT} style={{ width: 28, height: 28 }} contentFit="contain" autoplay />
      <Animated.Text style={[s.writingText, { opacity: v }]}>{label}</Animated.Text>
    </View>
  );
}

const s = StyleSheet.create({
  full: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 48 },
  fullTitle: { ...sansW('700'), fontSize: 20, lineHeight: 28, letterSpacing: -1, color: colors.ink, textAlign: 'center', marginTop: 12 },
  fullMsg: { ...sansW('500'), fontSize: 14, lineHeight: 20, letterSpacing: -0.7, color: colors.inkMute, textAlign: 'center', marginTop: 6, minHeight: 20 },
  fullBarWrap: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 28 },
  track: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.line, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: colors.accent },
  pct: { ...sansW('700'), width: 40, textAlign: 'right', fontSize: 14, color: colors.ink },
  note: { ...sansW('400'), fontSize: 12, lineHeight: 17, color: colors.inkMute, textAlign: 'center', marginTop: 16 },
  steps: { alignSelf: 'stretch', marginTop: 28, gap: 4, backgroundColor: colors.card, borderRadius: 16, paddingVertical: 8, paddingHorizontal: 16 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  stepIco: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  check: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  checkMark: { color: colors.white, fontSize: 13, fontWeight: '800', lineHeight: 16 },
  stepLabel: { ...sansW('600'), fontSize: 15, lineHeight: 20, letterSpacing: -0.75, color: colors.ink },
  stepSub: { ...sansW('400'), fontSize: 12, lineHeight: 17, letterSpacing: -0.5, color: colors.inkMute, marginTop: 1 },
  pillWrap: { position: 'absolute', left: 0, right: 0, bottom: 28, alignItems: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 8, paddingRight: 16, height: 48, borderRadius: 24, backgroundColor: colors.heroBg, ...shadow.hero },
  pillText: { ...sansW('600'), fontSize: 14, letterSpacing: -0.6, color: colors.white },
  pillCount: { ...sansW('700'), fontSize: 13, color: colors.moon },
  pillDone: { width: 34, textAlign: 'center', fontSize: 16, fontWeight: '800', color: colors.moon },
  writing: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  writingText: { ...sansW('500'), fontSize: 13, letterSpacing: -0.6, color: colors.inkMute },
});
