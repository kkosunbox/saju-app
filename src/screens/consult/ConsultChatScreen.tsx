import React, { useEffect, useRef, useState } from 'react';
import { ImageBackground, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View, type ScrollViewInstance, type TextInputInstance } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp, RouteProp, useNavigation, useRoute } from '@/navigation/compat';
import Screen from '../../components/Screen';
import Icon from '../../components/Icon';
import PrimaryButton from '../../components/PrimaryButton';
import PressableScale from '../../components/PressableScale';
import { BodyState, Coin, LockCard } from '../../components/premium/Kit';
import GradientBorder from '../../components/GradientBorder';
import BottomSheet from '../../components/BottomSheet';
import LoadingScreen from '../../components/LoadingScreen';
import { useApp } from '../../context/AppContext';
import { refreshPoints, usePremium } from '../../context/PremiumContext';
import { RootStackParamList } from '../../navigation/types';
import { catOf } from '../../services/content/consult';
import { fmtN, ro } from '../../services/premium/catalog';
import { ConsultAnswer, ConsultFacts, ConsultTeaser, ConsultView, HelpLine, consultApi, consultKeys, isFullAnswer, useConsultStatus } from '../../services/server/consultApi';
import { queryClient } from '../../api/query';
import { ApiError } from '../../api/client';
import { colors, isDark } from '../../theme/colors';
import { fonts, radius, sansW, SCREEN_PX, shadow, txt } from '../../theme/typography';
import { Counselor, HelpLines, MyBubble, ReplyBubble, STAGES, SuggestionChips, TOPIC_REC, WEB_ONE_ROW, kstDate, kstTime, useWebAutoGrow } from './parts';
import { dropAsk, getAsk, startAsk } from './pendingAsk';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const INPUT_MAX = 110;

const SEND_ERROR: Record<string, string> = {
  CONSULT_UNAVAILABLE: '답변을 만들지 못했어요. 다시 물어봐 주세요',
  DUPLICATE_REQUEST: '아직 답을 쓰고 있어요. 잠시만 기다려 주세요',
  CONSULT_CLOSED: '이 상담의 이어 묻기가 끝났어요. 새 상담으로 물어봐 주세요',
};

const ASK_ERROR: Record<string, string> = {
  CONSULT_UNAVAILABLE: '지금은 답을 만들지 못했어요. 알은 쓰이지 않았어요. 잠시 후 다시 시도해 주세요',
  DUPLICATE_REQUEST: '이미 답을 쓰고 있어요. 잠시만 기다려 주세요',
  INSUFFICIENT_POINTS: '상담에 쓸 알이 모자라요. 충전한 뒤 다시 시도해 주세요',
};

/** 상담 대화 — 첫 답변(무료 미리보기면 결론까지) 아래로 이어 묻기가 쌓인다 */
export default function ConsultChatScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'ConsultChat'>>();
  return params?.id === 'new' ? <PendingChat askKey={params.ask} /> : <Chat id={Number(params?.id)} />;
}

