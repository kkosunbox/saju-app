import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewInstance, type TextInputInstance } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { router, useLocalSearchParams } from 'expo-router';
import { NativeStackNavigationProp, useNavigation } from '@/navigation/compat';
import Screen from '../../components/Screen';
import PressableScale from '../../components/PressableScale';
import Icon from '../../components/Icon';
import { FortuneProfileChip } from '../../components/home/FortuneProfileBadge';
import FortuneAlarmPrompt from '../../components/notification/FortuneAlarmPrompt';
import { useApp } from '../../context/AppContext';
import { CombinedFortune, DailyFortune } from '../../types';
import { usePremium } from '../../context/PremiumContext';
import { RootStackParamList } from '../../navigation/types';
import { ITEMS } from '../../services/premium/catalog';
import { useFortuneDraw } from '../../services/content/opened';
import { notificationService } from '../../services/notificationService';
import { storage } from '../../services/storage/storageService';
import { CategoryKey, categoryTheme, colors } from '../../theme/colors';
import { radius, SCREEN_PX, txt } from '../../theme/typography';
import { formatKoreanDate } from '../../utils/date';
import { DEV_TOOLS } from '../../utils/devTools';
import { useScreenLive } from '../../utils/motion';
import { Counselor, MyBubble, ReplyBubble, SuggestionChips, WEB_ONE_ROW, useWebAutoGrow, webEnterToSend } from './parts';
import { InlineChatTurns, useInlineChat } from './InlineChat';
import { useChatCostConfirm } from './ChatCostSheet';
import { CHAT_CONFIG } from '../../services/content/consult';
import { ChatHeaderLeft } from './ChatMenu';
import FortuneRec from './FortuneRec';
import { useFortuneSignup } from './FortuneSignupDialog';
import { queryClient } from '../../api/query';
import { fortuneHistoryKeys } from '../../services/server/fortuneApi';
import { Stream, StreamBlock, StreamText } from '../../components/Stream';
import { PointPill } from '../../components/HeaderPoints';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const ASK_INPUT_MAX = 120;
/** 답이 온 뒤 대화 끝을 따라 내려가는 시간 (긴 답이 다 써질 만큼) */
const FOLLOW_MS = 15000;

/** 게스트 가입 안내 팝업 — 일단 끔. 다시 띄우려면 true로 */
const FORTUNE_SIGNUP_ENABLED = false;
const CATS: CategoryKey[] = ['love', 'money', 'work', 'relationship'];
const WRITING = ['오늘의 사주를 펼쳐 보고 있어요…', 'MBTI · 타로 · 점성술을 겹쳐 보는 중이에요…', '오늘의 이야기를 쓰고 있어요…'];
const CHIPS = {
  week: '이번 주 흐름은 어때?',
  tarot: '오늘의 타로 카드 보기',
  share: '운세 카드 공유하기',
} as const;

/**
 * 운알이가 건네는 오늘의 이야기 — 새 운세는 서버가 한 편으로 써 준다(섹션 하나).
 * 예전 운세는 세 문단 중 '다른 관점에서'를 빼고 이어 붙인다. 글이 없으면 홈 카드용 두 문장
 */
function todayStory(f: CombinedFortune): string {
  const sections = f.storySections ?? [];
  const body = sections.length === 1
    ? sections[0].body
    : sections.filter(x => x.title !== '다른 관점에서').map(x => x.body).join('\n\n');
  return body.trim() || f.storyBrief || f.summary;
}

/** 행운의 시간을 칸에 한 줄로 — "11:00~13:00" → "11시~13시", 정각이 아니면 그대로 */
function shortTime(t: string): string {
  const m = /^(\d{1,2}):00\s*[~-]\s*(\d{1,2}):00$/.exec(t.trim());
  return m ? `${Number(m[1])}시~${Number(m[2])}시` : t;
}

/** 할 것 · 피할 것은 행동만 — 예전 운세의 "— 이유"는 뗀다 */
const plainAction = (t: string) => t.split(/\s*[—–]\s*/)[0].trim().replace(/[.。]$/, '');

/** "오늘 운세 어때?"라고 물을 때 — 고민 글에서 이렇게만 물으면 상담 대신 오늘의 운세로 답한다 */
export const isTodayFortuneQuestion = (text: string) => {
  // "오늘 운세 어때?"처럼 운세 자체만 묻는 말만 — "오늘 연애운 어때?", "운세 근거 알려줘"처럼 더 묻는 말은 운알이가 답한다
  const t = text.replace(/[\s?!.~]/g, '');
  return /^(오늘|today)?(내|제|나의)?(오늘)?(의)?운세(는|좀|가)?(어때|어때요|어떄|알려줘|봐줘|보여줘|어떻게돼|어떰)?$/i.test(t);
};

