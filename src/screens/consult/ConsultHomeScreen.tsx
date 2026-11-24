import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, ImageBackground, Platform, ScrollView, StyleSheet, Text, TextInput, View, type TextInputInstance } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useQuery } from '@tanstack/react-query';
import { NativeStackNavigationProp, useNavigation } from '@/navigation/compat';
import { useFocusEffect, useIsFocused } from 'expo-router';
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
import { RootStackParamList } from '../../navigation/types';
import { CHAT_CONFIG } from '../../services/content/consult';
import { ConsultView, consultApi, nextChatCost, useConsultStatus } from '../../services/server/consultApi';
import { useAnyFortuneOpened, useOpened } from '../../services/content/opened';
import { startAsk } from './pendingAsk';
import { colors, isDark } from '../../theme/colors';
import { radius, SCREEN_PX, txt } from '../../theme/typography';
import { ConsultRows, WEB_ONE_ROW, useWebAutoGrow, webEnterToSend } from './parts';
import WorryMarquee from './WorryMarquee';
import { isTodayFortuneQuestion } from './FortuneChatScreen';
import { ChatHeaderLeft } from './ChatMenu';
import { useChatCostConfirm } from './ChatCostSheet';
import { FortuneProfileChip } from '../../components/home/FortuneProfileBadge';
import { trackAction } from '../../services/screenViews';
import { goLogin, takeConsultIntent } from '../../services/loginIntent';
import { storage } from '../../services/storage/storageService';
import ConsultWelcomeIntro, { consultMascotSize } from './ConsultWelcomeIntro';

let playedWelcomeIntro = false;

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
  '전 애인한테 연락 올까?',
  '오늘 회사 가기 너무 싫다',
  '썸 타는 사람한테 먼저 고백해도 될까?',
  '친구한테 서운한 거 말할까 말까',
  '요즘 왜 이렇게 의욕이 없지',
  '이번 달 돈 좀 모일까?',
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
 * 첫 화면 운알톡 — 운알이가 먼저 말을 걸고, 아래 입력창에 편하게 말을 보낸다 (가벼운 대화).
 * 최근 대화를 위에 두고, 지난 대화 전체는 '대화 기록' 탭에. 대화 중 어울리는 리포트가 있으면 운알이가 말풍선으로 권한다
 */