/** 첫 답을 기다리는 대화 — 내 고민이 먼저 보이고 상담가가 답을 쓰는 중 */
function PendingChat({ askKey }: { askKey?: string }) {
  const nav = useNavigation<Nav>();
  const { goWallet } = usePremium();
  const [key, setKey] = useState(askKey);
  const [state, setState] = useState<{ kind: 'wait' } | { kind: 'crisis'; lines: HelpLine[] } | { kind: 'error'; message: string }>({ kind: 'wait' });
  const ask = getAsk(key);
  useEffect(() => {
    if (!ask || !key) return;
    let live = true;
    ask.result.then(
      v => {
        if (!live) return;
        dropAsk(key);
        if (v.status === 'crisis' || v.id == null) { setState({ kind: 'crisis', lines: v.helpLines ?? [] }); return; }
        nav.replace('ConsultChat', { id: String(v.id) });
      },
      err => {
        if (!live) return;
        const code = err instanceof ApiError ? err.code : '';
        if (code === 'INSUFFICIENT_POINTS') goWallet?.();
        setState({ kind: 'error', message: ASK_ERROR[code] ?? ASK_ERROR.CONSULT_UNAVAILABLE });
      },
    );
    return () => { live = false; };
  }, [key]);

  const toTab = () => nav.navigate('Tabs', { screen: 'Consult' });
  if (!ask) {
    return (
      <Screen title="고민 상담" back>
        <Text style={[txt.body, { textAlign: 'center', marginTop: 40 }]}>상담 화면을 다시 열어 주세요.</Text>
        <PrimaryButton label="상담 탭으로" variant="soft" onPress={toTab} style={{ marginTop: 20 }} />
      </Screen>
    );
  }
  return (
    <Screen title="고민 상담" back sky>
      <Text style={[txt.caption, { textAlign: 'center' }]}>나만 볼 수 있어요</Text>
      <MyBubble>{ask.worry}</MyBubble>
      {state.kind === 'crisis' ? (
        <>
          <HelpLines lines={state.lines} crisis />
          <PrimaryButton label="상담 탭으로" variant="soft" onPress={toTab} style={{ marginTop: 16 }} />
        </>
      ) : (
        <>
          {state.kind === 'wait' ? <ReplyBubble typing={STAGES.first} /> : <ReplyBubble>{state.message}</ReplyBubble>}
          {state.kind === 'error' ? (
            <PrimaryButton label="다시 시도하기" onPress={() => { setState({ kind: 'wait' }); setKey(startAsk(ask.worry, ask.topic)); }} style={{ marginTop: 16 }} />
          ) : null}
        </>
      )}
    </Screen>
  );
}

