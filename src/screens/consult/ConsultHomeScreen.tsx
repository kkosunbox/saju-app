import React, { useRef, useState } from 'react';
import { ImageBackground, Platform, ScrollView, StyleSheet, Text, TextInput, View, type TextInputInstance } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { NativeStackNavigationProp, useNavigation } from '@/navigation/compat';
import Screen from '../../components/Screen';
import Icon from '../../components/Icon';
import { PointPill } from '../../components/HeaderPoints';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import PrimaryButton from '../../components/PrimaryButton';
import PressableScale from '../../components/PressableScale';
import BottomSheet from '../../components/BottomSheet';
import SectionHeader from '../../components/SectionHeader';
import { useApp } from '../../context/AppContext';
import { usePremium } from '../../context/PremiumContext';
import { SubscriptionBadge } from '../../components/premium/SubscriptionBadge';
import { RootStackParamList } from '../../navigation/types';
import { fmtP } from '../../services/premium/catalog';
import { CONSULT_CONFIG, guessCat } from '../../services/content/consult';
import { ConsultView, consultApi, useConsultStatus } from '../../services/server/consultApi';
import { useAnyFortuneOpened, useOpened } from '../../services/content/opened';
import { startAsk } from './pendingAsk';
import { colors, isDark } from '../../theme/colors';
import { radius, SCREEN_PX, txt } from '../../theme/typography';
import { ConsultRows, WEB_ONE_ROW, useWebAutoGrow, webEnterToSend } from './parts';
import WorryMarquee from './WorryMarquee';
import { isTodayFortuneQuestion } from './FortuneChatScreen';
import { usePendingInviteSheet } from '../../components/PendingInviteSheet';
import WelcomeBonusSheet from '../../components/WelcomeBonusSheet';
import HomeNotices from './HomeNotices';
import { Logo } from '../../components/Mascot';
import { FortuneProfileChip } from '../../components/home/FortuneProfileBadge';
import { trackAction } from '../../services/screenViews';

const CONSULT_MASCOT = require('../../../assets/images/consult-mascot.webp');
const TODAY_BG = ['#15202B', '#172636', '#1B3348'] as const;
const TODAY_IMG = require('../../../assets/images/consult-today.webp');