export default function ConsultHomeScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user: u, account } = useApp();
  const focused = useIsFocused();
  const hasUser = !!u;
  const [intro, setIntro] = useState<'pending' | 'welcome' | 'leaving' | 'revealing' | 'done'>(() => playedWelcomeIntro ? 'done' : 'pending');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [introOpacity] = useState(() => new Animated.Value(1));
  const [uiProgress] = useState(() => new Animated.Value(0));
  const finishIntro = useCallback(() => setIntro('done'), []);
  const introVisible = intro !== 'done';
  const showWelcome = intro === 'welcome' || intro === 'leaving';

  useEffect(() => {
    if (intro !== 'leaving' && intro !== 'revealing') return;
    const leaving = intro === 'leaving';
    const duration = leaving ? 180 : REVEAL_DURATION + REVEAL_GAP * 4;
    const animation = Animated.timing(leaving ? introOpacity : uiProgress, {
      toValue: leaving ? 0 : duration,
      duration,
      easing: leaving ? Easing.out(Easing.cubic) : Easing.linear,
      useNativeDriver: Platform.OS !== 'web',
      isInteraction: false,
    });
    animation.start(({ finished }) => {
      if (finished) setIntro(leaving ? 'revealing' : 'done');
    });
    return () => animation.stop();
  }, [intro, introOpacity, uiProgress]);

  useEffect(() => {
    if (!focused || !hasUser || intro !== 'pending') return;
    let live = true;
    void Promise.all([
      storage.hasSeenConsultWelcome(),
      AccessibilityInfo.isReduceMotionEnabled().catch(() => true),
    ]).then(([seen, reduced]) => {
      if (!live) return;
      if (playedWelcomeIntro || seen) {
        playedWelcomeIntro = true;
        finishIntro();
        return;
      }
      playedWelcomeIntro = true;
      void storage.markConsultWelcomeSeen();
      setReducedMotion(reduced);
      setIntro('welcome');
    });
    return () => { live = false; };
  }, [finishIntro, focused, hasUser, intro]);

  useFocusEffect(useCallback(() => () => {
    setIntro(current => current === 'welcome' ? 'done' : current);
  }, []));

  const continueToChat = () => {
    if (intro !== 'welcome') return;
    setIntro(reducedMotion ? 'done' : 'leaving');
  };
  const input = useRef<TextInputInstance>(null);
  const [text, setText] = useState('');
  const [swapTo, setSwapTo] = useState<string | null>(null);
  // 게스트도 받는다 — 게스트는 처음 한 대화만 무료
  const status = useConsultStatus(!!u);
  const { confirm: confirmCost, sheet: costSheet } = useChatCostConfirm();
  // 최근 대화 HOME_ROWS개만 (이어서 할 것 · 끝난 것 구분 없이 최신순). 전체는 '대화 기록' 탭에서
  const recentQ = useQuery({ queryKey: ['consults', 'head', 'recent'], queryFn: () => consultApi.list({ limit: HOME_ROWS }), enabled: !!u });
  useWebAutoGrow(input, text, INPUT_MAX);
  // 로그인 전에 보내려던 말 — 로그인하고 이 화면에 오면 이어서 보낸다 (알이 들면 입력창 위 안내 줄이 알려 준다)
  const resumeReady = !!u && !!account && status.isSuccess;
  useEffect(() => {
    if (!resumeReady) return;
    const pending = takeConsultIntent();
    if (!pending) return;
    finishIntro();
    trackAction('consult_ask_resumed');
    trackAction('consult_ask');
    nav.push('ConsultChat', { id: 'new', ask: startAsk(pending.worry, pending.source) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeReady]);
  if (!u) return null;

  const chat = status.data?.chat;
  const maxLen = chat?.maxLength ?? CHAT_CONFIG.maxLen;
  // 상태를 받기 전에는 무료로 본다 (게스트가 이미 썼으면 서버가 MEMBER_ONLY로 돌려준다)
  const free = (chat?.freeChatsLeft ?? 1) > 0;
  // 무료를 다 썼을 때만 한 마디 값을 알려 준다 (남은 무료 횟수는 따로 보여 주지 않는다)
  const cost = account ? nextChatCost(chat) : 0;

  const onText = setText;
  const fillExample = (ex: string) => { onText(ex); input.current?.focus(); };
  const pickExample = (ex: string) => {
    if (!text.trim() || text === ex) return fillExample(ex);
    setSwapTo(ex);
  };
  const len = text.trim().length;

  const start = () => {
    if (!len) return;
    // "오늘 운세 어때?"처럼 오늘의 운세만 물으면 오늘의 운세로 답한다 (무료)
    if (isTodayFortuneQuestion(text)) { setText(''); input.current?.blur(); nav.navigate('Today'); return; }
    // 게스트가 무료 대화를 이미 썼으면, 적은 말은 기억해 두고 로그인으로 — 로그인하면 이 화면으로 돌아와 그대로 보낸다
    if (!account && !free) { trackAction('consult_ask_login_required'); goLogin({ kind: 'consult', worry: text.trim() }); return; }
    // 알이 드는 말이면 보내기 전에 한 번 묻는다 (다시 보지 않기를 고르면 바로)
    confirmCost(cost, ask);
  };
  // 알이 모자라면 서버가 INSUFFICIENT_POINTS로 돌려주고, 대화 화면이 충전으로 안내한다.
  // 답은 대화 화면에서 기다린다 (내 말이 먼저 보이고 운알이가 답을 쓰는 중)
  const ask = () => {
    trackAction('consult_ask');
    const key = startAsk(text.trim());
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

  const hiddenDuringIntro = introVisible ? {
    pointerEvents: 'none',
    accessibilityElementsHidden: true,
    'aria-hidden': true,
    ...(Platform.OS === 'web' && { inert: true }),
    importantForAccessibility: 'no-hide-descendants',
  } as const : undefined;
  const entrance = (order: number) => {
    if (!introVisible) return undefined;
    const start = order * REVEAL_GAP;
    const inputRange = [start, start + 105, start + REVEAL_DURATION];
    return {
      opacity: uiProgress.interpolate({ inputRange, outputRange: [0, 0.72, 1], extrapolate: 'clamp' }),
      transform: [{
        translateY: uiProgress.interpolate({ inputRange, outputRange: [10, 3, 0], extrapolate: 'clamp' }),
      }],
    };
  };
  const headerEntrance = entrance(0);
  return (
    <Screen
      left={<Animated.View {...hiddenDuringIntro} style={headerEntrance}><ChatHeaderLeft /></Animated.View>}
      right={<Animated.View {...hiddenDuringIntro} style={headerEntrance}><PointPill attendHint quiet /></Animated.View>}
      scroll={false}
    >
      <Animated.View {...hiddenDuringIntro} style={s.body}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={s.intro}>
              <Animated.View style={headerEntrance && { opacity: headerEntrance.opacity }}>
                <Image source={CONSULT_MASCOT} style={consultMascotSize} contentFit="cover" />
              </Animated.View>
            </View>
            {/* 오늘의 운세 — 고민 주제와 따로. 누구 운세를 볼지 먼저 고르고 물어본다 (무료로 바로 답) */}
            <Animated.View style={entrance(1)} testID="consult-reveal-fortune">
              <TodayFortuneCard onAsk={() => nav.navigate('Today')} />
            </Animated.View>
            {recentQ.data?.length ? (
              <Animated.View style={entrance(2)}>
                {section('최근 대화', recentQ.data)}
              </Animated.View>
            ) : null}

            {/* 눌러서 입력창에 채운다 — 세 줄이 번갈아 반대로 흘러간다 */}
            <Animated.View style={entrance(3)} testID="consult-reveal-examples">
              <Text style={s.exampleK}>다른 분들은 이런 걸 많이 물어봐요</Text>
              <View style={{ gap: 12 }}>
                {EXAMPLE_ROWS.map((items, i) => <WorryMarquee key={i} items={items} onPick={pickExample} reverse={i === 1} />)}
              </View>
            </Animated.View>

          </ScrollView>

          {/* 채팅처럼 아래에서 입력한다 — 판 없이 입력창만 두고, 안내는 그 위 한 줄로 */}
          <Animated.View style={[s.footer, entrance(4)]} testID="consult-reveal-composer">
            {/* 스크롤 내용이 안내 줄에서 탁 잘리지 않게 위로 바탕색 페이드 */}
            <LinearGradient pointerEvents="none" colors={FOOTER_FADE} style={s.fade} />
            <View style={s.between}>
              {/* 남은 무료 횟수는 따로 보여 주지 않는다 — 다 썼을 때만 한 마디 값을 알려 준다 */}
              <View style={s.hintRow}>
                <Text style={s.hint} numberOfLines={1}>
                  {!account && !free ? '로그인하면 매일 운알이와 무료로 이야기할 수 있어요' : ''}
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
              <PressableScale onPress={start} disabled={!len} style={[s.sendBtn, !len && { opacity: 0.4 }]} scaleTo={0.9} accessibilityLabel={cost > 0 ? `${cost}알로 보내기` : '보내기'}>
                <View style={{ transform: [{ rotate: '-45deg' }], marginLeft: 2, marginBottom: 2 }}><Icon name="send" size={20} color={colors.white} strokeWidth={1.8} /></View>
              </PressableScale>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
      {showWelcome ? (
        <ConsultWelcomeIntro
          mascot={CONSULT_MASCOT}
          nickname={u.nickname}
          opacity={introOpacity}
          reducedMotion={reducedMotion}
          leaving={intro === 'leaving'}
          onContinue={continueToChat}
        />
      ) : null}

      {costSheet}
      <BottomSheet visible={swapTo !== null} onClose={() => setSwapTo(null)}>
        <Text style={[txt.h2, { textAlign: 'center' }]}>예시로 바꿀까요?</Text>
        <Text style={[txt.small, { textAlign: 'center', marginTop: 8 }]}>지금 적은 내용은 지워져요.</Text>
        <PrimaryButton label="바꾸기" onPress={() => { if (swapTo) fillExample(swapTo); setSwapTo(null); }} style={{ marginTop: 20 }} />
        <PrimaryButton label="취소" variant="soft" onPress={() => setSwapTo(null)} style={{ marginTop: 8 }} />
      </BottomSheet>
    </Screen>
  );
}

const REVEAL_GAP = 78;
const REVEAL_DURATION = 280;
const INPUT_MAX = 120;
const HOME_ROWS = 3;
const FOOTER_FADE = [`${colors.cream}00`, colors.cream] as const;

const s = StyleSheet.create({
  content: { paddingHorizontal: SCREEN_PX, paddingTop: 8, paddingBottom: 24 },
  intro: { alignItems: 'center', marginTop: 8 },
  body: { flex: 1 },
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
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingRight: 8, paddingLeft: 14, borderRadius: radius.sm, backgroundColor: colors.card },
  input: { flex: 1, minHeight: 40, maxHeight: INPUT_MAX, paddingTop: 11, paddingBottom: 11, fontSize: 13, lineHeight: 18, color: colors.ink, letterSpacing: -0.65 },
  sendBtn: { width: 32, height: 32, margin: 4, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
});
