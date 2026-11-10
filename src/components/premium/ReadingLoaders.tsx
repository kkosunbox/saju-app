/**
 * 재화를 써서 연 콘텐츠의 AI 풀이를 기다리는 동안의 연출 — 두루마리에 글을 쓰는 마스코트로 (스프라이트 시트에서 만든 애니메이션 WebP, scripts/build-loading-mascot.py).
 *
 * - FullReadingLoader : 화면 전체를 로딩 화면으로 덮고, 다 쓰면 본문을 한 번에 보여 준다
 * - StepReadingLoader : 풀이 파트를 체크리스트로 보여 주며 하나씩 지워 나간다
 * - FloatingReadingPill + TypeReveal : 본문은 바로 보이고, 다 쓴 파트부터 글자가 써지듯 나타난다
 */
import { Image } from 'expo-image';
import React, { useEffect, useId, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import PressableScale from '../PressableScale';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, isDark } from '../../theme/colors';
import { radius, sansW, shadow } from '../../theme/typography';
import { useReducedMotion } from '../../utils/motion';

export const SCROLL_MASCOT = require('../../../assets/images/loading-scroll.webp');

/** glow: 뒤에 숨 쉬듯 움직이는 은은한 후광을 깐다 (큰 로딩 화면용) */
/** glow='dark': 어두운 카드 위 — 하늘색 빛이 은은하게 번진다 */
export function ScrollMascot({ size = 160, style, glow }: { size?: number; style?: StyleProp<ViewStyle>; glow?: boolean | 'dark' }) {
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]} accessibilityLabel="두루마리에 풀이를 쓰는 중">
      {glow ? <MascotGlow size={size} dark={glow === 'dark'} /> : null}
      <Image source={SCROLL_MASCOT} style={{ width: size, height: size }} contentFit="contain" autoplay />
    </View>
  );
}

// 브랜드 하늘색(accent #28B2FE · 홈 하늘 #15ABFE)을 옅게
const GLOW = isDark ? ['#1E5A86', '#173B57'] as const : ['#B5E3FF', '#D9F1FF'] as const;
function MascotGlow({ size, dark }: { size: number; dark?: boolean }) {
  const reduced = useReducedMotion();
  const id = `halo${useId().replace(/:/g, '')}`;
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
  const halo = size * (dark ? 2.1 : 1.6);
  const stops = dark
    ? [[colors.accent, 0.42], [colors.accent, 0.16], [colors.accent, 0]] as const
    : [[GLOW[0], 1], [GLOW[1], 0.85], [GLOW[1], 0]] as const;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* 숨 쉬듯 커졌다 작아지는 후광 — 가장자리로 갈수록 투명해진다 */}
      <Animated.View style={{ position: 'absolute', width: halo, height: halo, left: (size - halo) / 2, top: (size - halo) / 2,
        opacity: breath.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] }), transform: [{ scale: breath.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.05] }) }] }}>
        <Svg width={halo} height={halo}>
          <Defs>
            <RadialGradient id={id} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={stops[0][0]} stopOpacity={stops[0][1]} />
              <Stop offset="0.45" stopColor={stops[1][0]} stopOpacity={stops[1][1]} />
              <Stop offset="1" stopColor={stops[2][0]} stopOpacity={stops[2][1]} />
            </RadialGradient>
          </Defs>
          <Circle cx={halo / 2} cy={halo / 2} r={halo / 2} fill={`url(#${id})`} />
        </Svg>
      </Animated.View>
    </View>
  );
}

const CLOUDS = require('../../../assets/figma/home/clouds.webp');

/**
 * 로딩 화면 바탕 — 홈 하늘의 구름 그림을 깔고, 위아래는 바탕색으로 녹인다(상단 바·아래 여백과 이어지게).
 * 구름은 아주 천천히 옆으로 흘러간다. 다크 모드는 홈처럼 구름 없이 옅은 하늘 그라디언트만.
 */
