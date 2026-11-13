/**
 * 알로 연 콘텐츠의 AI 풀이를 기다리는 연출.
 *
 * B방식(단독 유료 화면): 쓰는 동안 화면 전체를 단계 체크리스트로 덮는다 — useReadingGate · ReadingStepsScreen.
 * C방식(무료 결과 안에 붙는 유료 섹션 — 심층 궁합 · 속마음 · 반려동물 궁합): 본문은 그대로 두고,
 *   아직 안 쓴 파트의 섹션은 숨기고 그 자리에 로딩 카드 하나만 둔 뒤, 다 쓴 파트부터 나타낸다 — useReadingSections · ReadingPart.
 *
 * (B방식)
 * 풀이를 쓰는 동안은 본문 대신 화면 전체를 체크리스트 로딩으로 덮고, 다 쓰면 "다 썼어요"를 잠깐 보여 준 뒤 본문을 띄운다.
 * 계산 결과도 풀이가 끝날 때까지 미리 보여 주지 않는다.
 */
import React, { useEffect, useRef, useState } from 'react';
import Screen from '../Screen';
import Reveal from '../Reveal';
import { LoaderStep, ReadingWritingCard, StepReadingLoader, useNow } from './ReadingLoaders';
import { ReadingView } from '../../types/reading';
import { usePremium } from '../../context/PremiumContext';

interface StepDef { key: string; label: string; sub: string }
interface StepsDef { title: string; steps: StepDef[] }

/** 콘텐츠마다 서버가 나눠 쓰는 풀이 파트 (server: *.reading.ts 의 파트 이름과 같다) */
export const READING_STEPS = {
  saju: { title: '상세사주를 풀고 있어요', steps: [
    { key: 'core', label: '타고난 성품', sub: '겉모습 · 속마음 · 강점과 보완점' },
    { key: 'structure', label: '오행 · 용신 · 십성', sub: '다섯 기운의 균형과 타고난 재능' },
    { key: 'fields', label: '분야별 타고난 운', sub: '연애 · 재물 · 일 · 관계 · 건강' },
    { key: 'flow', label: '대운과 개운법', sub: '지금의 10년 · 다음 10년' },
  ] },
  life: { title: '평생운을 풀고 있어요', steps: [
    { key: 'overview', label: '인생의 큰 흐름', sub: '초년 · 중년 · 말년과 황금기' },
    { key: 'daeun', label: '10년 대운', sub: '대운마다의 흐름과 지금 집중할 것' },
    { key: 'years', label: '해마다의 운', sub: '앞으로 몇 해의 흐름' },
  ] },
  year: { title: '신년운세를 풀고 있어요', steps: [
    { key: 'overview', label: '올해의 큰 흐름', sub: '기운 · 좋은 신호 · 조심할 점' },
    { key: 'fields', label: '분야별 운', sub: '재물 · 일 · 연애 · 건강 · 관계 · 공부' },
    { key: 'months', label: '달마다의 운', sub: '열두 달과 분기별 흐름' },
  ] },
  month: { title: '이달의 운세를 풀고 있어요', steps: [
    { key: 'overview', label: '이달의 흐름', sub: '분야별 운과 이달의 미션' },
    { key: 'days', label: '주별 · 날짜별 운', sub: '좋은 날과 조심할 날' },
  ] },
  themeLove: { title: '연애운을 풀고 있어요', steps: [
    { key: 'core', label: '나의 연애 성향', sub: '연애 패턴 · 매력 · 조심할 점' },
    { key: 'match', label: '잘 맞는 사람', sub: '어울리는 인연과 부딪히는 인연' },
    { key: 'timing', label: '인연이 오는 시기', sub: '좋은 해 · 좋은 달 · 지금의 흐름' },
  ] },
  themeMoney: { title: '재물운을 풀고 있어요', steps: [
    { key: 'core', label: '나의 돈 성향', sub: '버는 법 · 새는 곳 · 지키는 법' },
    { key: 'timing', label: '재물이 들어오는 시기', sub: '좋은 해 · 좋은 달 · 지금의 흐름' },
  ] },
  themeCareer: { title: '직업운을 풀고 있어요', steps: [
    { key: 'core', label: '나에게 맞는 일', sub: '어울리는 직업 · 일하는 방식 · 리더십' },
    { key: 'timing', label: '일이 풀리는 시기', sub: '좋은 해 · 좋은 달 · 지금의 흐름' },
  ] },
  lucky: { title: '길일을 풀고 있어요', steps: [
    { key: 'days', label: '고른 날의 이유', sub: '좋은 날 · 피할 날 · 실천 팁' },
  ] },
  spouse: { title: '미래 배우자를 그리고 있어요', steps: [
    { key: 'portrait', label: '미래 배우자의 모습', sub: '성격 · 외모 · 연애와 생활 방식' },
    { key: 'mine', label: '내 사주 속 배우자 자리', sub: '배우자의 별과 결혼 생활' },
    { key: 'timing', label: '만나는 시기와 장소', sub: '좋은 해 · 좋은 달 · 만날 곳' },
  ] },
  // C방식 (무료 결과 안의 유료 섹션) — 화면에 나오는 순서와 같다
  compat: { title: '심층 궁합을 풀고 있어요', steps: [
    { key: 'bond', label: '두 사람의 인연', sub: '사주로 본 인연 · 서로에게 어떤 사람인지' },
    { key: 'fields', label: '분야별 궁합', sub: '연애 · 생활 · 대화 · 돈' },
    { key: 'together', label: '함께하는 법', sub: '부딪히는 순간 · 서로를 위한 조언 · 좋은 날' },
  ] },
  crush: { title: '그 사람의 속마음을 풀고 있어요', steps: [
    { key: 'heart', label: '그 사람의 마음', sub: '나를 느끼는 방식 · 호감 신호' },
    { key: 'approach', label: '다가가는 법', sub: '관계의 속도 · 연락하기 좋은 날 · 대화' },
  ] },
  pet: { title: '아이와의 궁합을 풀고 있어요', steps: [
    { key: 'portrait', label: '아이의 성격과 이야기', sub: '타고난 성격 · 매력 · 사용 설명서' },
    { key: 'bond', label: '우리 사이', sub: '서로에게 어떤 존재인지 · 아이의 편지' },
    { key: 'days', label: '함께하는 하루', sub: '루틴 · 놀이 · 계절마다 챙길 것' },
  ] },
} satisfies Record<string, StepsDef>;
export type ReadingStepsKind = keyof typeof READING_STEPS;

