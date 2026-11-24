import React, { useEffect, useState } from 'react';
import { ImageBackground, Platform, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useQuery } from '@tanstack/react-query';
import { NativeStackNavigationProp, RouteProp, useNavigation, useRoute } from '@/navigation/compat';
import Screen from '../../components/Screen';
import PrimaryButton from '../../components/PrimaryButton';
import PressableScale from '../../components/PressableScale';
import { BodyState, LockCard } from '../../components/premium/Kit';
import BottomSheet from '../../components/BottomSheet';
import LoadingScreen from '../../components/LoadingScreen';
import { useApp } from '../../context/AppContext';
import { usePremium } from '../../context/PremiumContext';
import { RootStackParamList } from '../../navigation/types';
import { catOf } from '../../services/content/consult';
import { ConsultAnswer, ConsultFacts, consultApi, consultKeys, isFullAnswer, sourceView } from '../../services/server/consultApi';
import { queryClient } from '../../api/query';
import { ApiError } from '../../api/client';
import { colors, isDark } from '../../theme/colors';
import { radius, sansW, txt } from '../../theme/typography';
import { StreamBlock, StreamText } from '../../components/Stream';
import { ChatHeaderLeft } from './ChatMenu';
import ChatTalk, { SourceBanner } from './ChatTalk';
import { PointPill } from '../../components/HeaderPoints';
import { Counselor, MyBubble, ReplyBubble, STAGES, TOPIC_REC, kstDate } from './parts';
import { dropAsk, getAsk, startAsk } from './pendingAsk';
import { goLogin } from '../../services/loginIntent';
import { trackAction } from '../../services/screenViews';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const HEADLINE_BACKGROUND = require('../../../assets/figma/consult/headline-background.svg');


const ASK_ERROR: Record<string, string> = {
  CONSULT_UNAVAILABLE: '지금은 답을 만들지 못했어요. 알은 쓰이지 않았어요. 잠시 후 다시 시도해 주세요',
  DUPLICATE_REQUEST: '이미 답을 쓰고 있어요. 잠시만 기다려 주세요',
  INSUFFICIENT_POINTS: '이야기하는 데 쓸 알이 모자라요. 충전한 뒤 다시 시도해 주세요',
  MEMBER_ONLY: '로그인하면 이어서 이야기할 수 있어요',
};

/** 운알톡 대화 (예전 고민 상담 기록은 읽기만) */
export default function ConsultChatScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'ConsultChat'>>();
  return params?.id === 'new' ? <PendingChat askKey={params.ask} /> : <Chat id={Number(params?.id)} fresh={params?.fresh === '1'} />;
}

/** 첫 답을 기다리는 대화 — 내 고민이 먼저 보이고 운알이가 답을 쓰는 중 */
function PendingChat({ askKey }: { askKey?: string }) {
  const nav = useNavigation<Nav>();
  const { goWallet } = usePremium();
  const [key, setKey] = useState(askKey);
  const [state, setState] = useState<{ kind: 'wait' } | { kind: 'error'; message: string }>({ kind: 'wait' });
  const ask = getAsk(key);
  useEffect(() => {
    if (!ask || !key) return;
    let live = true;
    ask.result.then(
      v => {
        if (!live) return;
        dropAsk(key);
        nav.replace('ConsultChat', { id: String(v.id), fresh: '1' });
      },
      err => {
        if (!live) return;
        const code = err instanceof ApiError ? err.code : '';
        if (code === 'INSUFFICIENT_POINTS') goWallet?.();
        // 게스트의 무료 대화를 이미 썼다 — 이 말을 기억해 두고 로그인으로 (로그인하면 운알톡 탭이 이어서 보낸다)
        if (code === 'MEMBER_ONLY') {
          dropAsk(key);
          trackAction('consult_ask_login_required');
          nav.goBack();
          goLogin({ kind: 'consult', worry: ask.worry, source: ask.source });
          return;
        }
        setState({ kind: 'error', message: ASK_ERROR[code] ?? ASK_ERROR.CONSULT_UNAVAILABLE });
      },
    );
    return () => { live = false; };
  }, [key]);

  const toTab = () => nav.navigate('Consult');
  if (!ask) {
    return (
      <Screen title="운알톡" titleStyle={s.chatTitle} back>
        <Text style={[txt.body, { textAlign: 'center', marginTop: 40 }]}>대화 화면을 다시 열어 주세요.</Text>
        <PrimaryButton label="운알톡으로" variant="soft" onPress={toTab} style={{ marginTop: 20 }} />
      </Screen>
    );
  }
  return (
    <Screen left={<ChatHeaderLeft />} sky right={<PointPill attendHint quiet />}>
      <Text style={[txt.caption, { textAlign: 'center' }]}>나만 볼 수 있어요</Text>
      {/* 어느 화면에서 이어진 대화인지는 답을 기다리는 동안에도 미리 보여 준다 */}
      {ask.source?.title ? <SourceBanner source={sourceView(ask.source)} /> : null}
      <MyBubble>{ask.worry}</MyBubble>
      {state.kind === 'wait' ? <ReplyBubble typing={STAGES.chat} /> : <ReplyBubble>{state.message}</ReplyBubble>}
      {state.kind === 'error' ? (
        <PrimaryButton label="다시 시도하기" onPress={() => { setState({ kind: 'wait' }); setKey(startAsk(ask.worry, ask.source)); }} style={{ marginTop: 16 }} />
      ) : null}
    </Screen>
  );
}