/**
 * 운알이의 운세 답 — 점수 · 칭호 · 오늘의 이야기 · 분야별 · 할 것과 피할 것 · 행운.
 * 오늘 화면과 지난 운세 기록 화면이 같이 쓴다 (Stream 안이면 써지는 것처럼, 밖이면 바로 다 보인다).
 * onCategory: 분야를 누르면 상세로 (지난 운세는 그날 상세가 없어 누를 수 없다)
 */
export function FortuneReading({ fortune, who, onCategory }: { fortune: DailyFortune; who: string; onCategory?: (k: CategoryKey) => void }) {
  const f = fortune.combined;
  const delta = fortune.yesterdayScores ? f.totalScore - fortune.yesterdayScores.totalScore : null;
  return (
    <>
      <Counselor>
        <StreamText style={s.eyebrow}>{`${who}님의 오늘`}</StreamText>
        <StreamBlock style={s.scoreRow}>
          <Text style={s.score}>{f.totalScore}<Text style={s.scoreUnit}>점</Text></Text>
          {delta ? <Text style={[s.delta, { color: delta > 0 ? '#DD2828' : '#3D79D4' }]}>{delta > 0 ? `▲${delta}` : `▼${-delta}`} 어제보다</Text> : null}
        </StreamBlock>
        {fortune.shareCard?.title ? <StreamText style={s.title}>{`오늘의 나는 「${fortune.shareCard.title}」`}</StreamText> : null}
        <StreamText style={s.text}>{todayStory(f)}</StreamText>
      </Counselor>

      <Counselor>
        <StreamText style={s.text}>분야별로 보면 이래요.</StreamText>
        <StreamBlock style={s.card}>
          {CATS.map((k, i) => (
            <PressableScale key={k} onPress={() => onCategory?.(k)} disabled={!onCategory} style={[s.cat, i > 0 && s.catLine]} scaleTo={0.98} accessibilityLabel={`${categoryTheme[k].label} ${f[k]}점. ${f.categoryTexts[k]}`}>
              <View style={s.catHead}>
                <Text style={s.catK}>{categoryTheme[k].short}</Text>
                <Text style={[s.catV, { color: categoryTheme[k].color }]}>{f[k]}</Text>
                {onCategory ? <Icon name="chevronRight" size={14} color={colors.inkMute} /> : null}
              </View>
              <StreamText style={s.catT} numberOfLines={2}>{f.categoryTexts[k]}</StreamText>
            </PressableScale>
          ))}
        </StreamBlock>
      </Counselor>

      <Counselor>
        <StreamText style={s.sub}>오늘은 이렇게 해 보세요</StreamText>
        {f.goodActions.map(t => <StreamText key={t} style={s.item}>{`· ${plainAction(t)}`}</StreamText>)}
        <StreamText style={[s.sub, { marginTop: 6 }]}>이건 피하면 좋아요</StreamText>
        {f.avoidActions.map(t => <StreamText key={t} style={s.item}>{`· ${plainAction(t)}`}</StreamText>)}
      </Counselor>

      <Counselor>
        <StreamText style={s.text}>오늘의 행운도 챙겨 가세요.</StreamText>
        {/* 세 칸 모두 같은 틀: 위 이름, 아래 같은 높이의 값 줄 */}
        <StreamBlock style={s.lucky}>
          <View style={s.luckyCell}>
            <Text style={s.luckyK}>행운의 색</Text>
            <View style={s.luckyRow}>
              <View style={[s.dot, { backgroundColor: f.luckyColorHex }]} />
              <Text style={s.luckyV} numberOfLines={1}>{f.luckyColor}</Text>
            </View>
          </View>
          <View style={s.luckyCell}>
            <Text style={s.luckyK}>행운의 숫자</Text>
            <View style={s.luckyRow}><Text style={s.luckyV}>{f.luckyNumber}</Text></View>
          </View>
          <View style={s.luckyCell}>
            <Text style={s.luckyK}>행운의 시간</Text>
            <View style={s.luckyRow}><Text style={s.luckyV} numberOfLines={1}>{shortTime(f.luckyTime)}</Text></View>
          </View>
        </StreamBlock>
      </Counselor>
    </>
  );
}