function Chat({ id }: { id: number }) {
  const nav = useNavigation<Nav>();
  const { user: u, account } = useApp();
  const { toast, goWallet, points } = usePremium();
  const insets = useSafeAreaInsets();
  const scroll = useRef<ScrollViewInstance>(null);
  const inputRef = useRef<TextInputInstance>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState<string | null>(null);
  const [crisis, setCrisis] = useState<HelpLine[] | null>(null);
  const [unlockOpen, setUnlockOpen] = useState(false);
  /** 잠긴 채로 물어본 질문 — 열고 나면 바로 보낸다 */
  const [pendingQ, setPendingQ] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [del, setDel] = useState(false);
  const q = useQuery({ queryKey: consultKeys.one(id), queryFn: () => consultApi.get(id), enabled: Number.isFinite(id) });
  const status = useConsultStatus(!!account);
  const turnCount = q.data?.turns?.length ?? 0;
  useWebAutoGrow(inputRef, input, INPUT_MAX);
  // 새 말이 붙으면 아래로 (첫 화면은 답변 위에서 시작)
  useEffect(() => { if (turnCount || sending) setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 80); }, [turnCount, sending, crisis]);

  if (!u) return null;
  if (q.isPending) return <LoadingScreen />;
  const e = q.data;
  if (!e?.answer) {
    return <Screen title="고민 상담" back><BodyState error onRetry={q.isError ? () => q.refetch() : undefined} /></Screen>;
  }
  const C = catOf(e.topic);
  const cost = status.data?.cost ?? 100;
  const limit = status.data?.followUpLimit ?? 10;
  const hours = status.data?.followUpHours ?? 24;
  const full = isFullAnswer(e.answer) && e.facts ? { answer: e.answer, facts: e.facts } : null;
  const turns = e.turns ?? [];
  const suggestions = (turns.length ? turns[turns.length - 1].followUps : e.answer.followUps) ?? [];
  const canAsk = !e.locked && e.followUpsLeft > 0;
  const hook = 'hook' in e.answer ? e.answer.hook : undefined;

  const put = (v: ConsultView) => {
    queryClient.setQueryData(consultKeys.one(id), v);
    queryClient.invalidateQueries({ queryKey: consultKeys.list });
  };

  const send = (raw: string) => {
    const question = raw.trim();
    if (!question || sending) return;
    if (e.locked) { setPendingQ(question); setUnlockOpen(true); return; }
    if (!canAsk) { toast(SEND_ERROR.CONSULT_CLOSED); return; }
    post(question);
  };

  const post = async (question: string) => {
    setSending(question); setInput(''); setCrisis(null);
    try {
      const v = await consultApi.followUp(id, question);
      if (v.status === 'crisis') setCrisis(v.helpLines ?? []);
      else put(v);
    } catch (err) {
      const code = err instanceof ApiError ? err.code : '';
      if (code === 'CONTENT_LOCKED') setUnlockOpen(true);
      if (code === 'CONSULT_CLOSED') q.refetch();
      else setInput(question); // 다시 보낼 수 있게 되돌려 둔다
      toast(SEND_ERROR[code] ?? '답변을 만들지 못했어요. 다시 물어봐 주세요');
    } finally {
      setSending(null);
    }
  };

  const closeUnlock = () => { setUnlockOpen(false); setPendingQ(null); };

  const unlock = async () => {
    const question = pendingQ;
    closeUnlock(); setUnlocking(true);
    setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 80);
    let opened = false;
    try {
      const v = await consultApi.unlock(id);
      put(v);
      refreshPoints();
      opened = true;
      toast(question ? '전체 답변을 열었어요. 물어본 질문에 바로 답해 드릴게요' : `전체 답변을 열었어요. ${hours}시간 동안 ${limit}번 더 물어볼 수 있어요`);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'INSUFFICIENT_POINTS') {
        toast(`${cost}알이 필요해요. 충전 후 다시 시도해 주세요`);
        goWallet?.();
      } else {
        toast('열지 못했어요. 알은 쓰이지 않았어요');
      }
    } finally {
      setUnlocking(false);
    }
    // 열자마자 물어본 질문을 보낸다 (이어 묻기 1번으로 센다)
    if (opened && question) post(question);
  };

  const remove = async () => {
    setDel(false);
    try {
      await consultApi.remove(id);
      queryClient.removeQueries({ queryKey: consultKeys.one(id) });
      queryClient.invalidateQueries({ queryKey: consultKeys.list });
      toast('상담 기록을 지웠어요');
      nav.goBack();
    } catch {
      toast('지우지 못했어요. 잠시 후 다시 시도해 주세요');
    }
  };

  const rec = TOPIC_REC[e.topic];
  // 미리보기(잠김)여도 입력창을 보여 준다 — 보내면 전부 열기 안내가 뜬다
  const footer = e.locked || canAsk ? (
    <>
      <View style={s.inputRow}>
        <TextInput
          ref={inputRef} value={input} onChangeText={setInput} multiline maxLength={300} {...WEB_ONE_ROW}
          placeholder={e.locked ? '어떤 고민이든 편하게 말씀해주세요' : '이어서 물어보세요'} placeholderTextColor={isDark ? colors.inkMute : '#999999'}
          style={[s.input, Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)]} editable={!sending && !unlocking} accessibilityLabel="이어서 묻는 말"
        />
        <PressableScale onPress={() => send(input)} disabled={!input.trim() || !!sending || unlocking} style={[s.sendBtn, (!input.trim() || sending || unlocking) && { opacity: 0.4 }]} scaleTo={0.9} accessibilityLabel="보내기">
          <Svg width={24} height={24} viewBox="0 0 24 24"><Path d="M16 10l-4-4-4 4M12 6v12" stroke={colors.white} strokeWidth={2} strokeLinecap="round" fill="none" /></Svg>
        </PressableScale>
      </View>
      <Text style={s.footCap}>
        {e.locked
          ? (unlocking ? '나머지 답을 쓰고 있어요' : `${cost}알로 열면 ${hours}시간 동안 ${limit}번 이어서 물어볼 수 있어요`)
          : `${e.followUpsLeft}번 더 물어볼 수 있어요${e.followUpUntil ? ` · ${kstTime(e.followUpUntil)}까지` : ''}`}
      </Text>
    </>
  ) : (
    <>
      <Text style={[txt.caption, { textAlign: 'center', marginBottom: 8 }]}>이 상담의 이어 묻기는 끝났어요</Text>
      <PrimaryButton label="새 고민 상담하기" variant="soft" onPress={() => nav.navigate('Tabs', { screen: 'Consult' })} />
    </>
  );

  return (
    <Screen title="고민 상담" back sky scroll={false}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={[txt.caption, { textAlign: 'center' }]}>{C.label} 고민 · {kstDate(e.createdAt)} · 나만 볼 수 있어요</Text>
          {e.question ? <MyBubble at={e.createdAt}>{e.question}</MyBubble> : null}

          <Counselor>
            <Text style={s.eyebrow}>{C.label} 고민에 대한 답</Text>
            <View style={s.headline}><Text style={s.headlineV}>{e.answer.headline}</Text></View>
            <View style={s.direct}><Text style={s.directV}>{e.answer.direct}</Text></View>
            {full ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                <View style={[s.fact, { backgroundColor: colors.heroBg }]}><Text style={[s.factT, { color: colors.white }]}>{full.facts.modeLabel}</Text></View>
                <View style={s.fact}><Text style={s.factT}>풀리는 달 {full.facts.bestMonth}</Text></View>
              </View>
            ) : null}
            <Text style={s.replyText}>{e.answer.empathy}</Text>
            {e.locked && hook && !unlocking ? <Cliff hook={hook} /> : null}
          </Counselor>

          {full ? (
            <FullAnswer answer={full.answer} facts={full.facts} label={C.label} />
          ) : unlocking ? (
            <ReplyBubble typing={STAGES.rest} />
          ) : (
            <LockedRest teaser={e.teaser ?? null} cost={cost} points={points} hours={hours} limit={limit} onUnlock={() => setUnlockOpen(true)} />
          )}

          {e.helpLines?.length ? <HelpLines lines={e.helpLines} /> : null}

          {turns.map(t => (
            <View key={t.createdAt}>
              <MyBubble at={t.createdAt}>{t.question}</MyBubble>
              <ReplyBubble at={t.createdAt}>{t.reply}</ReplyBubble>
            </View>
          ))}
          {sending ? (
            <>
              <MyBubble>{sending}</MyBubble>
              <ReplyBubble typing={STAGES.reply} />
            </>
          ) : null}
          {crisis ? <HelpLines lines={crisis} crisis /> : null}

          {!sending && !unlocking && (e.locked || canAsk) ? (
            <SuggestionChips
              items={suggestions}
              caption={e.locked ? `궁금한 질문을 누르면 ${cost}알로 열고 바로 답해 드려요` : '이어서 물어보기'}
              onPick={send}
            />
          ) : null}

          {full ? <LockCard title={rec.title} desc={rec.desc} item={rec.item} onPress={() => nav.navigate(rec.to[0] as never, rec.to[1] as never)} /> : null}

          <PressableScale onPress={() => setDel(true)} hitSlop={8} style={{ alignSelf: 'center', marginTop: 24 }}>
            <Text style={s.delete}>이 상담 기록 지우기</Text>
          </PressableScale>
          <Text style={[txt.caption, { textAlign: 'center', marginTop: 12 }]}>재미와 참고를 위한 상담이에요. {e.expiresAt ? `${kstDate(e.expiresAt)}에 자동으로 지워져요.` : ''}</Text>
        </ScrollView>
        <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 10) }]}>{footer}</View>
      </KeyboardAvoidingView>

      <BottomSheet visible={unlockOpen} onClose={closeUnlock}>
        <Text style={[txt.caption, { textAlign: 'center' }]}>고민 상담</Text>
        {pendingQ ? (
          <>
            <View style={s.pendingQ}><Text style={s.pendingQText} numberOfLines={3}>{pendingQ}</Text></View>
            <Text style={[txt.h2, { textAlign: 'center', marginTop: 12 }]}>열고 이 질문에 바로 답해 드릴게요</Text>
          </>
        ) : (
          <Text style={[txt.h2, { textAlign: 'center', marginTop: 6 }]}>{cost}알로 전부 열까요?</Text>
        )}
        <Text style={[txt.small, { textAlign: 'center', marginTop: 8 }]}>사주로 본 나 · 3개월 흐름 · 해 볼 것과 피할 것 · 행동하기 좋은 날{'\n'}그리고 {hours}시간 동안 {limit}번 이어서 물어볼 수 있어요.</Text>
        <PrimaryButton label={`${cost}${ro(cost)} 열기`} icon={<Coin size={18} />} onPress={unlock} style={{ marginTop: 20 }} />
        <Balance cost={cost} points={points} />
        <PrimaryButton label="취소" variant="soft" onPress={closeUnlock} style={{ marginTop: 8 }} />
      </BottomSheet>
      <BottomSheet visible={del} onClose={() => setDel(false)}>
        <Text style={[txt.h2, { textAlign: 'center' }]}>상담 기록을 지울까요?</Text>
        <Text style={[txt.small, { textAlign: 'center', marginTop: 8 }]}>고민 글과 답변, 이어서 나눈 대화가 바로 지워지고 되돌릴 수 없어요.</Text>
        <PrimaryButton label="지우기" onPress={remove} style={{ marginTop: 20 }} />
        <PrimaryButton label="취소" variant="soft" onPress={() => setDel(false)} style={{ marginTop: 8 }} />
      </BottomSheet>
    </Screen>
  );
}