const HOLD_MS = 900;
/** 다 쓴 뒤 남은 항목을 하나씩 체크하는 간격 */
const CHECK_GAP_MS = 300;
/** 쓰는 동안 항목이 차례로 '쓰는 중'이 되는 간격 */
const START_GAP_MS = 500;

/**
 * 체크리스트 로딩을 보여 줄지. 쓰는 중이면 true, 방금 다 썼으면 "다 썼어요"를 잠깐 더 보여 준다.
 * appeared: 이번에 로딩을 거쳐 본문이 열렸는지 (본문을 부드럽게 띄울 때 쓴다).
 */
interface ContentState { open: boolean; data?: unknown; isError?: boolean }

/**
 * 방금 알로 열어서 콘텐츠를 받아 오는 중인지. 이때 예전 '풀이를 불러오고 있어요' 대신 바로 새 로딩을 띄운다.
 * (이미 열어 둔 콘텐츠를 다시 볼 때는 해당 없음 — 앱을 켜고 보유 목록을 받는 순간은 '방금 연 것'으로 치지 않는다)
 */
export function useJustOpenedFetching(content: ContentState | undefined) {
  const { ready } = usePremium();
  const open = !!content?.open;
  // 잠금 → 열림으로 바뀐 그 렌더에서 바로 안다 (effect로 알면 그 사이 한 프레임에 예전 로딩이 그려진다)
  const [prev, setPrev] = useState<boolean | null>(null);
  const [justOpened, setJustOpened] = useState(false);
  const flipped = ready && prev === false && open;
  if (ready && prev !== open) {
    setPrev(open);
    if (flipped) setJustOpened(true);
  }
  return (justOpened || flipped) && open && !content?.data && !content?.isError;
}