/**
 * 운알톡 안의 오늘의 운세 — 물어보면 운알이가 오늘의 운세를 대화로 풀어 준다(뽑기). 무료, 잠금 없음.
 * 하루 첫 운세는 무료이고, 같은 날 다른 프로필은 서버가 준 알(drawCost)로 연다. 예전 홈의 뽑기 화면을 대신한다
 */
export default function FortuneChatScreen() {
  const nav = useNavigation<Nav>();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const fromPremiumReading = from === 'premium-reading' && router.canGoBack();
  const { account, booting, user, profiles, fortuneUser, fortuneProfileId, fortune, today, fortuneWriting, refreshFortune } = useApp();
  const { openUnlock } = usePremium();
  const draw = useFortuneDraw();
  const scroll = useRef<ScrollViewInstance>(null);
  const [justDrawn, setJustDrawn] = useState(false);
  // 아래 입력창 — 오늘의 운세를 보다가 바로 운알이에게 말을 건다. 화면을 넘기지 않고 운세 아래로 대화가 이어진다 (이 운세를 기억)
  const askInput = useRef<TextInputInstance>(null);
  const [askText, setAskText] = useState('');
  useWebAutoGrow(askInput, askText, ASK_INPUT_MAX);
  const inline = useInlineChat(fortune?.id);
  const askCost = inline.cost;
  const { confirm: confirmCost, sheet: costSheet } = useChatCostConfirm();
  const inlineTurns = inline.chat?.turns?.length ?? 0;
  // 말을 보내면 답이 다 써질 때까지 대화 끝을 따라 내려간다 (말풍선이 그려지며 높이가 늘어나는 만큼).
  // 글이 써지는 동안 높이가 계속 바뀌어 부드러운 스크롤은 매번 끊기므로, 늘어날 때마다 바로 끝에 붙인다
  const [followChat, setFollowChat] = useState(false);
  useEffect(() => {
    if (inline.sending) {
      setFollowChat(true);
      // 보낸 말이 바로 보이게 한 번은 부드럽게
      requestAnimationFrame(() => scroll.current?.scrollToEnd({ animated: true }));
      return;
    }
    if (!followChat) return;
    // 답이 다 써질 만큼 따라가고 그 뒤엔 사용자가 자유롭게 스크롤한다 (손으로 끌면 바로 멈춘다)
    const t = setTimeout(() => setFollowChat(false), FOLLOW_MS);
    return () => clearTimeout(t);
  }, [inline.sending, followChat, inlineTurns]);
  const who = fortuneUser?.nickname ?? user?.nickname ?? '';
  const isSelf = profiles.find(p => p.profileId === (fortuneProfileId ?? user?.profileId))?.relationship === 'self';
  const drawCost = draw.ready && !draw.opened ? fortune?.drawCost ?? 0 : 0;
  const sealed = draw.ready && !draw.opened && !!fortune;
  // AI 문장을 기다리는 건 뽑기 요청이 끝날 때까지만 — 서버가 AI 작성에 실패하면 textsPending이 그대로 남지만 규칙 문장을 보여 준다
  const reading = draw.opened && fortuneWriting;
  const ready = draw.opened && !!fortune && !reading;
  // 이 화면에서 뽑거나 쓰는 걸 기다린 답만 써지는 것처럼 (이미 본 운세를 다시 열면 바로 다 보인다)
  const [fresh, setFresh] = useState(false);
  useEffect(() => { if (sealed || reading) setFresh(true); }, [sealed, reading]);
  // 방금 뽑은 운세가 지난 운세 기록(메뉴 · 대화 기록 탭)에 바로 보이게
  useEffect(() => { if (ready && fresh) void queryClient.invalidateQueries({ queryKey: fortuneHistoryKeys.all }); }, [ready, fresh]);

  // 물어본 순간이 곧 뽑기 — 무료면 바로 뽑는다 (알이 드는 다른 프로필은 열기 버튼을 누를 때)
  useEffect(() => {
    if (sealed && drawCost === 0) {
      draw.open();
      setJustDrawn(true);
    }
  }, [sealed, drawCost, draw.open]);

  // 방금 뽑았으면 답이 다 나오고 몇 초 뒤 알림 권유를 한 번 (띄울지는 notificationService가 정한다)
  const live = useScreenLive();
  const [alarmAsk, setAlarmAsk] = useState(false);
  const [signupSeen, setSignupSeen] = useState<boolean | null>(null);
  const { reserve: reserveSignup, setHostLive: setSignupHostLive } = useFortuneSignup();
  const signupReserved = useRef(false);
  const readingEnd = useRef<{ key: string; y: number } | null>(null);
  const readingScroll = useRef<{ key: string; y: number } | null>(null);
  const viewportHeight = useRef(0);
  const readingKey = `${today}:${fortuneProfileId ?? 'primary'}`;
  const guest = !booting && !!user && !account;
  // 예약된 가입 안내는 이 화면이 앞에 있을 때만 뜬다
  useEffect(() => {
    setSignupHostLive(live);
    return () => setSignupHostLive(false);
  }, [live, setSignupHostLive]);

  useEffect(() => {
    if (!guest) return;
    let alive = true;
    void storage.hasSeenFortuneSignup().then(seen => { if (alive) setSignupSeen(seen); });
    return () => { alive = false; };
  }, [guest]);

  // 가입 안내를 아직 보지 않은 게스트에게는 같은 운세에서 알림을 먼저 권하지 않는다.
  const canAskForAlarm = !FORTUNE_SIGNUP_ENABLED || !!account || signupSeen === true;
  useEffect(() => {
    if (!canAskForAlarm || !justDrawn || !ready || !live) return;
    let alive = true;
    const timer = setTimeout(async () => {
      if (!alive || !(await notificationService.shouldPrompt().catch(() => false)) || !alive) return;
      setJustDrawn(false);
      await notificationService.markPrompted();
      setAlarmAsk(true);
    }, 5000);
    return () => { alive = false; clearTimeout(timer); };
  }, [canAskForAlarm, justDrawn, ready, live]);

  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [readingKey]);

  const f = fortune?.combined;
  const watchForSignup = FORTUNE_SIGNUP_ENABLED && guest && signupSeen === false && ready && !!f && live && !alarmAsk;
  // 첫 운세는 본문이 순서대로 나타난다. 본문 끝(추천 질문)이 화면에 들어오면 예약한다 —
  // 큰 화면이라 스크롤 없이 다 보이면 스크롤하지 않아도.
  const checkSignupPosition = useCallback(() => {
    if (!watchForSignup || signupReserved.current) return;
    const end = readingEnd.current;
    if (end?.key !== readingKey || viewportHeight.current <= 0) return;
    const y = readingScroll.current?.key === readingKey ? readingScroll.current.y : 0;
    if (y + viewportHeight.current < end.y) return;
    signupReserved.current = true;
    reserveSignup();
  }, [readingKey, reserveSignup, watchForSignup]);
  useEffect(() => { checkSignupPosition(); }, [checkSignupPosition]);

  const onFortuneScroll = ({ nativeEvent: { contentOffset, layoutMeasurement } }: NativeSyntheticEvent<NativeScrollEvent>) => {
    readingScroll.current = { key: readingKey, y: contentOffset.y };
    viewportHeight.current = layoutMeasurement.height;
    checkSignupPosition();
  };
  const onFortuneViewportLayout = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    viewportHeight.current = layout.height;
    checkSignupPosition();
  };
  const onFortuneEndLayout = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    if (layout.height <= 0 || layout.y <= 0) return;
    readingEnd.current = { key: readingKey, y: layout.y };
    checkSignupPosition();
  };

  if (!user) return null;

  const pick = (q: string) => {
    if (q === CHIPS.week) nav.navigate('Fortune', { period: 'weekly' });
    else if (q === CHIPS.tarot) nav.navigate('AnalysisDetail', { source: 'tarot' });
    else if (q === CHIPS.share) nav.navigate('Share');
  };
  const sendAsk = () => {
    const message = askText.trim();
    if (!message) return;
    // 오늘 운세에 대한 말은 전부 이 운세를 기억한 운알이가 이어서 답한다 ("오늘 운세 어때?"도 위로 돌려보내지 않는다)
    // 알이 드는 말이면 보내기 전에 한 번 묻는다 (다시 보지 않기를 고르면 바로)
    confirmCost(askCost, () => {
      setAskText('');
      // 다 본 운세면 그 운세를 기억하고 이어서 이야기한다 (예전 서버는 id가 없어 그냥 대화)
      void inline.send(message, ready && fortune?.id ? { type: 'daily_fortune', ref: String(fortune.id), title: `${who}님의 오늘의 운세` } : undefined)
        .then(ok => { if (!ok) setAskText(message); });
    });
  };
  const askLen = askText.trim().length;
  const unlock = () => {
    if (!fortune) return;
    openUnlock(ITEMS.daily(fortune.date, who, drawCost), () => { draw.open(); setJustDrawn(true); void refreshFortune(); }, fortune.forProfile ?? undefined);
  };

  return (
    <Screen
      left={fromPremiumReading ? undefined : <ChatHeaderLeft current="today" />}
      back={fromPremiumReading}
      onBack={fromPremiumReading ? () => router.back() : undefined}
      sky scroll={false}
      right={(
        <>
          <PressableScale onPress={() => fortune && nav.navigate('Share')} disabled={!ready} hitSlop={8} scaleTo={0.9} style={[s.share, !ready && { opacity: 0.35 }]} accessibilityLabel="오늘의 운세 카드 공유하기">
            <Icon name="external" size={24} strokeWidth={2} color={colors.ink} />
          </PressableScale>
          <PointPill attendHint quiet />
        </>
      )}
    >
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView ref={scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}
        onContentSizeChange={followChat ? () => scroll.current?.scrollToEnd({ animated: false }) : undefined}
        onScrollBeginDrag={followChat ? () => setFollowChat(false) : undefined}
        onScroll={FORTUNE_SIGNUP_ENABLED && guest && signupSeen !== true ? onFortuneScroll : undefined} scrollEventThrottle={32}
        onLayout={onFortuneViewportLayout}>
        <Text style={[txt.caption, { textAlign: 'center' }]}>{formatKoreanDate(today)} · 오늘의 운세</Text>
        {/* 누구의 운세를 볼지 — 누르면 프로필을 고른다 */}
        <View style={s.whoRow}>
          <FortuneProfileChip />
          {/* 지난 운세는 대화 기록 탭의 '오늘의 운세'에서 */}
          <PressableScale onPress={() => nav.navigate('Talks', { tab: 'fortune' })} hitSlop={6} style={s.pastBtn} scaleTo={0.95} accessibilityLabel="지난 운세 기록 보기">
            <Icon name="clock" size={13} color={colors.inkSub} strokeWidth={2} />
            <Text style={s.pastText}>지난 운세</Text>
          </PressableScale>
        </View>
        {/* 관계가 '본인'인 프로필이면 '내', 그 밖에는 이름으로 묻는다 */}
        <MyBubble>{isSelf ? '오늘 내 운세는 어때?' : `오늘 ${who}님 운세는 어때?`}</MyBubble>

        {!draw.ready || !fortune ? (
          <ReplyBubble typing={WRITING.slice(0, 1)} />
        ) : sealed && drawCost > 0 ? (
          <Stream active>
            <Counselor>
              <StreamText style={s.text}>{`오늘 무료로 볼 수 있는 운세는 이미 봤어요.\n${drawCost}알로 ${who}님의 오늘을 열어 볼까요?`}</StreamText>
              <StreamBlock>
                <PressableScale onPress={unlock} style={s.open} scaleTo={0.96} accessibilityLabel={`${drawCost}알로 ${who}님의 오늘의 운세 열기`}>
                  <Text style={s.openText}>{drawCost}알로 열기 →</Text>
                </PressableScale>
              </StreamBlock>
            </Counselor>
          </Stream>
        ) : reading || !f ? (
          <ReplyBubble typing={WRITING} />
        ) : (
          <Stream key={fresh ? 'fresh' : 'seen'} active={fresh}>
            <FortuneReading fortune={fortune} who={who} onCategory={k => nav.navigate('CategoryDetail', { category: k })} />

            <SuggestionChips items={Object.values(CHIPS)} onPick={pick} caption="더 궁금한 게 있나요?"
              onLayout={onFortuneEndLayout}
            />

            {/* 오늘 점수가 높은 분야에 맞춘 리포트 추천 (연애운이면 미래 배우자의 흐린 얼굴) */}
            <FortuneRec fortune={f} mine={fortuneProfileId == null} />

          </Stream>
        )}

        {/* 아래 입력창으로 이어 말한 대화 — 화면을 넘기지 않고 여기에 쌓인다 */}
        <InlineChatTurns chat={inline.chat} sending={inline.sending} />

        {DEV_TOOLS && draw.opened ? (
          <Text style={[txt.caption, { textAlign: 'center', marginTop: 24 }]} onPress={() => { draw.reset(); setJustDrawn(false); }}>뽑기 초기화 (테스트용)</Text>
        ) : null}
      </ScrollView>

      {/* 채팅처럼 아래에서 바로 물어본다 — 답은 이 화면 운세 아래로 온다 */}
      <View style={s.askBar}>
        <View style={s.askRow}>
          <TextInput
            ref={askInput} value={askText} onChangeText={setAskText} multiline maxLength={CHAT_CONFIG.maxLen} {...WEB_ONE_ROW} {...webEnterToSend(sendAsk)}
            placeholder="오늘 운세, 운알이에게 더 물어보세요" placeholderTextColor={colors.inkMute}
            style={[s.askInput, Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)]} accessibilityLabel="운알이에게 보낼 말"
          />
          <PressableScale onPress={sendAsk} disabled={!askLen} style={[s.askSend, !askLen && { opacity: 0.4 }]} scaleTo={0.9} accessibilityLabel="운알이에게 물어보기">
            <View style={{ transform: [{ rotate: '-45deg' }], marginLeft: 2, marginBottom: 2 }}><Icon name="send" size={20} color={colors.white} strokeWidth={1.8} /></View>
          </PressableScale>
        </View>
      </View>
      </KeyboardAvoidingView>
      <FortuneAlarmPrompt visible={alarmAsk} onClose={() => setAlarmAsk(false)} />
      {costSheet}
    </Screen>
  );
}