/** 미리보기의 마지막 말 — 상담가가 나머지를 꺼내려다 가려진다 */
function Cliff({ hook }: { hook: string }) {
  return (
    <View accessibilityLabel={`${hook} 이어지는 말은 잠겨 있어요`}>
      <Text style={s.replyText}>{hook}</Text>
      <View style={{ gap: 8, marginTop: 10 }}>
        {CLIFF_LINES.map((w, i) => <View key={i} style={[s.cliffLine, { width: w, opacity: 1 - i * 0.3 }]} />)}
      </View>
    </View>
  );
}

const CLIFF_LINES = ['94%', '82%', '58%'] as const;

/** 보유 알 — 이미 가진 알로 열 수 있는지 */
function Balance({ cost, points }: { cost: number; points: number }) {
  return (
    <Text style={[txt.caption, { textAlign: 'center', marginTop: 8 }]}>
      보유 {fmtN(points)}알 · {points >= cost ? '바로 열 수 있어요' : `${fmtN(cost - points)}알 충전하면 열 수 있어요`}
    </Text>
  );
}

/** 무료 미리보기에서 잠긴 부분 — 내 사주의 일부(이번 달 흐름 · 이어진 기운)와 함께 무엇이 열리는지 보여 준다 */
function LockedRest({ teaser: T, cost, points, hours, limit, onUnlock }: { teaser: ConsultTeaser | null; cost: number; points: number; hours: number; limit: number; onUnlock(): void }) {
  // 잠긴 사주 일부를 보여 주면 목록에서는 그 항목을 뺀다
  const rows = [
    ...(T ? [] : ['사주로 본 나', '지금의 흐름 · 앞으로 3개월']),
    '이렇게 해 보세요 3가지', '이것만은 피하세요',
    ...(T ? [] : ['행동하기 좋은 날']),
    `${hours}시간 동안 ${limit}번 이어 묻기`,
  ];
  return (
    <GradientBorder outer={{ marginTop: 24 }} style={s.locked}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={s.lockIco}><Icon name="lock" size={18} color={colors.accent} /></View>
        <Text style={[s.lockTitle, { flex: 1 }]}>나머지 답이 기다리고 있어요</Text>
      </View>
      {T ? (
        <View style={s.peek}>
          <View style={s.peekRow}>
            <Text style={s.peekK}>이번 달 흐름</Text>
            <View style={[s.fact, { backgroundColor: colors.heroBg }]}><Text style={[s.factT, { color: colors.white }]}>{T.modeLabel}</Text></View>
          </View>
          <View style={s.peekRow}>
            <Text style={s.peekK}>고민과 이어진 기운</Text>
            <View style={[s.fact, { backgroundColor: colors.accentSoft }]}><Text style={s.factT}>{T.relatedStarName}</Text></View>
          </View>
          <Text style={[s.peekK, { marginTop: 6 }]}>앞으로 3개월 · 가장 풀리는 달은?</Text>
          <View style={s.peekBars}>
            {T.months.map(m => (
              <View key={m} style={s.peekBarCol}>
                <Text style={s.peekBarV}>?</Text>
                <View style={[s.peekBarW, s.peekBar]} />
                <Text style={txt.caption}>{m}</Text>
              </View>
            ))}
          </View>
          <Text style={[s.peekK, { marginTop: 6 }]}>행동하기 좋은 날 {T.goodDayCount}일</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {Array.from({ length: T.goodDayCount }, (_, i) => (
              <View key={i} style={s.peekDayBox}><Icon name="lock" size={14} color={colors.inkMute} /></View>
            ))}
          </View>
        </View>
      ) : null}
      <View style={{ gap: 10, marginTop: 12, paddingLeft: 22 }}>
        {rows.map(r => (
          <View key={r} style={s.lockRow}>
            <View style={s.lockDot} />
            <Text style={s.lockText}>{r}</Text>
          </View>
        ))}
      </View>
      <PrimaryButton small label={`${cost}${ro(cost)} 전부 열기`} icon={<Coin size={16} />} onPress={onUnlock} style={{ marginTop: 16 }} />
      <Balance cost={cost} points={points} />
    </GradientBorder>
  );
}