export function useReadingGate(reading: ReadingView<unknown> | null | undefined, content?: ContentState) {
  const fetching = useJustOpenedFetching(content);
  const writing = reading?.status === 'writing';
  const done = reading?.status === 'done';
  const [hold, setHold] = useState(false);
  const [appeared, setAppeared] = useState(writing);
  // 쓰는 중 → 다 씀으로 바뀐 그 렌더에서 바로 hold를 켠다. effect로 켜면 그 사이 한 렌더 동안 show가 false가 되어
  // 체크리스트 화면이 내려갔다 다시 올라오고(새로 마운트), 이미 체크한 항목까지 처음부터 다시 체크된다
  const [prevWriting, setPrevWriting] = useState(writing);
  if (prevWriting !== writing) {
    setPrevWriting(writing);
    if (writing) setAppeared(true);
    // 쓰다 실패하면 본문(실패 안내 · 다시 쓰기)으로 바로
    else if (done) setHold(true);
  }
  // 남은 항목을 하나씩 체크하는 시간(ReadingStepsScreen) + "다 썼어요"
  const holdMs = (reading?.total ?? 0) * CHECK_GAP_MS + HOLD_MS;
  useEffect(() => {
    if (!hold) return;
    const t = setTimeout(() => setHold(false), holdMs);
    return () => clearTimeout(t);
  }, [hold, holdMs]);
  return { show: writing || hold || fetching, appeared: appeared || writing || fetching };
}

/** 풀이를 쓰는 동안의 화면 — 상단 바(뒤로 가기)는 그대로, 아래는 체크리스트 로딩 */
export function ReadingStepsScreen({ title, kind, reading, right }: {
  title: string; kind: ReadingStepsKind; reading: ReadingView<unknown> | null | undefined; right?: React.ReactNode;
}) {
  const def: StepsDef = READING_STEPS[kind];
  const parts = (reading?.parts ?? {}) as Record<string, unknown>;
  const finished = reading?.status === 'done';
  const n = def.steps.length;
  // 서버는 파트를 동시에 써서 끝날 때 한꺼번에 체크된다 → 쓰는 동안은 위에서부터 차례로 '쓰는 중'을 켜고,
  // 다 쓰면 남은 항목을 하나씩 체크한다
  const [startedAt] = useState(() => Date.now());
  const now = useNow(!finished, 250);
  // 실제로는 동시에 쓰니 '곧 시작해요'는 잠깐만 — 0.5초 간격으로 차례로 '쓰는 중'이 된다
  const started = Math.min(n, 1 + Math.floor((now - startedAt) / START_GAP_MS));
  const [checked, setChecked] = useState(0);
  useEffect(() => {
    if (!finished) return;
    let i = 0;
    const t = setInterval(() => { i += 1; setChecked(i); if (i >= n) clearInterval(t); }, CHECK_GAP_MS);
    return () => clearInterval(t);
  }, [finished, n]);
  // 다 쓰기 전에 이미 받은 파트 (다 쓴 응답에는 모든 파트가 한꺼번에 들어 있다)
  const seen = useRef(new Set<string>());
  if (!finished) for (const k of Object.keys(parts)) seen.current.add(k);
  const pending = def.steps.filter(x => !seen.current.has(x.key)).map(x => x.key);
  const steps = def.steps.map((x, i): LoaderStep => {
    const done = seen.current.has(x.key) || (finished && pending.indexOf(x.key) < checked);
    return { ...x, done, state: done ? 'done' : i < started || finished ? 'writing' : 'waiting' };
  });
  return (
    <Screen title={title} back right={right} scroll={false}>
      <StepReadingLoader title={def.title} steps={steps} note="화면을 나가셔도 괜찮아요. 완료되면 알려드릴게요." />
    </Screen>
  );
}

/** 로딩을 거쳐 열린 본문은 부드럽게 나타난다 */
export function ReadingReveal({ on, children }: { on: boolean; children: React.ReactNode }) {
  return on ? <Reveal>{children}</Reveal> : <>{children}</>;
}

/* ---------- C방식 ---------- */

export interface ReadingSections {
  kind: ReadingStepsKind;
  reading: ReadingView<unknown> | null | undefined;
  writing: boolean;
  parts: Record<string, unknown>;
  /**
   * 로딩 카드를 둘 파트 — 쓰기 시작한 걸 처음 봤을 때 아직 안 쓴 첫 파트. 쓰는 동안 바뀌지 않는다.
   * (먼저 끝난 파트를 따라 카드가 다음 섹션으로 옮겨 가면 카드가 새로 그려져 마스코트·구름이 처음부터 다시 돈다)
   */
  anchor: string | null;
  /** 이 화면에서 쓰는 중인 걸 처음 본 시각 (로딩 카드의 진행 막대가 이어지게) */
  startedAt: number;
}