/** fades: 위아래를 바탕색으로 녹인다 (화면 전체용). 카드 안에서는 끈다 */
export function CloudBackdrop({ fades = true }: { fades?: boolean }) {
  const reduced = useReducedMotion();
  const drift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced || isDark) return;
    const a = Animated.loop(Animated.sequence([
      Animated.timing(drift, { toValue: 1, duration: 9000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(drift, { toValue: 0, duration: 9000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    a.start();
    return () => a.stop();
  }, [reduced]);
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      {isDark ? (
        <LinearGradient colors={['#16283A', colors.cream]} style={StyleSheet.absoluteFill} />
      ) : (
        <Animated.View style={[s.clouds, { transform: [{ translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [-14, 14] }) }] }]}>
          <Image source={CLOUDS} style={StyleSheet.absoluteFill} contentFit="cover" accessible={false} />
        </Animated.View>
      )}
      {fades ? <LinearGradient colors={[colors.cream, colors.cream + '00']} style={[s.fade, { top: 0 }]} /> : null}
      {fades ? <LinearGradient colors={[colors.cream + '00', colors.cream]} style={[s.fade, { bottom: 0, height: 160 }]} /> : null}
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

/* ---------- 시간 기준 진행 ---------- */

/** 서버는 풀이 파트를 동시에 써서 13~15초 뒤 1~2초 안에 한꺼번에 끝난다 — 진행 표시는 실제 진행 수 대신 지난 시간으로 그린다. */
/** active일 때 everyMs마다 다시 그리며 지금 시각을 준다 */
export function useNow(active: boolean, everyMs = 200) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(t);
  }, [active, everyMs]);
  return now;
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
      <CloudBackdrop />
      <ScrollMascot size={90} glow style={{ marginBottom: 16 }} />
      <Text style={s.fullTitle}>{title}</Text>
      <Animated.Text style={[s.fullMsg, { opacity: fade }]}>{text}</Animated.Text>
      <View style={s.fullBarWrap}>
        <View style={s.track}>
          <Animated.View style={[s.fill, { width: p.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
        </View>
        <Text style={s.pct}>{pct}%</Text>
      </View>
      <Text style={s.note}>화면을 나가셔도 괜찮아요. 완료되면 알려드릴게요.</Text>
    </View>
  );
}

/* ---------- B. 단계 체크리스트 ---------- */

/** state: 다 씀 · 쓰는 중 · 아직 시작 전 (없으면 done으로만 판단) */
export interface LoaderStep { key: string; label: string; sub: string; done: boolean; state?: 'done' | 'writing' | 'waiting' }

/** doneTitle·doneMsg: 다 끝났을 때 문구 · activeText: 진행 중인 항목 아래 문구 (기본은 AI 풀이용) */
export function StepReadingLoader({ title, steps, note, doneTitle = '풀이를 다 썼어요!', doneMsg = '곧 보여 드릴게요', activeText = '쓰는 중…' }: {
  title: string; steps: LoaderStep[]; note?: string; doneTitle?: string; doneMsg?: string; activeText?: string;
}) {
  const all = steps.every(x => x.done);
  const count = steps.filter(x => x.done).length;
  return (
    <View style={s.full}>
      <CloudBackdrop />
      <ScrollMascot size={66} glow style={{ marginBottom: 12 }} />
      <Text style={s.fullTitle}>{all ? doneTitle : title}</Text>
      <Text style={s.fullMsg}>{all ? doneMsg : count ? `${steps.length}개 중 ${count}개 완성` : ''}</Text>
      <View style={s.steps}>
        {steps.map(x => <StepRow key={x.key} step={x} activeText={activeText} />)}
      </View>
      {note && !all ? <Text style={s.note}>{note}</Text> : null}
    </View>
  );
}

function StepRow({ step, activeText }: { step: LoaderStep; activeText: string }) {
  const waiting = !step.done && step.state === 'waiting';
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
        ) : waiting ? <View style={s.waitDot} /> : <ActivityIndicator size="small" color={colors.accent} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.stepLabel, !step.done && { color: waiting ? colors.inkMute : colors.inkSub }]}>{step.label}</Text>
        <Text style={s.stepSub}>{step.done ? step.sub : waiting ? '곧 시작해요' : activeText}</Text>
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

