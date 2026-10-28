import React, { useRef, useState } from 'react';
import { ImageBackground, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View, type TextInputInstance } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { NativeStackNavigationProp, useNavigation } from '@/navigation/compat';
import Screen from '../../components/Screen';
import Icon from '../../components/Icon';
import { PointPill } from '../../components/HeaderPoints';
import { LinearGradient } from 'expo-linear-gradient';
import PrimaryButton from '../../components/PrimaryButton';
import PressableScale from '../../components/PressableScale';
import Mascot from '../../components/Mascot';
import BottomSheet from '../../components/BottomSheet';
import SectionHeader from '../../components/SectionHeader';
import { useApp } from '../../context/AppContext';
import { usePremium } from '../../context/PremiumContext';
import { RootStackParamList } from '../../navigation/types';
import { fmtP } from '../../services/premium/catalog';
import { CONSULT_CONFIG, guessCat } from '../../services/content/consult';
import { ConsultListKind, ConsultView, HelpLine, consultApi, consultKeys, useConsultStatus } from '../../services/server/consultApi';
import { useOpened } from '../../services/content/opened';
import { startAsk } from './pendingAsk';
import { colors, isDark } from '../../theme/colors';
import { radius, SCREEN_PX, txt } from '../../theme/typography';
import { ConsultRows, HelpLines, WEB_ONE_ROW, useWebAutoGrow } from './parts';
import WorryMarquee from './WorryMarquee';

const TODAY_BG = ['#15202B', '#172636', '#1B3348'] as const;
const TODAY_IMG = require('../../../assets/images/consult-today.webp');