function Chat({ id, fresh = false }: { id: number; fresh?: boolean }) {
  const nav = useNavigation<Nav>();
  const { user: u, account } = useApp();
  const { toast } = usePremium();
  const [del, setDel] = useState(false);
  const q = useQuery({ queryKey: consultKeys.one(id), queryFn: () => consultApi.get(id), enabled: Number.isFinite(id) });

  if (!u) return null;
  if (q.isPending) return <LoadingScreen />;
  const e = q.data;
  // 운알톡 대화
  if (e?.status === 'chat') return <ChatTalk chat={e} fresh={fresh} />;
  if (!e?.answer) {
    return <Screen title="운알톡" titleStyle={s.chatTitle} back><BodyState error onRetry={q.isError ? () => q.refetch() : undefined} /></Screen>;
  }
  // 예전 고민 상담 — 읽기만 한다 (이어 묻기 · 잠금 해제 없음)
  const C = catOf(e.topic);
  const full = isFullAnswer(e.answer) && e.facts ? { answer: e.answer, facts: e.facts } : null;
  const turns = e.turns ?? [];

  const remove = async () => {
    setDel(false);
    try {
      await consultApi.remove(id);
      queryClient.removeQueries({ queryKey: consultKeys.one(id) });
      queryClient.invalidateQueries({ queryKey: consultKeys.list });
      toast('대화 기록을 지웠어요');
      nav.goBack();
    } catch {
      toast('지우지 못했어요. 잠시 후 다시 시도해 주세요');
    }
  };

  const rec = TOPIC_REC[e.topic];
  // 힘든 마음이 보인 대화에는 리포트를 권하지 않는다 (예전 서버는 suggestedReport를 안 줘서 risk로도 본다)
  const showRec = e.risk === 'none' && e.suggestedReport !== null;

  return (
    <Screen left={<ChatHeaderLeft current={id} />} sky right={<PointPill attendHint quiet />}>
      <Text style={[txt.caption, { textAlign: 'center' }]}>{e.profileNickname ? `${e.profileNickname}님 사주로 상담 · ` : ''}{C.label} 고민 · {kstDate(e.createdAt)} · 나만 볼 수 있어요</Text>
      {e.question ? <MyBubble at={e.createdAt}>{e.question}</MyBubble> : null}

      <Counselor>
        <Text style={s.eyebrow}>{`${C.label} 고민에 대한 답`}</Text>
        <View style={s.direct}><Text style={s.directV}>{e.answer.direct}</Text></View>
        <View style={s.headline}>
          {!isDark ? <Image source={HEADLINE_BACKGROUND} style={StyleSheet.absoluteFill} contentFit="fill" /> : null}
          <Text style={s.headlineV}>{e.answer.headline}</Text>
        </View>
        {full ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            <View style={[s.fact, { backgroundColor: colors.heroBg }]}><Text style={[s.factT, { color: colors.white }]}>{full.facts.modeLabel}</Text></View>
            <View style={s.fact}><Text style={s.factT}>풀리는 달 {full.facts.bestMonth}</Text></View>
          </View>
        ) : null}
        <Text style={s.replyText}>{e.answer.empathy}</Text>
      </Counselor>

      {full ? <FullAnswer answer={full.answer} facts={full.facts} label={C.label} /> : null}

      {turns.map(t => (
        <View key={t.createdAt}>
          <MyBubble at={t.createdAt}>{t.question}</MyBubble>
          <ReplyBubble at={t.createdAt}>{t.reply}</ReplyBubble>
        </View>
      ))}

      {full && showRec ? <LockCard title={rec.title} desc={rec.desc} item={rec.item} onPress={() => nav.navigate(rec.to[0] as never, rec.to[1] as never)} /> : null}

      <Text style={[txt.caption, { textAlign: 'center', marginTop: 28 }]}>예전 고민 상담 기록이에요. 지금은 읽기만 할 수 있어요.</Text>
      <PrimaryButton label="운알이와 새 대화 시작하기" variant="soft" onPress={() => nav.navigate('Consult')} style={{ marginTop: 10 }} />

      {/* 게스트는 지울 수 없다 (서버가 회원만 허용) — 오래 안 쓰면 게스트 정리 때 함께 지워진다 */}
      {account ? (
        <PressableScale onPress={() => setDel(true)} hitSlop={8} style={{ alignSelf: 'center', marginTop: 24 }}>
          <Text style={s.delete}>이 대화 기록 지우기</Text>
        </PressableScale>
      ) : null}
      <Text style={[txt.caption, { textAlign: 'center', marginTop: 12 }]}>참고를 위한 대화예요.</Text>

      <BottomSheet visible={del} onClose={() => setDel(false)}>
        <Text style={[txt.h2, { textAlign: 'center' }]}>대화 기록을 지울까요?</Text>
        <Text style={[txt.small, { textAlign: 'center', marginTop: 8 }]}>고민 글과 답변, 이어서 나눈 대화가 바로 지워지고 되돌릴 수 없어요.</Text>
        <PrimaryButton label="지우기" onPress={remove} style={{ marginTop: 20 }} />
        <PrimaryButton label="취소" variant="soft" onPress={() => setDel(false)} style={{ marginTop: 8 }} />
      </BottomSheet>
    </Screen>
  );
}