/**
 * 아직 쓰지 않은 파트 자리 — 글자 자리 줄 위에 어두운 반투명 덮개를 깔고, 가운데 마스코트와 안내 한 줄.
 * card: 카드 하나를 통째로 대신한다(카드 모양 · 안쪽 여백까지). 아니면 카드 안 앞 내용 뒤에 붙는 블록 (mt: 위 여백).
 */
export function WritingPlaceholder({ lines = 4, mt = 0, card, label = '풀이를 쓰는 중이에요', style }: { lines?: number; mt?: number; card?: boolean; label?: string; style?: StyleProp<ViewStyle> }) {
  const n = Math.max(lines, 4);
  return (
    <View style={[s.dimWrap, card ? s.dimCard : { marginTop: mt }, style]} accessibilityLabel={label}>
      <View style={{ gap: 9 }}>
        {Array.from({ length: n }, (_, i) => (
          <View key={i} style={[s.ghost, { width: i === n - 1 ? '58%' : GHOST_W[i % GHOST_W.length] }]} />
        ))}
      </View>
      <View style={s.dimmer}>
        <ScrollMascot size={56} />
        <Text style={s.dimText}>{label}</Text>
      </View>
    </View>
  );
}
const GHOST_W = ['100%', '94%', '97%', '89%'] as const;

/**
 * C방식 로딩 카드 — 아직 안 쓴 섹션 자리에 하나만 둔다.
 * 진행 안내(몇 개째 · 막대 · 화면을 나가도 계속 써요)와 마스코트를 검은 덮개 카드 하나에 합쳤다.
 */