const s = StyleSheet.create({
  open: { alignSelf: 'flex-start', marginTop: 2, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 18, backgroundColor: colors.accent },
  openText: { fontSize: 14, fontWeight: '700', color: colors.white, letterSpacing: -0.4 },
  share: { width: 24, height: 44, justifyContent: 'center' },
  content: { paddingHorizontal: SCREEN_PX, paddingTop: 8, paddingBottom: 40 },
  whoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 },
  pastBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.card },
  pastText: { fontSize: 12, color: colors.inkSub, letterSpacing: -0.3 },
  eyebrow: { fontSize: 12, fontWeight: '700', color: colors.accent, letterSpacing: -0.3 },
  scoreRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  score: { fontSize: 40, lineHeight: 46, fontWeight: '800', color: colors.ink, letterSpacing: -1 },
  scoreUnit: { fontSize: 18, fontWeight: '700' },
  delta: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  title: { fontSize: 15, fontWeight: '700', color: colors.ink, letterSpacing: -0.5 },
  text: { fontSize: 14, lineHeight: 24, color: colors.ink, letterSpacing: -0.7 },
  sub: { fontSize: 14, fontWeight: '700', color: colors.ink, letterSpacing: -0.5 },
  item: { fontSize: 14, lineHeight: 22, color: colors.ink, letterSpacing: -0.6 },
  card: { borderRadius: radius.lg, backgroundColor: colors.card, overflow: 'hidden' },
  cat: { paddingHorizontal: 14, paddingVertical: 12, gap: 4 },
  catLine: { borderTopWidth: 1, borderTopColor: colors.line },
  catHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  catK: { fontSize: 14, fontWeight: '700', color: colors.ink, letterSpacing: -0.5, flex: 1 },
  catV: { fontSize: 16, fontWeight: '800' },
  catT: { fontSize: 13, lineHeight: 19, color: colors.inkSub, letterSpacing: -0.5 },
  lucky: { flexDirection: 'row', gap: 8 },
  // 칸 너비를 내용 길이에 맞춰 나눠, "오전 11~오후 1시"처럼 긴 값도 한 줄에 들어가게 한다
  luckyCell: { flexGrow: 1, flexShrink: 1, flexBasis: 'auto', alignItems: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 6, borderRadius: radius.md, backgroundColor: colors.card },
  luckyRow: { height: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, maxWidth: '100%' },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: colors.line },
  luckyV: { fontSize: 15, lineHeight: 20, fontWeight: '700', color: colors.ink, letterSpacing: -0.4, flexShrink: 1 },
  luckyK: { fontSize: 11, lineHeight: 14, color: colors.inkMute, letterSpacing: -0.3 },
  askBar: { paddingHorizontal: SCREEN_PX, paddingTop: 8, paddingBottom: 18, backgroundColor: colors.cream, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  askRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingRight: 8, paddingLeft: 14, borderRadius: radius.sm, backgroundColor: colors.card },
  askInput: { flex: 1, minHeight: 40, maxHeight: ASK_INPUT_MAX, paddingTop: 11, paddingBottom: 11, fontSize: 13, lineHeight: 18, color: colors.ink, letterSpacing: -0.65 },
  askSend: { width: 32, height: 32, margin: 4, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
});