/** 오늘의 기운 카드 바탕 — 밝은 화면은 디자인의 구름 그림, 어두운 화면은 같은 하늘색 결의 그라데이션 */
function TodayCard({ children }: { children: React.ReactNode }) {
  if (isDark) return <LinearGradient colors={TODAY_BG} locations={[0, 0.63, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.today}>{children}</LinearGradient>;
  return <ImageBackground source={TODAY_IMG} resizeMode="cover" style={s.today} imageStyle={Platform.OS === 'web' ? s.todayImg : s.todayImgNative}>{children}</ImageBackground>;
}

const EXAMPLES = [
  '헤어진 지 3개월, 아직도 연락할지 말지 매일 고민돼요',
  '회사가 너무 힘든데 지금 퇴사해도 괜찮을까요?',
  '썸 타는 사람이 있는데 먼저 고백해도 될까요?',
  '친한 친구에게 서운한 게 쌓였는데 말해야 할까요?',
  '부모님과 자꾸 부딪히는데 어떻게 해야 할까요?',
  '모아 둔 돈으로 이사를 할지 더 모을지 고민이에요',
];
// 세 줄에 두 개씩 — 디자인처럼 첫째·넷째, 둘째·다섯째, 셋째·여섯째를 한 줄에
const EXAMPLE_ROWS = [0, 1, 2].map(i => [EXAMPLES[i], EXAMPLES[i + 3]]);

/** 상담 탭 — 상담가가 먼저 말을 걸고, 아래 입력창에 고민을 보낸다(하루 5번 무료 미리보기). 지난 상담으로 돌아가 이어서 묻는다 */
export default function ConsultHomeScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user: u, account, fortune } = useApp();
  const fortuneOpened = useOpened('fortune').opened; // 뽑기 전엔 요약 대신 홈으로 뽑으러 가게 한다
  const { points, toast } = usePremium();
  const input = useRef<TextInputInstance>(null);
  const [text, setText] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [swapTo, setSwapTo] = useState<string | null>(null);
  const [crisis, setCrisis] = useState<HelpLine[] | null>(null);
  const status = useConsultStatus(!!account);
  // 각각 앞의 HOME_ROWS개만 보이고, 하나 더 받아 와서 넘치면 '더보기'로 목록 화면을 연다
  const head = (kind: ConsultListKind) => ({ queryKey: consultKeys.head(kind), queryFn: () => consultApi.list({ kind, limit: HOME_ROWS + 1 }), enabled: !!account });
  const openQ = useQuery(head('open'));
  const pastQ = useQuery(head('past'));
  useWebAutoGrow(input, text, INPUT_MAX);
  if (!u) return null;

  const cost = status.data?.cost ?? CONSULT_CONFIG.cost;
  const maxLen = status.data?.maxLength ?? CONSULT_CONFIG.maxLen;
  const limit = status.data?.followUpLimit ?? 10;
  const hours = status.data?.followUpHours ?? 24;
  // 로그인 전에도 '무료'로 보여 준다 (가입하면 바로 쓸 수 있다)
  const perDay = status.data?.freePerDay ?? 5;
  const freeLeft = account ? status.data?.freeLeft ?? perDay : perDay;
  const free = freeLeft > 0;

  // 주제는 글에서 추측해 서버에 함께 보낸다 (서버가 다시 판단한다)
  const cat = text.trim() ? guessCat(text) : null;
  const onText = (t: string) => { setText(t); setCrisis(null); };
  const fillExample = (ex: string) => { onText(ex); input.current?.focus(); };
  const pickExample = (ex: string) => {
    if (!text.trim() || text === ex) return fillExample(ex);
    setSwapTo(ex);
  };
  const len = text.trim().length;
  const ok = len >= CONSULT_CONFIG.minLen;

  const start = () => {
    if (!ok) return;
    if (!account) { toast('로그인하면 상담받을 수 있어요'); router.push('/login'); return; }
    if (free) ask();
    else setConfirm(true);
  };
  // 포인트가 모자라도 서버에 보낸다: 위기 신호가 있으면 포인트와 상관없이 상담 전화를 안내받아야 한다.
  // 답은 대화 화면에서 기다린다 (내 고민이 먼저 보이고 상담가가 답을 쓰는 중)
  const ask = () => {
    setConfirm(false);
    const key = startAsk(text.trim(), cat ?? undefined);
    setText(''); setCrisis(null);
    input.current?.blur();
    nav.push('ConsultChat', { id: 'new', ask: key });
  };

  const openChat = (e: ConsultView) => nav.push('ConsultChat', { id: String(e.id) });
  const section = (kind: ConsultListKind, title: string, rows: ConsultView[] | undefined) => (rows?.length ? (
    <>
      <SectionHeader
        title={title}
        action={rows.length > HOME_ROWS ? '더보기' : undefined} showAction
        onAction={() => nav.push('ConsultHistory', { kind })}
      />
      <ConsultRows rows={rows.slice(0, HOME_ROWS)} onOpen={openChat} />
    </>
  ) : null);

  return (
    <Screen largeTitle="상담" right={<PointPill />} scroll={false}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={s.intro}>
            <Mascot size={80} />
            <Text style={s.greet}>{u.nickname}님, 요즘 마음에 걸리는 일이 있나요?{'\n'}편하게 얘기해 주시면 사주로 같이 살펴볼게요.</Text>
          </View>
          {fortune && fortuneOpened ? (
            <TodayCard>
              <Text style={s.todayK}>오늘 {u.nickname}님의 기운</Text>
              <Text style={s.todayV} numberOfLines={2}>{fortune.combined.summary}</Text>
            </TodayCard>
          ) : fortune ? (
            <PressableScale onPress={() => nav.navigate('Home')} scaleTo={0.98} accessibilityLabel="홈에서 오늘의 운세 뽑기">
              <TodayCard>
                <Text style={s.todayK}>오늘 {u.nickname}님의 기운</Text>
                <Text style={s.todayV}>아직 오늘의 운세를 안 뽑았어요. 홈에서 뽑아 보세요 ›</Text>
              </TodayCard>
            </PressableScale>
          ) : null}

          {/* 눌러서 입력창에 채운다 — 세 줄이 번갈아 반대로 흘러간다 */}
          <Text style={s.exampleK}>다른 분들은 이런 걸 많이 물어봐요</Text>
          <View style={{ gap: 12 }}>
            {EXAMPLE_ROWS.map((items, i) => <WorryMarquee key={i} items={items} onPick={pickExample} reverse={i === 1} />)}
          </View>

          {crisis ? <HelpLines lines={crisis} crisis /> : null}

          {section('open', '이어서 이야기하기', openQ.data)}
          {section('past', '지난 상담', pastQ.data)}

          <Text style={[s.note, { marginTop: 12 }]}>나만 볼 수 있어요. 1년 뒤 자동 삭제됩니다.</Text>
        </ScrollView>

        {/* 채팅처럼 아래에서 입력한다 — 판 없이 입력창만 두고, 안내는 그 위 한 줄로 */}
        <View style={s.footer}>
          {/* 스크롤 내용이 안내 줄에서 탁 잘리지 않게 위로 바탕색 페이드 */}
          <LinearGradient pointerEvents="none" colors={FOOTER_FADE} style={s.fade} />
          <View style={s.between}>
            {/* 오늘 남은 무료 상담 횟수 — 마지막 한 번이면 다음부터 알이 쓰인다고 미리 알려 준다 */}
            <View style={s.hintRow}>
              {free ? (
                <View style={s.hintRow} accessibilityLabel={`오늘 무료 상담 ${perDay}회 중 ${freeLeft}회 남음`}>
                  <Text style={s.freeK}>오늘 무료상담</Text>
                  <View style={s.ticket}><Text style={s.ticketText}>{freeLeft}회 남음</Text></View>
                </View>
              ) : null}
              <Text style={s.hint} numberOfLines={1}>
                {free ?(freeLeft === 1 ? '오늘 마지막 무료 상담이에요' : '') : `${cost}알로 상담${account ? ` · 보유 ${fmtP(points)}` : ''}`}
              </Text>
            </View>
            {len ? <Text style={[s.hint, len >= maxLen && { color: colors.danger }]}>{len}/{maxLen}</Text> : null}
          </View>
          <View style={s.inputRow}>
            <TextInput
              ref={input} value={text} onChangeText={onText} multiline maxLength={maxLen} {...WEB_ONE_ROW}
              placeholder="지금 마음에 걸리는 일을 편하게 적어주세요" placeholderTextColor={colors.inkMute}
              style={[s.input, Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)]} accessibilityLabel="고민 내용"
            />
            <PressableScale onPress={start} disabled={!ok} style={[s.sendBtn, !ok && { opacity: 0.4 }]} scaleTo={0.9} accessibilityLabel={free ? '무료로 상담받기' : `${cost}알로 상담받기`}>
              <View style={{ transform: [{ rotate: '-45deg' }], marginLeft: 2, marginBottom: 2 }}><Icon name="send" size={20} color={colors.white} strokeWidth={1.8} /></View>
            </PressableScale>
          </View>
        </View>
      </KeyboardAvoidingView>

      <BottomSheet visible={confirm} onClose={() => setConfirm(false)}>
        <Text style={[txt.caption, { textAlign: 'center' }]}>고민 상담</Text>
        <Text style={[txt.h2, { textAlign: 'center', marginTop: 6 }]}>{cost}알로 상담받을까요?</Text>
        <Text style={[txt.small, { textAlign: 'center', marginTop: 8 }]}>오늘 무료 상담권 {perDay}장을 다 썼어요.{'\n'}답을 받은 뒤 {hours}시간 동안 {limit}번 더 물어볼 수 있어요.{'\n'}답변이 만들어진 뒤에만 알이 쓰여요.</Text>
        <PrimaryButton label="상담받기" onPress={ask} style={{ marginTop: 20 }} />
        <PrimaryButton label="취소" variant="soft" onPress={() => setConfirm(false)} style={{ marginTop: 8 }} />
      </BottomSheet>

      <BottomSheet visible={swapTo !== null} onClose={() => setSwapTo(null)}>
        <Text style={[txt.h2, { textAlign: 'center' }]}>예시로 바꿀까요?</Text>
        <Text style={[txt.small, { textAlign: 'center', marginTop: 8 }]}>지금 적은 내용은 지워져요.</Text>
        <PrimaryButton label="바꾸기" onPress={() => { if (swapTo) fillExample(swapTo); setSwapTo(null); }} style={{ marginTop: 20 }} />
        <PrimaryButton label="취소" variant="soft" onPress={() => setSwapTo(null)} style={{ marginTop: 8 }} />
      </BottomSheet>
    </Screen>
  );
}