export function ReadingWritingCard({ startedAt, steps, doneKeys, style, variant = 'cloud' }: {
  startedAt: number; steps: { key: string; label: string; sub: string }[]; doneKeys: string[]; style?: StyleProp<ViewStyle>;
  /** cloud: 홈 하늘 구름을 깐 밝은 카드 (B방식을 카드 크기로) · dark: 검은 덮개 카드 */
  variant?: 'cloud' | 'dark';
}) {
  // 서버는 파트를 동시에 쓴다 — 0.5초 간격으로 차례로 '쓰는 중'을 켜고, 받은 파트는 체크
  const now = useNow(true, 250);
  const started = Math.min(steps.length, 1 + Math.floor((now - startedAt) / 500));
  if (variant === 'cloud') {
    return (
      <View style={[s.cloudCard, style]} accessibilityLabel={`풀이를 쓰고 있어요. ${steps.length}개 중 ${doneKeys.length}개 완료`}>
        <CloudBackdrop fades={false} />
        <View style={s.bigBody}>
          <ScrollMascot size={60} glow />
          <Text style={[s.fullTitle, { fontSize: 17, lineHeight: 24, marginTop: 6 }]}>풀이를 쓰고 있어요</Text>
          <View style={[s.steps, { marginTop: 16 }]}>
            {steps.map((x, i) => {
              const done = doneKeys.includes(x.key);
              return <StepRow key={x.key} step={{ ...x, done, state: done ? 'done' : i < started ? 'writing' : 'waiting' }} activeText="쓰는 중…" />;
            })}
          </View>
          <Text style={[s.note, { marginTop: 14 }]}>화면을 나가셔도 괜찮아요. 완료되면 알려드릴게요.</Text>
        </View>
      </View>
    );
  }
  return (
    <View style={[s.bigCard, style]} accessibilityLabel={`풀이를 쓰고 있어요. ${steps.length}개 중 ${doneKeys.length}개 완료`}>
      {/* 덮개 아래로 비치는 글자 자리 · 검은 덮개 — 카드 높이는 위의 내용(여백 포함)이 정한다 */}
      <View style={s.ghostLayer} pointerEvents="none">
        {Array.from({ length: 16 }, (_, i) => (
          <View key={i} style={[s.ghost, { width: GHOST_W[i % GHOST_W.length] }]} />
        ))}
      </View>
      <View style={s.dimLayer} pointerEvents="none" />
      <View style={s.bigBody}>
        <ScrollMascot size={60} glow="dark" />
        <Text style={[s.bigTitle, { marginTop: 4 }]}>풀이를 쓰고 있어요</Text>
        <View style={s.cSteps}>
          {steps.map((x, i) => {
            const done = doneKeys.includes(x.key);
            const waiting = !done && i >= started;
            return (
              <View key={x.key} style={s.cRow}>
                <View style={s.stepIco}>
                  {done ? <View style={s.check}><Text style={s.checkMark}>✓</Text></View>
                    : waiting ? <View style={[s.waitDot, { borderColor: 'rgba(255,255,255,0.35)' }]} />
                    : <ActivityIndicator size="small" color={colors.white} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.cLabel, waiting && { color: 'rgba(255,255,255,0.55)' }]}>{x.label}</Text>
                  <Text style={s.cSub} numberOfLines={1}>{done ? x.sub : waiting ? '곧 시작해요' : '쓰는 중…'}</Text>
                </View>
              </View>
            );
          })}
        </View>
        <Text style={s.bigNote}>화면을 나가셔도 괜찮아요. 완료되면 알려드릴게요.</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  clouds: { position: 'absolute', top: 0, bottom: 0, left: -20, right: -20, opacity: 0.95 },
  fade: { position: 'absolute', left: 0, right: 0, height: 72 },
  full: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 48 },
  fullTitle: { ...sansW('700'), fontSize: 20, lineHeight: 28, letterSpacing: -1, color: colors.ink, textAlign: 'center', marginTop: 12 },
  fullMsg: { ...sansW('500'), fontSize: 14, lineHeight: 20, letterSpacing: -0.7, color: colors.inkMute, textAlign: 'center', marginTop: 6, minHeight: 20 },
  fullBarWrap: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 28 },
  track: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.line, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: colors.accent },
  pct: { ...sansW('700'), width: 40, textAlign: 'right', fontSize: 14, color: colors.ink },
  note: { ...sansW('400'), fontSize: 12, lineHeight: 17, color: colors.inkMute, textAlign: 'center', marginTop: 16 },
  steps: { alignSelf: 'stretch', marginTop: 28, gap: 4, backgroundColor: isDark ? colors.card : 'rgba(255,255,255,0.82)', borderRadius: 16, paddingVertical: 8, paddingHorizontal: 16 },
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
  ghost: { height: 10, borderRadius: 5, backgroundColor: colors.lineStrong },
  dimWrap: { borderRadius: radius.lg, overflow: 'hidden', minHeight: 132, justifyContent: 'center', padding: 14 },
  dimCard: { backgroundColor: colors.card, padding: 16 },
  dimmer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.78)', alignItems: 'center', justifyContent: 'center' },
  cloudCard: { marginTop: 24, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: isDark ? colors.card : '#EAF6FF' },
  bigCard: { marginTop: 24, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.card },
  ghostLayer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, padding: 16, gap: 10 },
  dimLayer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.78)' },
  bigBody: { alignItems: 'center', paddingTop: 32, paddingBottom: 28, paddingHorizontal: 20 },
  cSteps: { alignSelf: 'stretch', gap: 10, marginTop: 14, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)' },
  cRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cLabel: { ...sansW('600'), fontSize: 14, lineHeight: 19, letterSpacing: -0.6, color: colors.white },
  cSub: { ...sansW('400'), fontSize: 11.5, lineHeight: 16, letterSpacing: -0.4, color: 'rgba(255,255,255,0.6)' },
  bigTitle: { ...sansW('700'), fontSize: 16, lineHeight: 22, letterSpacing: -0.8, color: colors.white },
  waitDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.lineStrong },
  bigNote: { ...sansW('400'), fontSize: 12, lineHeight: 17, letterSpacing: -0.4, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginTop: 10 },
  dimText: { ...sansW('600'), fontSize: 13, lineHeight: 18, letterSpacing: -0.6, color: colors.white, marginTop: 4 },
});
