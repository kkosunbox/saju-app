/**
 * 결제 전 무료 미리보기(상단 카드)를 받아 오는 동안 그 자리에 두는 C방식 구름 카드 —
 * 서버가 계산해 주는 값이지만, 미리보기를 '만들어 주는' 듯이 단계를 하나씩 체크한 뒤 보여 준다.
 *
 * 캐시 여부와 관계없이 각 프로필의 첫 미리보기에는 연출을 보여 준다.
 * 연출을 끝까지 본 기록은 이 기기에 저장하고, 다시 볼 때는 바로 보여 준다.
 */
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { CloudBackdrop, ScrollMascot, StepRow, useNow } from './ReadingLoaders';
import Reveal from '../Reveal';
import { colors, isDark } from '../../theme/colors';
import { radius, sansW } from '../../theme/typography';
import { useApp } from '../../context/AppContext';
import { useContentScope } from '../../context/ContentScopeContext';
import { useSharedView } from '../../context/SharedViewContext';
import { deviceKey } from '../../services/storage/storageService';

/** 단계 하나가 '만드는 중'에서 체크되기까지 */
const STEP_MS = 520;
/** 다 체크한 뒤 "다 만들었어요"를 보여 주는 한 박자 */
const HOLD_MS = 450;
const seen = new Set<string>();

export interface MakingStep { key: string; label: string; sub: string }

export interface PreviewMaking {
  /** 아직 연출 중 — 미리보기 자리에 카드를 둔다 */
  making: boolean;
  /** 이번에 연출을 거쳐 나온 미리보기 — 부드럽게 나타나게 */
  fresh: boolean;
  startedAt: number;
  /** 미리보기를 받은 때 (아직이면 null) */
  readyAt: number | null;
}

/**
 * key: 미리보기가 바뀌는 단위(연도 · 달 · 목적 …) — 바뀌면 처음부터 다시 만든다.
 * ready: 미리보기를 그릴 수 있음 · enabled: 연출을 쓸지 (열람한 콘텐츠는 끈다)
 */
export function usePreviewMaking(key: string, ready: boolean, enabled: boolean, steps: number): PreviewMaking {
  const { user } = useApp();
  const scope = useContentScope();
  const shared = useSharedView();
  const active = enabled && !!user && !shared && !scope?.entitlement;
  const historyKey = deviceKey(`previewMaking:${user?.id}:${scope?.profileId ?? user?.profileId ?? 'primary'}:${scope?.profile?.version ?? user?.version ?? 0}:${key}`);
  const stateKey = `${historyKey}:${active}`;
  const [st, setSt] = useState(() => begin(stateKey, ready, active, seen.has(historyKey)));
  // 프로필 · 연도 · 달 · 목적이 바뀌면 이전 결과가 한 프레임도 비치지 않게 한다.
  useEffect(() => {
    if (st.key !== stateKey) setSt(begin(stateKey, ready, active, seen.has(historyKey)));
  }, [stateKey, st.key, ready, active, historyKey]);
  useEffect(() => {
    if (st.key !== stateKey || st.checked) return;
    let live = true;
    AsyncStorage.getItem(historyKey).catch(() => null).then(value => {
      if (!live) return;
      if (value === '1') seen.add(historyKey);
      setSt(s => s.key === stateKey ? { ...s, checked: true, instant: value === '1', at: Date.now() } : s);
    });
    return () => { live = false; };
  }, [stateKey, historyKey, st.key, st.checked]);
  useEffect(() => {
    if (ready && st.key === stateKey && st.readyAt == null) setSt(s => ({ ...s, readyAt: Date.now() }));
  }, [ready, stateKey, st.key, st.readyAt]);
  // 받은 뒤 남은 단계를 다 체크하고 한 박자 쉬면 끝
  useEffect(() => {
    if (st.key !== stateKey || !st.checked || st.instant || st.over || st.readyAt == null || !active) return;
    const end = Math.max(st.at + steps * STEP_MS, st.readyAt) + HOLD_MS;
    const k = st.key;
    const t = setTimeout(() => {
      seen.add(historyKey);
      void AsyncStorage.setItem(historyKey, '1').catch(() => {});
      setSt(s => (s.key === k ? { ...s, over: true } : s));
    }, Math.max(0, end - Date.now()));
    return () => clearTimeout(t);
  }, [st, steps, stateKey, historyKey, active]);
  if (st.key !== stateKey || !st.checked) return { making: active, fresh: active, startedAt: Infinity, readyAt: null };
  return { making: active && !st.instant && !st.over, fresh: active && !st.instant, startedAt: st.at, readyAt: st.readyAt };
}

function begin(key: string, ready: boolean, enabled: boolean, seen: boolean) {
  const now = Date.now();
  return { key, at: now, checked: !enabled || seen, instant: !enabled || seen, readyAt: ready ? now : null as number | null, over: false };
}