/** 방금 열어 콘텐츠를 받는 동안 띄운 로딩 카드의 시작 시각 — 본문의 로딩 카드가 이어받아 체크리스트가 처음으로 돌아가지 않게 */
const openingStartedAt = new Map<ReadingStepsKind, number>();
const OPENING_CARRY_MS = 60_000;
function takeOpeningStartedAt(kind: ReadingStepsKind) {
  const t = openingStartedAt.get(kind);
  openingStartedAt.delete(kind);
  return t != null && Date.now() - t < OPENING_CARRY_MS ? t : Date.now();
}

/** kind의 단계 순서 = 화면에 나오는 순서 */
export function useReadingSections(reading: ReadingView<unknown> | null | undefined, kind: ReadingStepsKind): ReadingSections {
  const writing = reading?.status === 'writing';
  const parts = (reading?.parts ?? {}) as Record<string, unknown>;
  const firstPending = READING_STEPS[kind].steps.map(x => x.key).find(k => parts[k] == null) ?? null;
  // 시작 시각은 effect에서 기록하고, 전환 렌더에서는 첫 대기 파트를 바로 사용한다.
  const [run, setRun] = useState(() => ({ writing, startedAt: takeOpeningStartedAt(kind), anchor: writing ? firstPending : null }));
  useEffect(() => {
    if (run.writing !== writing) {
      setRun({ writing, startedAt: writing ? Date.now() : run.startedAt, anchor: writing ? firstPending : null });
    }
  }, [writing, firstPending, run]);
  return { kind, reading, writing, parts, startedAt: run.startedAt, anchor: writing ? (run.writing ? run.anchor : firstPending) : null };
}

/**
 * 풀이 파트 하나에 딸린 섹션(제목 포함). 쓰는 동안은 카드 자리(anchor)부터 아래 파트의 섹션을 제목·계산 결과까지 숨기고,
 * anchor 파트의 첫 섹션(lead) 자리에만 로딩 카드를 하나 둔다. 다 쓰면 한꺼번에 부드럽게 나타난다.
 * (서버는 파트를 동시에 써서 1~2초 안에 함께 끝나니, 먼저 끝난 파트만 따로 띄우지 않는다)
 * 쓰지 못했으면(실패 · 쓸 수 없음) 본문이 계산 결과의 문장으로 채운다.
 */
export function ReadingPart({ s, part, lead, children }: { s: ReadingSections; part: string; lead?: boolean; children: React.ReactNode }) {
  const waited = useRef(false);
  const order = READING_STEPS[s.kind].steps.map(x => x.key);
  const hidden = s.writing && (s.parts[part] == null || (s.anchor != null && order.indexOf(part) >= order.indexOf(s.anchor)));
  if (hidden) {
    waited.current = true;
    return lead && s.anchor === part ? <ReadingWritingCard startedAt={s.startedAt} steps={READING_STEPS[s.kind].steps} doneKeys={Object.keys(s.parts)} /> : null;
  }
  return waited.current ? <Reveal>{children}</Reveal> : <>{children}</>;
}

/** C방식에서 방금 열어 콘텐츠를 받아 오는 동안 — 본문 자리에 로딩 카드를 바로 둔다 */
export function ReadingOpeningCard({ kind }: { kind: ReadingStepsKind }) {
  const [startedAt] = useState(() => Date.now());
  useEffect(() => { openingStartedAt.set(kind, startedAt); }, [kind, startedAt]);
  return <ReadingWritingCard startedAt={startedAt} steps={READING_STEPS[kind].steps} doneKeys={[]} />;
}

/* ---------- 미리보기 단계 (반려동물 · 궁합) ---------- */

/** 새로 본 궁합 결과 전에 보여 주는 단계 — 서버를 기다리는 게 아니라 정해진 간격으로 넘어간다 */
export const PREVIEW_STEP_MS = 900;

/**
 * 미리보기 단계 화면 (B방식 모양). step: 끝난 단계 수 — steps.length면 "다 봤어요"를 보여 주는 마지막 한 박자.
 * 부모가 step < steps.length + 1 동안 이 화면을 보여 주고 PREVIEW_STEP_MS마다 step을 올린다.
 */
export function PreviewStepsScreen({ title, heading, steps, step, onBack }: {
  title: string; heading: string; steps: StepDef[]; step: number; onBack?(): void;
}) {
  return (
    <Screen title={title} back onBack={onBack} scroll={false}>
      <StepReadingLoader
        title={heading}
        steps={steps.map((x, i): LoaderStep => ({ ...x, done: i < step, state: i < step ? 'done' : i === step ? 'writing' : 'waiting' }))}
        doneTitle="궁합을 다 봤어요!"
        activeText="보는 중…"
      />
    </Screen>
  );
}