/** 운세 카드의 구름 하늘 배경 */
function TodayCard({ children, emphasize }: { children: React.ReactNode; emphasize?: boolean }) {
  // 아직 안 본 운세는 모든 기기에서 진한 테두리로 눈에 띄게
  const border = emphasize ? s.todayEmphasized : Platform.OS !== 'ios' && s.todayHighlighted;
  if (isDark) return <LinearGradient colors={TODAY_BG} locations={[0, 0.63, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.today, border]}>{children}</LinearGradient>;
  return <ImageBackground source={TODAY_IMG} resizeMode="cover" style={[s.today, border]} imageStyle={Platform.OS === 'web' ? s.todayImg : s.todayImgNative}>{children}</ImageBackground>;
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

/**
 * 오늘의 운세 카드 — 누구 운세를 볼지 프로필을 먼저 고르고 물어본다.
 * 고른 프로필의 오늘 운세를 이미 봤으면 점수와 한 줄 요약을 보여 주고, 누르면 운알이의 답을 다시 본다
 */
function TodayFortuneCard({ onAsk }: { onAsk(): void }) {
  const { user, fortune, fortuneUser, fortuneProfileId, today } = useApp();
  const currentFortune = fortune && fortune.userId === user?.id && fortune.date === today && fortune.forProfile === fortuneProfileId
    ? fortune
    : null;
  const selectedFortune = useOpened('fortune', { profileId: fortuneProfileId, fortune: currentFortune });
  const anyFortuneOpened = useAnyFortuneOpened();
  if (!user) return null;
  const name = fortuneUser?.nickname ?? user.nickname;
  const read = selectedFortune.ready && selectedFortune.opened;
  // 프로필 전환 중에는 하단 한 줄을 비워 두고, 선택한 프로필의 응답이 오면 문구를 정한다.
  let subtitle = '\u00A0';
  if (currentFortune && selectedFortune.ready) {
    subtitle = read
      ? `${currentFortune.combined.totalScore}점 · ${currentFortune.combined.summary}`
      : '운알이가 오늘의 운세를 봐줄 거예요';
  }
  // 아직 안 본 운세 — 처음 온 사람이 지나치지 않게 카드를 키우고 채운 버튼으로 부른다
  const unread = !!currentFortune && selectedFortune.ready && !read;
  const freeDraw = anyFortuneOpened.ready && !anyFortuneOpened.opened && (currentFortune?.drawCost ?? 0) === 0;
  return (
    // 칩(프로필 고르기)이 카드 버튼 안에 들어가지 않게, 카드 전체를 덮는 버튼 위에 내용을 얹는다
    <TodayCard emphasize={unread}>
    <View style={[s.todayContent, unread && s.todayContentBig]}>
      <PressableScale onPress={onAsk} style={StyleSheet.absoluteFill} scaleTo={1} accessibilityLabel={read ? `${name}님 오늘의 운세 다시 보기` : `${name}님 오늘의 운세 ${freeDraw ? '무료로 ' : ''}보기`} />
      <View style={{ flex: 1, gap: 6 }} pointerEvents="box-none">
        <View style={s.todayHead} pointerEvents="box-none">
          <Text style={s.todayK} pointerEvents="none">오늘의 운세</Text>
          {/* 안 본 상태에서는 칩이 버튼처럼 보이지 않게 흰 바탕·그림자를 뺀다 */}
          <FortuneProfileChip style={unread ? s.todayProfileChipQuiet : s.todayProfileChip} />
        </View>
        <Text style={[s.todayV, unread && s.todayVUnread]} numberOfLines={unread ? 2 : 1} pointerEvents="none">{subtitle}</Text>
      </View>
      {unread ? (
        <View style={s.todayBtn} pointerEvents="none">
          <Text style={s.todayBtnText}>{freeDraw ? '무료로 보기' : '보기'}</Text>
          <Icon name="chevronRight" size={14} color={colors.white} strokeWidth={2.4} />
        </View>
      ) : (
        <View pointerEvents="none"><Icon name="chevronRight" size={18} color={colors.inkMute} /></View>
      )}
    </View>
    </TodayCard>
  );
}

/**
 * 첫 화면 운알톡 — 운알이가 먼저 말을 걸고, 아래 입력창에 고민을 보낸다(하루 5번 무료 미리보기).
 * 이어서 할 대화를 위에 두고, 지난 대화 전체는 '대화 기록' 탭에. 답변 아래에서 고민에 맞는 리포트로 이어진다
 */
export default function ConsultHomeScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user: u, account } = useApp();
  const { points, toast } = usePremium();
  const input = useRef<TextInputInstance>(null);
  const [text, setText] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [swapTo, setSwapTo] = useState<string | null>(null);
  const invite = usePendingInviteSheet();
  const status = useConsultStatus(!!account);
  // 최근 대화 HOME_ROWS개만 (이어서 할 것 · 끝난 것 구분 없이 최신순). 전체는 '대화 기록' 탭에서
  const recentQ = useQuery({ queryKey: ['consults', 'head', 'recent'], queryFn: () => consultApi.list({ limit: HOME_ROWS }), enabled: !!account });
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
  // 하루 무료를 다 쓰면 구독 운알톡 횟수를 알보다 먼저 쓴다 (서버가 판단)
  const sub = account ? status.data?.subscription ?? null : null;
  const viaSub = !free && !!sub && sub.left > 0;

  // 주제는 글에서 추측해 서버에 함께 보낸다 (서버가 다시 판단한다)
  const cat = text.trim() ? guessCat(text) : null;
  const onText = (t: string) => setText(t);
  const fillExample = (ex: string) => { onText(ex); input.current?.focus(); };
  const pickExample = (ex: string) => {
    if (!text.trim() || text === ex) return fillExample(ex);
    setSwapTo(ex);
  };
  const len = text.trim().length;
  const ok = len >= CONSULT_CONFIG.minLen;

  const start = () => {
    // "오늘 운세 어때?"처럼 오늘의 운세만 물으면 상담 대신 오늘의 운세로 답한다 (무료)
    if (text.trim() && isTodayFortuneQuestion(text)) { setText(''); input.current?.blur(); nav.navigate('Today'); return; }
    if (!ok) return;
    if (!account) { trackAction('consult_ask_login_required'); toast('로그인하면 운알이와 대화할 수 있어요'); router.push('/login'); return; }
    if (free || viaSub) ask();
    else setConfirm(true);
  };
  // 포인트가 모자라면 서버가 INSUFFICIENT_POINTS로 돌려주고, 대화 화면이 충전으로 안내한다.
  // 답은 대화 화면에서 기다린다 (내 고민이 먼저 보이고 운알이가 답을 쓰는 중)
  const ask = () => {
    setConfirm(false);
    trackAction('consult_ask');
    const key = startAsk(text.trim(), cat ?? undefined);
    setText('');
    input.current?.blur();
    nav.push('ConsultChat', { id: 'new', ask: key });
  };

  const openChat = (e: ConsultView) => nav.push('ConsultChat', { id: String(e.id) });
  const section = (title: string, rows: ConsultView[] | undefined) => (rows?.length ? (
    <>
      <SectionHeader
        title={title}
        action="전체 보기" showAction
        onAction={() => nav.navigate('Talks')}
      />
      <ConsultRows rows={rows.slice(0, HOME_ROWS)} onOpen={openChat} />
    </>
  ) : null);

  return (
    <Screen left={<Logo height={36} color={colors.ink} />} right={<PointPill attendHint quiet />} scroll={false}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={s.intro}>
            <Image source={CONSULT_MASCOT} style={s.mascot} contentFit="cover" />
            <Text style={s.greet}>{u.nickname}님, 요즘 마음에 걸리는 일이 있나요?{'\n'}{u.nickname}님의 사주를 아는 운알이가 함께 답을 찾아 줄게요.</Text>
          </View>
          {/* 오늘의 운세 — 고민 주제와 따로. 누구 운세를 볼지 먼저 고르고 물어본다 (무료로 바로 답) */}
          <TodayFortuneCard onAsk={() => nav.navigate('Today')} />
          <HomeNotices />
          {section('최근 대화', recentQ.data)}

          {/* 눌러서 입력창에 채운다 — 세 줄이 번갈아 반대로 흘러간다 */}
          <Text style={s.exampleK}>다른 분들은 이런 걸 많이 물어봐요</Text>
          <View style={{ gap: 12 }}>
            {EXAMPLE_ROWS.map((items, i) => <WorryMarquee key={i} items={items} onPick={pickExample} reverse={i === 1} />)}
          </View>

        </ScrollView>

        {/* 채팅처럼 아래에서 입력한다 — 판 없이 입력창만 두고, 안내는 그 위 한 줄로 */}
        <View style={s.footer}>
          {/* 스크롤 내용이 안내 줄에서 탁 잘리지 않게 위로 바탕색 페이드 */}
          <LinearGradient pointerEvents="none" colors={FOOTER_FADE} style={s.fade} />
          <View style={s.between}>
            {/* 남은 무료 횟수는 따로 보여 주지 않는다 — 마지막 한 번이면 다음부터 알이 쓰인다고만 미리 알려 준다 */}
            <View style={s.hintRow}>
              {viaSub && sub ? (
                <View style={s.hintRow} accessibilityLabel={`구독 운알톡 ${sub.total}회 중 ${sub.left}회 남음`}>
                  <SubscriptionBadge label="구독 운알톡" small />
                  <View style={s.ticket}><Text style={s.ticketText}>{sub.left}/{sub.total}회 남음</Text></View>
                </View>
              ) : null}
              <Text style={s.hint} numberOfLines={1}>
                {free
                  ? (freeLeft === 1 ? (sub && sub.left > 0 ? `다음부터 구독 ${sub.left}회에서 써요` : '오늘 마지막 무료 대화예요') : '')
                  : viaSub ? '알은 쓰지 않아요'
                  : `${cost}알로 물어보기${account ? ` · 보유 ${fmtP(points)}` : ''}`}
              </Text>
            </View>
            {len ? <Text style={[s.hint, len >= maxLen && { color: colors.danger }]}>{len}/{maxLen}</Text> : null}
          </View>
          <View style={s.inputRow}>
            <TextInput
              ref={input} value={text} onChangeText={onText} multiline maxLength={maxLen} {...WEB_ONE_ROW} {...webEnterToSend(start)}
              placeholder="궁금한 걸 편하게 물어보세요" placeholderTextColor={colors.inkMute}
              style={[s.input, Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)]} accessibilityLabel="고민 내용"
            />
            <PressableScale onPress={start} disabled={!ok} style={[s.sendBtn, !ok && { opacity: 0.4 }]} scaleTo={0.9} accessibilityLabel={free ? '무료로 물어보기' : viaSub ? '구독 혜택으로 물어보기' : `${cost}알로 물어보기`}>
              <View style={{ transform: [{ rotate: '-45deg' }], marginLeft: 2, marginBottom: 2 }}><Icon name="send" size={20} color={colors.white} strokeWidth={1.8} /></View>
            </PressableScale>
          </View>
        </View>
      </KeyboardAvoidingView>

      <BottomSheet visible={confirm} onClose={() => setConfirm(false)}>
        <Text style={[txt.caption, { textAlign: 'center' }]}>운알톡</Text>
        <Text style={[txt.h2, { textAlign: 'center', marginTop: 6 }]}>{cost}알로 물어볼까요?</Text>
        <Text style={[txt.small, { textAlign: 'center', marginTop: 8 }]}>오늘 무료 대화 {perDay}번{sub ? `과 이번 달 구독 운알톡 ${sub.total}회를` : '을'} 다 썼어요.{'\n'}답을 받은 뒤 {hours}시간 동안 {limit}번 더 물어볼 수 있어요.{'\n'}답변이 만들어진 뒤에만 알이 쓰여요.</Text>
        <PrimaryButton label="물어보기" onPress={ask} style={{ marginTop: 20 }} />
        <PrimaryButton label="취소" variant="soft" onPress={() => setConfirm(false)} style={{ marginTop: 8 }} />
      </BottomSheet>

      <BottomSheet visible={swapTo !== null} onClose={() => setSwapTo(null)}>
        <Text style={[txt.h2, { textAlign: 'center' }]}>예시로 바꿀까요?</Text>
        <Text style={[txt.small, { textAlign: 'center', marginTop: 8 }]}>지금 적은 내용은 지워져요.</Text>
        <PrimaryButton label="바꾸기" onPress={() => { if (swapTo) fillExample(swapTo); setSwapTo(null); }} style={{ marginTop: 20 }} />
        <PrimaryButton label="취소" variant="soft" onPress={() => setSwapTo(null)} style={{ marginTop: 8 }} />
      </BottomSheet>
      {invite.sheet}
      <WelcomeBonusSheet hidden={invite.visible} />
    </Screen>
  );
}