// 3개월 흐름 꺾은선 (Figma 492:4034 — 295×115 흰 칸)
const FLOW_H = 115;
const FLOW_PAD = 6.5; // 칸 폭을 3등분한 가운데에 점 (375 화면에서 55 · 149 · 243)
const FLOW_TOP = 41; // 가장 높은 점
const FLOW_LOW = 70; // 가장 낮을 수 있는 점
const FLOW_K = 1.2; // 1점당 px (68 → 71 → 85 가 62 → 58 → 41)
const FLOW_BASE = 90; // 점선·채움이 끝나는 곳
const FLOW_LABEL = 91; // 월 글자 위
const FLOW_BLUE = isDark ? colors.accent : '#1474FC';
const FLOW_LINE_L = isDark ? colors.accent : '#2F9FFD';
const FLOW_INK = isDark ? colors.ink : '#263245';
const FLOW_BG = isDark ? colors.surface : '#FFFFFF';

/** 지금의 흐름 — 3개월 점수 꺾은선, 가장 좋은 달은 파란 말풍선 */
function FlowChart({ flow }: { flow: ConsultFacts['flow'] }) {
  const [w, setW] = useState(0);
  const n = flow.length;
  const scores = flow.map(f => f.score);
  const max = Math.max(...scores);
  const best = scores.indexOf(max);
  const k = Math.min(FLOW_K, (FLOW_LOW - FLOW_TOP) / Math.max(1, max - Math.min(...scores)));
  const col = n ? (w - FLOW_PAD * 2) / n : 0;
  const pts = flow.map((f, i) => ({ x: FLOW_PAD + col * (i + 0.5), y: FLOW_TOP + (max - f.score) * k }));
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
  const area = n ? `${line} L${pts[n - 1].x} ${FLOW_BASE} L${pts[0].x} ${FLOW_BASE} Z` : '';
  const b = pts[best];
  return (
    <View style={s.flow} onLayout={e => setW(e.nativeEvent.layout.width)} accessible accessibilityLabel={flow.map(f => `${f.label} ${f.score}점`).join(', ')}>
      {w > 0 && n > 0 ? (
        <>
          <Svg width={w} height={FLOW_H} style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="consultFlowArea" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={FLOW_BLUE} stopOpacity={0.14} />
                <Stop offset="1" stopColor={FLOW_BLUE} stopOpacity={0} />
              </LinearGradient>
              <LinearGradient id="consultFlowLine" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={FLOW_LINE_L} />
                <Stop offset="1" stopColor={FLOW_BLUE} />
              </LinearGradient>
            </Defs>
            <Path d={area} fill="url(#consultFlowArea)" />
            {pts.map((p, i) => (
              <Line key={`g${i}`} x1={p.x} y1={p.y} x2={p.x} y2={FLOW_BASE} stroke="#BBBBBB" strokeWidth={1} strokeDasharray="2 2" />
            ))}
            <Path d={line} stroke="url(#consultFlowLine)" strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
            {pts.map((p, i) => <Circle key={`p${i}`} cx={p.x} cy={p.y} r={3.5} fill={FLOW_BG} stroke={i ? FLOW_BLUE : FLOW_LINE_L} strokeWidth={2} />)}
            <Rect x={b.x - 17.5} y={b.y - 31.5} width={35} height={18.5} rx={5} fill={FLOW_BLUE} />
            <Path d={`M${b.x - 4} ${b.y - 13.5} L${b.x} ${b.y - 9} L${b.x + 4} ${b.y - 13.5} Z`} fill={FLOW_BLUE} />
          </Svg>
          {pts.map((p, i) => (
            <Text key={`s${i}`} style={[s.flowScore, i === best ? [s.flowBubble, { top: p.y - 31.5 }] : { top: p.y - 22 }, { left: p.x - 20 }]}>{flow[i].score}</Text>
          ))}
          {pts.map((p, i) => (
            <Text key={`l${i}`} style={[s.flowScore, { left: p.x - 20, top: FLOW_LABEL }, i === best && s.flowBest]}>{flow[i].label}</Text>
          ))}
        </>
      ) : null}
    </View>
  );
}