/** 미리보기 자리의 구름 카드 — 위에서부터 차례로 '만드는 중' → 체크. 마지막 단계는 미리보기를 받아야 체크된다 */
export function PreviewMakingCard({ gate, steps, title = '미리보기를 만들고 있어요', style }: {
  gate: PreviewMaking; steps: MakingStep[]; title?: string; style?: StyleProp<ViewStyle>;
}) {
  const now = useNow(true, 120);
  const n = steps.length;
  const doneAt = (i: number) => i < n - 1
    ? gate.startedAt + (i + 1) * STEP_MS
    : gate.readyAt == null ? Infinity : Math.max(gate.startedAt + n * STEP_MS, gate.readyAt);
  const count = steps.filter((_, i) => now >= doneAt(i)).length;
  const all = count === n;
  return (
    <View style={[s.card, style]} accessibilityLabel={`${all ? '미리보기를 다 만들었어요' : title}. ${n}개 중 ${count}개 완료`}>
      <CloudBackdrop fades={false} />
      <View style={s.body}>
        <View style={s.head}>
          <ScrollMascot size={52} glow />
          <View style={{ flex: 1 }}>
            <Text style={s.title}>{all ? '미리보기를 다 만들었어요!' : title}</Text>
            <Text style={s.sub}>{all ? '곧 보여 드릴게요' : `${n}개 중 ${count}개 완성`}</Text>
          </View>
        </View>
        <View style={s.steps}>
          {steps.map((x, i) => {
            const done = now >= doneAt(i);
            const state = done ? 'done' : now >= gate.startedAt + i * STEP_MS ? 'writing' : 'waiting';
            return <StepRow key={x.key} step={{ ...x, done, state }} activeText="만드는 중…" />;
          })}
        </View>
      </View>
    </View>
  );
}

/** 연출을 거쳐 나온 미리보기만 부드럽게 나타나게 */
export function PreviewReveal({ gate, children }: { gate: PreviewMaking; children: React.ReactNode }) {
  return gate.fresh ? <Reveal>{children}</Reveal> : <>{children}</>;
}

/** 콘텐츠별 미리보기 만드는 단계 */
export const PREVIEW_STEPS = {
  newyear: [
    { key: 'yp', label: '올해의 기운 읽기', sub: '세운과 내 사주의 관계' },
    { key: 'score', label: '올해 종합 점수 매기기', sub: '분야별 운을 모아서' },
    { key: 'idiom', label: '올해의 사자성어 고르기', sub: '한 해를 담은 네 글자' },
  ],
  monthly: [
    { key: 'mp', label: '이달의 기운 읽기', sub: '월운과 내 사주의 관계' },
    { key: 'days', label: '날마다 점수 매기기', sub: '좋은 날 · 조심할 날' },
    { key: 'line', label: '이달의 한 줄 쓰기', sub: '키워드와 요약' },
  ],
  love: [
    { key: 'el', label: '연애 기운 살피기', sub: '배우자의 별 · 도화' },
    { key: 'mbti', label: 'MBTI와 맞춰 보기', sub: '관계를 대하는 방식' },
    { key: 'style', label: '나의 연애 스타일 찾기', sub: '한 줄로 정리' },
  ],
  money: [
    { key: 'el', label: '재물 기운 살피기', sub: '재성의 힘과 자리' },
    { key: 'habit', label: '돈 다루는 습관 읽기', sub: '모으는 힘 · 쓰는 힘' },
    { key: 'type', label: '나의 돈 성향 찾기', sub: '한 줄로 정리' },
  ],
  career: [
    { key: 'talent', label: '타고난 재능 살피기', sub: '식상 · 관성의 힘' },
    { key: 'way', label: '일하는 방식 읽기', sub: '사주와 MBTI로' },
    { key: 'jobs', label: '맞는 일 고르기', sub: '어울리는 직무' },
  ],
  life: [
    { key: 'daeun', label: '대운 펼치기', sub: '10년마다 바뀌는 큰 운' },
    { key: 'score', label: '나이별 운 점수 매기기', sub: '오르막 · 내리막' },
    { key: 'map', label: '인생 지도 그리기', sub: '한눈에 보는 흐름' },
  ],
  lucky: [
    { key: 'days', label: '앞으로 45일 살피기', sub: '날마다의 기운' },
    { key: 'score', label: '목적에 맞춰 점수 매기기', sub: '나와 맞는 날' },
    { key: 'top', label: '좋은 날 TOP 5 고르기', sub: '5위를 먼저 공개해요' },
  ],
  spouse: [
    { key: 'star', label: '배우자의 별 찾기', sub: '사주 속 인연의 기운' },
    { key: 'year', label: '인연의 해 계산하기', sub: '올해 · 가장 강한 해' },
    { key: 'face', label: '미래 배우자 그리기', sub: 'MBTI · 띠 · 나이 차이' },
  ],
} satisfies Record<string, MakingStep[]>;

const s = StyleSheet.create({
  card: { marginTop: 12, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: isDark ? colors.card : '#EAF6FF' },
  body: { paddingTop: 18, paddingBottom: 16, paddingHorizontal: 16 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { ...sansW('700'), fontSize: 16, lineHeight: 22, letterSpacing: -0.8, color: colors.ink },
  sub: { ...sansW('500'), fontSize: 12.5, lineHeight: 18, letterSpacing: -0.5, color: colors.inkMute, marginTop: 2 },
  steps: { marginTop: 12, borderRadius: 14, paddingVertical: 2, paddingHorizontal: 14, backgroundColor: isDark ? colors.cream : 'rgba(255,255,255,0.82)' },
});