const INPUT_MAX = 120;
const TICKET_INK = isDark ? colors.accent : 'rgba(0, 163, 255, 0.8)'; // 디자인: #00A3FF 80%
const HOME_ROWS = 3;
const FOOTER_FADE = [`${colors.cream}00`, colors.cream] as const;

const s = StyleSheet.create({
  content: { paddingHorizontal: SCREEN_PX, paddingTop: 8, paddingBottom: 24 },
  intro: { alignItems: 'center', marginTop: 8 },
  mascot: { width: 215, height: 144 },
  greet: { marginTop: -7, fontSize: 13, lineHeight: 20, fontWeight: '500', color: colors.ink, letterSpacing: -0.65, textAlign: 'center' },
  today: { marginTop: 20, borderRadius: radius.lg, overflow: 'hidden' },
  todayImg: { width: '100%', height: '100%', borderRadius: radius.lg },
  todayImgNative: { borderRadius: radius.lg },
  todayContent: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, minHeight: 66 },
  todayHighlighted: { borderWidth: 1, borderColor: '#68BFF2' },
  todayEmphasized: { borderWidth: 1.5, borderColor: colors.accent },
  todayContentBig: { paddingVertical: 18, minHeight: 80 },
  todayVUnread: { fontWeight: '600', color: colors.ink },
  todayBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: colors.accent },
  todayBtnText: { fontSize: 13, lineHeight: 18, fontWeight: '700', color: colors.white, letterSpacing: -0.5 },
  todayProfileChipQuiet: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(23, 75, 115, 0.2)' },
  todayProfileChip: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(23, 75, 115, 0.2)', shadowColor: '#174B73', shadowOpacity: 0.14, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  todayHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  todayK: { fontSize: 15, lineHeight: 20, fontWeight: '700', color: colors.ink, letterSpacing: -0.5 },
  todayV: { fontSize: 13, lineHeight: 18, color: colors.inkSub, letterSpacing: -0.6 },
  exampleK: { fontSize: 13, fontWeight: '600', color: colors.inkMute, marginTop: 28, marginBottom: 10 },
  footer: { paddingHorizontal: SCREEN_PX, paddingTop: 4, paddingBottom: 18, backgroundColor: colors.cream },
  fade: { position: 'absolute', left: 0, right: 0, top: -28, height: 28 },
  between: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 8 },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  hint: { fontSize: 12, lineHeight: 16, color: colors.inkMute, letterSpacing: -0.6, flexShrink: 1 },
  ticket: { paddingHorizontal: 4, paddingVertical: 2, borderRadius: radius.xs, backgroundColor: colors.accentSoft },
  ticketText: { fontSize: 12, lineHeight: 16, fontWeight: '600', color: TICKET_INK },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingRight: 8, paddingLeft: 14, borderRadius: radius.sm, backgroundColor: colors.card },
  input: { flex: 1, minHeight: 40, maxHeight: INPUT_MAX, paddingTop: 11, paddingBottom: 11, fontSize: 13, lineHeight: 18, color: colors.ink, letterSpacing: -0.65 },
  sendBtn: { width: 32, height: 32, margin: 4, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
});