const INPUT_MAX = 120;
const TICKET_INK = isDark ? colors.accent : 'rgba(0, 163, 255, 0.8)'; // 디자인: #00A3FF 80%
const HOME_ROWS = 10;
const FOOTER_FADE = [`${colors.cream}00`, colors.cream] as const;

const s = StyleSheet.create({
  content: { paddingHorizontal: SCREEN_PX, paddingTop: 8, paddingBottom: 24 },
  intro: { alignItems: 'center', gap: 12, marginTop: 8 },
  greet: { fontSize: 13, lineHeight: 20, fontWeight: '500', color: colors.ink, letterSpacing: -0.65, textAlign: 'center' },
  today: { gap: 5, minHeight: 72, marginTop: 28, padding: 16, borderRadius: radius.lg, overflow: 'hidden' },
  todayImg: { width: '100%', height: '100%', borderRadius: radius.lg }, // 웹은 크기를 안 주면 그림 원래 크기로 그린다
  // 네이티브는 그림이 이미 카드를 꽉 채운다. 100%를 주면 카드 안쪽 여백을 뺀 크기로 줄어 왼쪽 위에만 깔린다
  todayImgNative: { borderRadius: radius.lg },
  todayK: { fontSize: 14, lineHeight: 17, fontWeight: '700', color: colors.ink, letterSpacing: -0.56 },
  todayV: { fontSize: 13, lineHeight: 18, color: colors.ink, letterSpacing: -0.65 },
  exampleK: { fontSize: 13, fontWeight: '600', color: colors.inkMute, marginTop: 28, marginBottom: 10 },
  footer: { paddingHorizontal: SCREEN_PX, paddingTop: 4, paddingBottom: 18, backgroundColor: colors.cream },
  fade: { position: 'absolute', left: 0, right: 0, top: -28, height: 28 },
  between: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 8 },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  freeK: { fontSize: 12, lineHeight: 16, fontWeight: '600', color: colors.inkMute, letterSpacing: -0.6 },
  hint: { fontSize: 12, lineHeight: 16, color: colors.inkMute, letterSpacing: -0.6, flexShrink: 1 },
  ticket: { paddingHorizontal: 4, paddingVertical: 2, borderRadius: radius.xs, backgroundColor: colors.accentSoft },
  ticketText: { fontSize: 12, lineHeight: 16, fontWeight: '600', color: TICKET_INK },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingRight: 8, paddingLeft: 14, borderRadius: radius.sm, backgroundColor: colors.card },
  input: { flex: 1, minHeight: 40, maxHeight: INPUT_MAX, paddingTop: 11, paddingBottom: 11, fontSize: 13, lineHeight: 18, color: colors.ink, letterSpacing: -0.65 },
  sendBtn: { width: 32, height: 32, margin: 4, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
  note: { fontSize: 12, lineHeight: 16, color: colors.inkMute, letterSpacing: -0.6, textAlign: 'center', marginTop: 6 },
});