/** 흐름 막대 높이 — 68점 44 · 85점 67 (디자인) */
const barH = (score: number) => Math.max(8, Math.round((score - 35) * 4 / 3));

/** "11/6 (금)" → ["11/6", "금요일"] */
const splitDay = (label: string) => {
  const m = /^(.+?)\s*\((.)\)$/.exec(label);
  return m ? [m[1], `${m[2]}요일`] : [label, ''];
};

function FullAnswer({ answer: A, facts: F, label }: { answer: ConsultAnswer; facts: ConsultFacts; label: string }) {
  const mx = Math.max(...F.flow.map(f => f.score));
  return (
    <>
      <View style={[s.box, { marginTop: 24 }]}>
        <BoxHead icon={<BookIcon />} title="사주로 본 나" />
        <Text style={s.boxText}>{A.me}{'\n'}{A.star}</Text>
      </View>

      <View style={[s.box, { marginTop: 16 }]}>
        <BoxHead icon={<TrendIcon />} title="지금의 흐름" caption={`앞으로 3개월 · ${label} 운`} />
        <Text style={s.boxText}>{A.now}</Text>
        <View style={s.bars}>
          {F.flow.map(f => (
            <View key={f.label} style={s.barCol}>
              <Text style={[s.barV, f.score === mx && s.barTop]}>{f.score}</Text>
              <View style={[s.bar, { height: barH(f.score), backgroundColor: f.score === mx ? colors.accent : colors.surface }]} />
              <Text style={[s.barV, s.barLabel, f.score === mx && s.barTop]}>{f.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={[s.sectionT, { marginTop: 24 }]}>이렇게 해 보세요</Text>
      <View style={s.acts}>{A.dos.map(t => <Act key={t} ok>{t}</Act>)}</View>

      <Text style={[s.sectionT, { marginTop: 32 }]}>이것만은 피하세요</Text>
      <View style={s.acts}>{A.avoid.map(t => <Act key={t} ok={false}>{t}</Act>)}</View>

      <View style={[s.headRow, { marginTop: 32 }]}>
        <Text style={[s.sectionT, { letterSpacing: -0.64 }]}>행동하기 좋은 날</Text>
        <View style={s.headBar} />
        <Text style={[s.headCap, { flexShrink: 1 }]} numberOfLines={1}>앞으로 30일 중 이 고민에 힘이 실리는 날</Text>
      </View>
      <View style={s.days}>
        {F.goodDays.map(d => {
          const [date, wd] = splitDay(d.label);
          return (
            <View key={d.iso} style={s.day}>
              <Text style={s.dayDate}>{date}</Text>
              {wd ? <Text style={s.dayWd}>{wd}</Text> : null}
            </View>
          );
        })}
      </View>

      <ImageBackground source={IDIOM_BG} resizeMode="cover" style={s.closing} imageStyle={Platform.OS === 'web' ? s.closingImgWeb : s.closingImg}>
        <Text style={s.idiom}>{F.idiom[1]} · {F.idiom[0]}</Text>
        <Text style={s.idiomMean}>{F.idiom[0]} · {F.idiom[2]}.</Text>
        <Text style={s.closeText}>{A.closing}</Text>
      </ImageBackground>
    </>
  );
}

const IDIOM_BG = require('../../../assets/images/consult-idiom-bg.webp');
/** 디자인의 검정 글자 (다크 모드에선 테마 글자색) */
const INK = isDark ? colors.ink : '#000000';

/** 회색 카드 머리 — 아이콘 · 제목 (| 부제) */
function BoxHead({ icon, title, caption }: { icon: React.ReactNode; title: string; caption?: string }) {
  return (
    <View style={s.headRow8}>
      {icon}
      <Text style={s.boxT}>{title}</Text>
      {caption ? (
        <>
          <View style={s.headBar} />
          <Text style={[s.headCap, { flexShrink: 1 }]} numberOfLines={1}>{caption}</Text>
        </>
      ) : null}
    </View>
  );
}

/** 해 볼 것(파란 체크) · 피할 것(빨간 X) 한 줄 */
function Act({ ok, children }: { ok: boolean; children: string }) {
  return (
    <View style={s.act}>
      <Svg width={18} height={18} viewBox="0 0 18 18">
        <Circle cx={9} cy={9} r={9} fill={ok ? (isDark ? colors.accentSoft : '#E7F0FF') : (isDark ? colors.loveBg : '#FDE9E9')} />
        {ok
          ? <Path d="M5.154 8.959l2.289 2.242a1 1 0 001.411-.011L13 7" stroke="#1DADFE" strokeWidth={2} strokeLinecap="round" fill="none" />
          : <Path d="M12 6L6 12M6 6l6 6" stroke="#DD2828" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />}
      </Svg>
      <Text style={s.actText}>{children}</Text>
    </View>
  );
}

function BookIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <Path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" fill={colors.accent} />
    </Svg>
  );
}

function TrendIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <Path d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" fill={colors.accent} fillRule="evenodd" clipRule="evenodd" />
    </Svg>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: SCREEN_PX, paddingBottom: 24 },
  // 위 선 1px 포함 입력칸까지 12
  footer: { paddingHorizontal: SCREEN_PX, paddingTop: 11, backgroundColor: colors.cream, ...shadow.float, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderColor: isDark ? colors.line : '#EDEDED' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingVertical: 4, paddingRight: 12, paddingLeft: 14, borderRadius: radius.sm, backgroundColor: colors.card },
  input: { flex: 1, maxHeight: INPUT_MAX, paddingTop: 7, paddingBottom: 7, ...sansW('500'), fontSize: 13, lineHeight: 18, color: colors.ink, letterSpacing: -0.65 },
  sendBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
  footCap: { ...sansW('600'), fontSize: 11, lineHeight: 17, letterSpacing: -0.44, color: colors.inkMute, textAlign: 'center', marginTop: 8 },
  eyebrow: { fontSize: 12, fontWeight: '600', color: colors.inkMute, marginTop: 4 },
  direct: { padding: 12, borderRadius: radius.lg, backgroundColor: colors.card },
  directV: { ...sansW('700'), fontSize: 14, lineHeight: 24, color: colors.ink, letterSpacing: -0.5 },
  headline: { padding: 12, borderRadius: radius.lg, backgroundColor: isDark ? colors.accentSoft : '#E3F3FF' },
  headlineV: { ...sansW('700'), fontSize: 14, lineHeight: 24, color: colors.ink, letterSpacing: -0.5 },
  fact: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.card },
  factT: { fontSize: 12, fontWeight: '700', color: colors.ink },
  replyText: { fontSize: 14, lineHeight: 24, color: colors.ink, letterSpacing: -0.5 },
  locked: { padding: 12 },
  lockIco: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  lockTitle: { fontSize: 14, fontWeight: '700', color: colors.ink, letterSpacing: -0.5 },
  lockRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  lockDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  lockText: { fontSize: 13, color: colors.ink, letterSpacing: -0.5, flex: 1 },
  peek: { gap: 8, marginTop: 14, padding: 12, borderRadius: radius.lg, backgroundColor: colors.card },
  peekRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  peekK: { fontSize: 12, fontWeight: '600', color: colors.inkMute, letterSpacing: -0.5 },
  peekBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 14, height: 76 },
  // 점수는 잠겨 있으니 막대는 모두 같은 높이로 (실제 흐름처럼 보이지 않게)
  peekBar: { height: 36, backgroundColor: colors.lineStrong },
  cliffLine: { height: 12, borderRadius: 6, backgroundColor: colors.lineStrong },
  pendingQ: { alignSelf: 'center', maxWidth: '90%', marginTop: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.lg, backgroundColor: colors.accentSoft },
  pendingQText: { fontSize: 14, fontWeight: '600', color: colors.ink, letterSpacing: -0.5, textAlign: 'center' },
  // 미리보기(잠김) 막대
  peekBarCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  peekBarV: { fontFamily: fonts.serif, fontSize: 13, fontWeight: '600', color: colors.inkMute },
  peekBarW: { width: '50%', borderRadius: 6 },
  peekDayBox: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: radius.lg, backgroundColor: colors.surface },
  // 전체 답 (Figma 운픽_2_2)
  box: { padding: 16, borderRadius: radius.lg, backgroundColor: colors.card },
  headRow8: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  boxT: { ...sansW('600'), fontSize: 16, lineHeight: 20, letterSpacing: -0.8, color: INK },
  headBar: { width: 1, height: 14, backgroundColor: isDark ? colors.lineStrong : '#999999' },
  headCap: { ...sansW('500'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.inkMute },
  boxText: { ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: INK, marginTop: 7 },
  bars: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 40, marginTop: 12 },
  barCol: { width: 44, alignItems: 'center' },
  barV: { ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: INK, textAlign: 'center' },
  barTop: sansW('700'),
  barLabel: { marginTop: 4 },
  bar: { width: 44, marginTop: 8, borderRadius: 4 },
  sectionT: { ...sansW('600'), fontSize: 16, lineHeight: 19, color: INK },
  acts: { gap: 14, marginTop: 18, paddingLeft: 4 },
  act: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  actText: { flex: 1, ...sansW('600'), fontSize: 12, lineHeight: 18, letterSpacing: -0.48, color: INK },
  days: { flexDirection: 'row', gap: 16, marginTop: 18 },
  day: { flex: 1, height: 63, alignItems: 'center', paddingTop: 12, borderRadius: radius.lg, backgroundColor: isDark ? colors.loveBg : '#FFE7E7' },
  dayDate: { ...sansW('700'), fontSize: 18, lineHeight: 21, letterSpacing: -0.72, color: isDark ? colors.love : '#DD2828' },
  dayWd: { ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.inkMute },
  closing: { marginTop: 16, minHeight: 140, paddingTop: 20, paddingBottom: 24, paddingHorizontal: 24, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#1B2440' },
  closingImg: { borderRadius: radius.lg },
  closingImgWeb: { width: '100%', height: '100%', borderRadius: radius.lg }, // 웹은 크기를 안 주면 그림 원래 크기로 그린다
  idiom: { ...sansW('700'), fontSize: 22, lineHeight: 26, letterSpacing: -1.1, color: '#FFFFFF' },
  idiomMean: { ...sansW('400'), fontSize: 11, lineHeight: 18, letterSpacing: -0.55, color: '#DDDDDD', marginTop: 8 },
  closeText: { ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: '#FFFFFF', marginTop: 8, marginRight: 42 },
  delete: { fontSize: 13, fontWeight: '600', color: colors.inkMute, textDecorationLine: 'underline' },
});