/** "11/6 (금)" → ["11/6", "금요일"] */
const splitDay = (label: string) => {
  const m = /^(.+?)\s*\((.)\)$/.exec(label);
  return m ? [m[1], `${m[2]}요일`] : [label, ''];
};

function FullAnswer({ answer: A, facts: F, label }: { answer: ConsultAnswer; facts: ConsultFacts; label: string }) {
  return (
    <>
      <StreamBlock style={[s.box, { marginTop: 24 }]}>
        <BoxHead icon={<BookIcon />} title="사주로 본 나" />
        <StreamText style={s.boxText}>{`${A.me}\n${A.star}`}</StreamText>
      </StreamBlock>

      <StreamBlock style={[s.box, { marginTop: 16 }]}>
        <BoxHead icon={<TrendIcon />} title="지금의 흐름" caption={`앞으로 3개월 · ${label} 운`} />
        <StreamText style={s.boxText}>{A.now}</StreamText>
        <StreamBlock><FlowChart flow={F.flow} /></StreamBlock>
      </StreamBlock>

      <StreamBlock><Text style={[s.sectionT, { marginTop: 24 }]}>이렇게 해 보세요</Text></StreamBlock>
      <View style={s.acts}>{A.dos.map(t => <Act key={t} ok>{t}</Act>)}</View>

      <StreamBlock><Text style={[s.sectionT, { marginTop: 32 }]}>이것만은 피하세요</Text></StreamBlock>
      <View style={s.acts}>{A.avoid.map(t => <Act key={t} ok={false}>{t}</Act>)}</View>

      <StreamBlock style={[s.headRow, { marginTop: 32 }]}>
        <Text style={[s.sectionT, { letterSpacing: -0.64 }]}>행동하기 좋은 날</Text>
        <View style={s.headBar} />
        <Text style={[s.headCap, { flexShrink: 1 }]} numberOfLines={1}>앞으로 30일 중 이 고민에 힘이 실리는 날</Text>
      </StreamBlock>
      <StreamBlock style={s.days}>
        {F.goodDays.map(d => {
          const [date, wd] = splitDay(d.label);
          return (
            <View key={d.iso} style={s.day}>
              <Text style={s.dayDate}>{date}</Text>
              {wd ? <Text style={s.dayWd}>{wd}</Text> : null}
            </View>
          );
        })}
      </StreamBlock>

      <StreamBlock>
      <ImageBackground source={IDIOM_BG} resizeMode="cover" style={s.closing} imageStyle={Platform.OS === 'web' ? s.closingImgWeb : s.closingImg}>
        <Text style={s.idiom}>{F.idiom[1]} · {F.idiom[0]}</Text>
        <Text style={s.idiomMean}>{F.idiom[0]} · {F.idiom[2]}.</Text>
        <StreamText style={s.closeText}>{A.closing}</StreamText>
      </ImageBackground>
      </StreamBlock>
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
    <StreamBlock style={s.act}>
      <Svg width={18} height={18} viewBox="0 0 18 18">
        <Circle cx={9} cy={9} r={9} fill={ok ? (isDark ? colors.accentSoft : '#E7F0FF') : (isDark ? colors.loveBg : '#FDE9E9')} />
        {ok
          ? <Path d="M5.154 8.959l2.289 2.242a1 1 0 001.411-.011L13 7" stroke="#1DADFE" strokeWidth={2} strokeLinecap="round" fill="none" />
          : <Path d="M12 6L6 12M6 6l6 6" stroke="#DD2828" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />}
      </Svg>
      <StreamText style={s.actText}>{children}</StreamText>
    </StreamBlock>
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
  chatTitle: { ...sansW('600'), fontSize: 18, lineHeight: 22, letterSpacing: 0, color: INK },
  eyebrow: { fontSize: 12, fontWeight: '600', color: colors.inkMute, marginTop: 4 },
  direct: { padding: 12, borderRadius: radius.lg, backgroundColor: colors.card },
  directV: { ...sansW('600'), fontSize: 14, lineHeight: 24, color: INK, letterSpacing: -0.7 },
  headline: { marginRight: 8, padding: 12, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.accentSoft },
  headlineV: { ...sansW('600'), fontSize: 14, lineHeight: 24, color: INK, letterSpacing: -0.7 },
  fact: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.card },
  factT: { fontSize: 12, fontWeight: '700', color: colors.ink },
  replyText: { ...sansW('400'), fontSize: 14, lineHeight: 24, color: colors.ink, letterSpacing: -0.7, marginRight: 5 },
  // 전체 답 (Figma 운픽_2_2)
  box: { padding: 16, borderRadius: radius.lg, backgroundColor: colors.card },
  headRow8: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  boxT: { ...sansW('600'), fontSize: 16, lineHeight: 20, letterSpacing: -0.8, color: INK },
  headBar: { width: 1, height: 14, backgroundColor: isDark ? colors.lineStrong : '#999999' },
  headCap: { ...sansW('500'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.inkMute },
  boxText: { ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: INK, marginTop: 7 },
  flow: { height: FLOW_H, marginTop: 12, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: FLOW_BG },
  flowScore: { position: 'absolute', width: 40, textAlign: 'center', ...sansW('400'), fontSize: 12, lineHeight: 16, letterSpacing: -0.24, color: FLOW_INK },
  flowBubble: { ...sansW('700'), fontSize: 13, lineHeight: 18.5, color: '#FFFFFF' },
  flowBest: sansW('700'),
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
