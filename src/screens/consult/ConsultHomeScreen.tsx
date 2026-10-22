import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
import { CONSULT_CONFIG, catOf, guessCat } from '../../services/content/consult';
import { ConsultListKind, ConsultView, HelpLine, consultApi, consultKeys, useConsultStatus } from '../../services/server/consultApi';
import { useOpened } from '../../services/content/opened';
import { startAsk } from './pendingAsk';
import { colors, isDark } from '../../theme/colors';
import { radius, SCREEN_PX, txt } from '../../theme/typography';
import { ConsultRows, HelpLines, WEB_ONE_ROW, useWebAutoGrow } from './parts';
import WorryMarquee from './WorryMarquee';

const TODAY_BG = isDark ? (['#15202B', '#172636', '#1B3348'] as const) : (['#F7FCFF', '#EFF9FF', '#CBECFE'] as const);

const EXAMPLES = [
  '헤어진 지 3개월, 아직도 연락할지 말지 매일 고민돼요',
  '회사가 너무 힘든데 지금 퇴사해도 괜찮을까요?',
  '썸 타는 사람이 있는데 먼저 고백해도 될까요?',
  '친한 친구에게 서운한 게 쌓였는데 말해야 할까요?',
  '부모님과 자꾸 부딪히는데 어떻게 해야 할까요?',
  '모아 둔 돈으로 이사를 할지 더 모을지 고민이에요',
];

/** 상담 탭 — 상담가가 먼저 말을 걸고, 아래 입력창에 고민을 보낸다(하루 5번 무료 미리보기). 지난 상담으로 돌아가 이어서 묻는다 */
export default function ConsultHomeScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user: u, account, fortune } = useApp();
  const fortuneOpened = useOpened('fortune').opened; // 뽑기 전엔 요약 대신 홈으로 뽑으러 가게 한다
  const { points, toast } = usePremium();
  const input = useRef<TextInput>(null);
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
            <Mascot size={56} />
            <Text style={s.greet}>{u.nickname}님, 요즘 마음에 걸리는 일이 있나요?{'\n'}편하게 얘기해 주시면 사주로 같이 살펴볼게요.</Text>
          </View>
          {fortune && fortuneOpened ? (
            <LinearGradient colors={TODAY_BG} locations={[0, 0.63, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.today}>
              <Text style={s.todayK}>오늘 {u.nickname}님의 기운</Text>
              <Text style={s.todayV} numberOfLines={2}>{fortune.combined.summary}</Text>
            </LinearGradient>
          ) : fortune ? (
            <PressableScale onPress={() => nav.navigate('Home')} scaleTo={0.98} accessibilityLabel="홈에서 오늘의 운세 뽑기">
              <LinearGradient colors={TODAY_BG} locations={[0, 0.63, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.today}>
                <Text style={s.todayK}>오늘 {u.nickname}님의 기운</Text>
                <Text style={s.todayV}>아직 오늘의 운세를 안 뽑았어요. 홈에서 뽑아 보세요 ›</Text>
              </LinearGradient>
            </PressableScale>
          ) : null}

          {/* 눌러서 입력창에 채운다 — 두 줄이 서로 반대로 흘러간다 */}
          <Text style={s.exampleK}>다른 분들은 이런 걸 많이 물어봐요</Text>
          <View style={{ gap: 8 }}>
            <WorryMarquee items={EXAMPLES.slice(0, 3)} onPick={pickExample} />
            <WorryMarquee items={EXAMPLES.slice(3)} onPick={pickExample} reverse />
          </View>

          {crisis ? <HelpLines lines={crisis} crisis /> : null}

          {section('open', '이어서 이야기하기', openQ.data)}
          {section('past', '지난 상담', pastQ.data)}

          <Text style={[s.note, { marginTop: 24 }]}>나만 볼 수 있어요. 1년 뒤 자동 삭제됩니다.</Text>
        </ScrollView>

        {/* 채팅처럼 아래에서 입력한다 — 판 없이 입력창만 두고, 안내는 그 위 한 줄로 */}
        <View style={s.footer}>
          <View style={s.between}>
            {/* 무료 상담권은 티켓처럼 남은 장수로 — 마지막 한 장이면 다음부터 알이 쓰인다고 미리 알려 준다 */}
            <View style={s.hintRow}>
              {free ? (
                <View style={s.ticket} accessibilityLabel={`오늘 무료 상담권 ${perDay}장 중 ${freeLeft}장 남음`}>
                  <Icon name="ticket" size={14} color={colors.accent} strokeWidth={2} />
                  <Text style={s.ticketText}>무료 상담권 {freeLeft}/{perDay}</Text>
                </View>
              ) : null}
              <Text style={s.hint} numberOfLines={1}>
                {cat ? `${catOf(cat).label} 고민으로 읽었어요` : free ? (freeLeft === 1 ? '오늘 마지막 무료 상담권이에요' : '') : `${cost}알로 상담${account ? ` · 보유 ${fmtP(points)}` : ''}`}
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
              <Icon name="arrowUp" size={18} color={colors.white} strokeWidth={2.4} />
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
const HOME_ROWS = 10;

const s = StyleSheet.create({
  content: { paddingHorizontal: SCREEN_PX, paddingTop: 8, paddingBottom: 24 },
  intro: { alignItems: 'center', gap: 12, marginTop: 8 },
  greet: { fontSize: 15, lineHeight: 24, fontWeight: '500', color: colors.ink, letterSpacing: -0.5, textAlign: 'center' },
  today: { gap: 4, marginTop: 20, paddingVertical: 12, paddingHorizontal: 16, borderRadius: radius.lg },
  todayK: { fontSize: 14, fontWeight: '700', color: colors.ink, letterSpacing: -0.5 },
  todayV: { fontSize: 13, lineHeight: 18, color: colors.ink, letterSpacing: -0.6 },
  exampleK: { fontSize: 13, fontWeight: '600', color: colors.inkMute, marginTop: 28, marginBottom: 10 },
  footer: { paddingHorizontal: SCREEN_PX, paddingTop: 4, paddingBottom: 10 },
  between: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 6, paddingHorizontal: 4 },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  hint: { fontSize: 12, lineHeight: 16, color: colors.inkMute, letterSpacing: -0.6, flexShrink: 1 },
  ticket: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.pill, backgroundColor: colors.accentSoft },
  ticketText: { fontSize: 12, lineHeight: 16, fontWeight: '700', color: colors.accent, letterSpacing: -0.4 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingVertical: 4, paddingRight: 4, paddingLeft: 14, borderRadius: radius.sm, backgroundColor: colors.card },
  input: { flex: 1, minHeight: 40, maxHeight: INPUT_MAX, paddingTop: 10, paddingBottom: 10, fontSize: 14, lineHeight: 20, color: colors.ink, letterSpacing: -0.5 },
  sendBtn: { width: 32, height: 32, margin: 4, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
  note: { fontSize: 12, lineHeight: 16, color: colors.inkMute, letterSpacing: -0.6, textAlign: 'center', marginTop: 6 },
});
