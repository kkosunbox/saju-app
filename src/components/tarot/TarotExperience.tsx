import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useIsFocused } from 'expo-router';
import { dealTopicCards, getTopicCard, TAROT_DECK_SIZE, TAROT_TOPICS, type TarotTopic } from '../../data/topicTarot';
import { useApp } from '../../context/AppContext';
import { useNavigation } from '@/navigation/compat';
import { loadTopicTarotDraws, resetTopicTarotDraw, saveTopicTarotDraw, subscribeToTopicTarotDraws } from '../../services/content/topicTarotDraws';
import { promosOf } from '../../services/promo/promos';
import { tarotSpec } from '../../services/share/shareSpecs';
import { sansW } from '../../theme/typography';
import { LOCAL_TOOLS } from '../../utils/devTools';
import { useReducedMotion } from '../../utils/motion';
import { todayISO } from '../../utils/date';
import { useWebTopBar } from '../../utils/webThemeColor';
import Icon from '../Icon';
import PromoSlot from '../PromoSlot';
import Screen from '../Screen';
import { ShareIconButton } from '../ShareCta';
import { ENTRANCE_DURATION } from './entranceMotion';
import TarotFan, { TarotDeck, TarotReveal } from './TarotFan';
import TarotScene from './TarotScene';

const NIGHT = '#140E1D';
const GOLD = '#E9BF83';
const INK = '#FFF6E8';
const MUTE = '#CFC0D4';
const LINE = '#503952';
const TOP_BAR = [[0, NIGHT]] as const;
const TOPIC_TRANSITION_DURATION = 520;

export default function TarotExperience() {
  const { user } = useApp();
  const [, refreshDate] = useState(0);
  const date = todayISO();
  const onDateChange = useCallback(() => refreshDate(value => value + 1), []);
  useEffect(() => {
    const nextMidnight = Date.parse(`${date}T00:00:00+09:00`) + 86_400_000;
    const timer = setTimeout(onDateChange, nextMidnight - Date.now() + 10);
    return () => clearTimeout(timer);
  }, [date, onDateChange]);
  if (!user) return null;
  return (
    <TarotSession
      key={JSON.stringify([user.id, date])}
      userId={user.id}
      nickname={user.nickname}
      date={date}
      onDateChange={onDateChange}
    />
  );
}

function TarotSession({ userId, nickname, date, onDateChange }: {
  userId: string;
  nickname: string;
  date: string;
  onDateChange: () => void;
}) {
  const nav = useNavigation();
  const focused = useIsFocused();
  const reduced = useReducedMotion();
  const [draws, setDraws] = useState<Awaited<ReturnType<typeof loadTopicTarotDraws>>>();
  const [loadFailed, setLoadFailed] = useState(false);
  const [topic, setTopic] = useState<TarotTopic>();
  const [topicDirection, setTopicDirection] = useState<'enter' | 'return'>();
  const [topicMotion] = useState(() => new Animated.Value(0));
  const scrollRef = useRef<ScrollViewInstance>(null);
  const [deck, setDeck] = useState<ReturnType<typeof dealTopicCards>>([]);
  const [animateReveal, setAnimateReveal] = useState(false);
  const [revealFinished, setRevealFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetFailed, setResetFailed] = useState(false);
  const [introPlayed, setIntroPlayed] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [gesture] = useState(() => new Animated.Value(0));
  const prepareScene = useCallback(() => setSceneReady(true), []);
  const [topicEntrance] = useState(() => new Animated.Value(0));
  const loadVersion = useRef(0);
  const [saveFailed, setSaveFailed] = useState(false);
  const writing = useRef(false);
  const finishReveal = useCallback(() => setRevealFinished(true), []);
  useWebTopBar(TOP_BAR);

  useEffect(() => {
    if (!sceneReady || introPlayed) return;
    const spread = Animated.timing(gesture, {
      toValue: 1, duration: reduced ? 0 : ENTRANCE_DURATION, easing: Easing.linear, useNativeDriver: true, isInteraction: false,
    });
    spread.start(({ finished }) => { if (finished) setIntroPlayed(true); });
    return () => spread.stop();
  }, [gesture, introPlayed, reduced, sceneReady]);

  useEffect(() => {
    if (!introPlayed) return;
    if (reduced) {
      topicEntrance.setValue(1);
      return;
    }
    const reveal = Animated.timing(topicEntrance, {
      toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    });
    reveal.start();
    return () => reveal.stop();
  }, [introPlayed, reduced, topicEntrance]);

  useEffect(() => {
    if (!topicDirection) return;
    const returning = topicDirection === 'return';
    // Scene height and card placement share one clock. The layout needs the JS driver.
    const transition = Animated.timing(topicMotion, {
      toValue: returning ? 0 : 1,
      duration: reduced ? 0 : returning ? 360 : TOPIC_TRANSITION_DURATION,
      easing: Easing.inOut(Easing.sin),
      useNativeDriver: false,
      isInteraction: false,
    });
    transition.start(({ finished }) => {
      if (!finished) return;
      if (returning) {
        setTopic(undefined);
        setDeck([]);
        setAnimateReveal(false);
        setRevealFinished(false);
        setSaveFailed(false);
        setResetFailed(false);
      }
      setTopicDirection(undefined);
    });
    return () => transition.stop();
  }, [reduced, topicDirection, topicMotion]);

  const load = useCallback(async () => {
    if (date !== todayISO()) return onDateChange();
    const version = ++loadVersion.current;
    try {
      const saved = await loadTopicTarotDraws(userId, date);
      if (version !== loadVersion.current) return;
      setDraws(saved);
      setLoadFailed(false);
    } catch {
      if (version === loadVersion.current) setLoadFailed(true);
    }
  }, [date, onDateChange, userId]);

  useFocusEffect(useCallback(() => {
    const unsubscribe = subscribeToTopicTarotDraws(userId, load);
    void load();
    return unsubscribe;
  }, [load, userId]));

  const cardId = topic && draws?.[topic.key];
  const selected = cardId === undefined ? undefined : getTopicCard(cardId);
  const card = selected && { id: selected.id, name: selected.name, orientation: 'upright' as const };
  const showReading = !animateReveal || revealFinished;
  const reading = topic && selected ? selected.readings[topic.key] : undefined;
  const insight = topic && selected ? selected.insight[topic.key] : undefined;
  const spec = topic && card && selected && reading && insight
    ? tarotSpec(nickname, topic.label, { ...card, keyword: selected.keyword }, reading, [selected.symbol, reading, insight].join('\n\n'))
    : null;

  const scrollToTop = () => scrollRef.current?.scrollTo({ y: 0, animated: !reduced });

  const selectTopic = (next: TarotTopic) => {
    if (!draws || topic) return;
    if (date !== todayISO()) return onDateChange();
    scrollToTop();
    setTopic(next);
    setDeck(dealTopicCards());
    setTopicDirection('enter');
  };

  const choose = async (id: number) => {
    if (!topic || selected || topicDirection || writing.current) return;
    writing.current = true;
    setSaving(true);
    setSaveFailed(false);
    try {
      const result = await saveTopicTarotDraw(userId, topic.key, date, id);
      if (!result || date !== todayISO()) return onDateChange();
      loadVersion.current += 1;
      setRevealFinished(false);
      scrollToTop();
      setAnimateReveal(result.newlySaved);
      setDraws(current => ({ ...current, [topic.key]: result.cardId }));
      void load();
    } catch {
      setSaveFailed(true);
    } finally {
      writing.current = false;
      setSaving(false);
    }
  };

  const resetLocalDraw = async () => {
    if (!LOCAL_TOOLS || !topic || !selected || writing.current) return;
    writing.current = true;
    setSaving(true);
    setResetFailed(false);
    try {
      if (!(await resetTopicTarotDraw(userId, topic.key, date))) return onDateChange();
      loadVersion.current += 1;
      scrollToTop();
      setDraws(current => ({ ...current, [topic.key]: undefined }));
      setDeck(dealTopicCards());
      setAnimateReveal(false);
      setRevealFinished(false);
      void load();
    } catch {
      setResetFailed(true);
    } finally {
      writing.current = false;
      setSaving(false);
    }
  };

  const reset = () => {
    if (topicDirection || writing.current) return;
    if (date !== todayISO()) return onDateChange();
    scrollToTop();
    setTopicDirection('return');
  };

  const changingTopic = !!topicDirection;
  const copyOpacity = topicMotion.interpolate({ inputRange: [0, 0.55, 0.95, 1], outputRange: [0, 0, 1, 1] });
  const copyRise = topicMotion.interpolate({ inputRange: [0, 0.55, 1], outputRange: [9, 9, 0] });
  const deckOpacity = topicMotion.interpolate({ inputRange: [0, 0.12, 0.48, 1], outputRange: [0, 0, 1, 1] });
  const deckTravel = topicMotion.interpolate({
    inputRange: [0, 0.22, 0.68, 0.92, 1], outputRange: [-162, -115, -13, 1, 0],
  });
  const deckScale = topicMotion.interpolate({ inputRange: [0, 0.75, 1], outputRange: [0.83, 1, 1] });
  const introOpacity = topicMotion.interpolate({ inputRange: [0, 0.08, 0.35, 1], outputRange: [1, 1, 0, 0] });
  const introMenuOpacity = topicMotion.interpolate({ inputRange: [0, 0.22, 1], outputRange: [1, 0, 0] });
  const revealStyle = { opacity: copyOpacity, transform: [{ translateY: copyRise }] };

  return (
    <Screen
      scrollRef={scrollRef}
      title="오늘의 타로"
      titleStyle={s.barTitle}
      bg={NIGHT}
      contentStyle={s.screen}
      right={!changingTopic && showReading && spec ? <ShareIconButton spec={spec} color={INK} /> : undefined}
      left={
        <Pressable
          onPress={topic ? reset : nav.goBack}
          disabled={saving || changingTopic}
          hitSlop={8}
          style={s.back}
          accessibilityRole="button"
          accessibilityLabel="뒤로 가기"
        >
          <Icon name="chevronLeft" size={24} color={INK} />
        </Pressable>
      }
    >
      {focused ? <StatusBar style="light" /> : null}
      <TarotScene recede={topicMotion} onReady={prepareScene} />
      <View style={s.stage}>
        {topic ? (
          <View pointerEvents={changingTopic ? 'none' : 'auto'} accessibilityElementsHidden={changingTopic} importantForAccessibility={changingTopic ? 'no-hide-descendants' : 'auto'} aria-hidden={changingTopic}>
            <Animated.View style={[s.dealPrompt, revealStyle]} testID="tarot-topic-prompt">
              <Text style={s.speaker}>타로술사 · {topic.label}</Text>
              <Text accessibilityRole="header" style={s.heading}>{selected ? '카드가 전하는 이야기' : '마음이 가는 카드 한 장'}</Text>
              <Text style={s.description}>
                {selected ? '오늘 이 주제에 뽑은 카드예요.' : topic.prompt}
              </Text>
            </Animated.View>
            {selected && card ? (
              <Animated.View style={{
                opacity: deckOpacity,
                transform: [
                  { translateY: topicMotion.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) },
                  { scale: deckScale },
                ],
              }}>
                <TarotReveal card={card} animate={animateReveal} onFinished={finishReveal} />
                {showReading ? (
                  <View style={s.result}>
                    <Text style={s.english}>{selected.englishName}</Text>
                    <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={s.cardName}>{selected.name}</Text>
                    <Text style={s.keyword}>{selected.keyword} · 정방향</Text>
                    <View style={s.reading}>
                      <Text accessibilityRole="header" style={s.speaker}>타로술사가 읽어주는 {topic.label}</Text>
                      <Text style={s.readingText}>{selected.symbol}</Text>
                      <Text style={s.readingText}>{reading}</Text>
                      <Text style={s.readingText}>{insight}</Text>
                    </View>
                    <Pressable accessibilityRole="button" onPress={reset} style={({ pressed }) => [s.restart, pressed && s.pressed]}>
                      <Icon name="refresh" size={16} color={NIGHT} />
                      <Text style={s.restartText}>다른 주제 보기</Text>
                    </Pressable>
                    {LOCAL_TOOLS ? (
                      <Pressable accessibilityRole="button" disabled={saving} onPress={resetLocalDraw} style={s.change}>
                        <Text style={s.localReset}>이 주제 뽑기 초기화 (테스트)</Text>
                      </Pressable>
                    ) : null}
                    {resetFailed ? <Text style={s.error} accessibilityLiveRegion="polite">뽑기 기록을 초기화하지 못했어요. 다시 눌러 주세요.</Text> : null}
                    <View style={s.promo}>
                      <PromoSlot screen="tarot" promo={promosOf(nav, date).consult} tone="mint" title="카드가 꺼낸 고민을 더 이야기해 볼까요?" cta="운알이와 대화하기 →" />
                    </View>
                  </View>
                ) : null}
              </Animated.View>
            ) : (
              <>
                <Animated.Text style={[s.deckNote, revealStyle]}>{TAROT_DECK_SIZE}장 중 한 장 · 주제마다 하루 한 번</Animated.Text>
                <Animated.View testID="tarot-topic-deck" style={{
                  opacity: deckOpacity,
                  transform: [{ translateY: deckTravel }, { scale: deckScale }],
                }}>
                  <TarotDeck cards={deck} disabled={saving || changingTopic} hintOpacity={copyOpacity} onChoose={choose} />
                </Animated.View>
                {saveFailed ? <Text style={s.error} accessibilityLiveRegion="polite">카드를 저장하지 못했어요. 다시 눌러 주세요.</Text> : null}
                <Animated.View style={revealStyle}>
                  <Pressable accessibilityRole="button" disabled={saving || changingTopic} onPress={reset} style={({ pressed }) => [s.change, pressed && s.pressed]}>
                    <Text style={s.changeText}>주제 다시 고르기</Text>
                  </Pressable>
                </Animated.View>
              </>
            )}
          </View>
        ) : null}
        {!topic || topicDirection ? (
          <Animated.View style={[topic && s.introOverlay, { opacity: introOpacity }]} pointerEvents={topic ? 'none' : 'auto'} accessibilityElementsHidden={!!topic} importantForAccessibility={topic ? 'no-hide-descendants' : 'auto'} aria-hidden={!!topic}>
            <View style={s.introFan}><TarotFan progress={gesture} /></View>
            {introPlayed ? (
              <Animated.View style={{ opacity: introMenuOpacity }}>
                <Animated.View style={{
                  opacity: topicEntrance,
                  transform: [{ translateY: topicEntrance.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
                }}>
                  <View style={s.intro}>
                    <Text style={s.speaker}>타로술사</Text>
                    <Text accessibilityRole="header" style={s.heading}>어떤 이야기가 궁금한가요?</Text>
                    <Text style={s.description}>주제마다 오늘의 카드 한 장을 뽑아 보세요.</Text>
                  </View>
                  <View style={s.topics}>
                    {TAROT_TOPICS.map(topic => (
                      <Pressable
                        key={topic.key}
                        onPress={() => selectTopic(topic)}
                        disabled={!draws}
                        accessibilityRole="button"
                        accessibilityLabel={topic.label}
                        accessibilityHint={draws?.[topic.key] !== undefined ? '오늘 뽑은 카드 해설 보기' : topic.hint}
                        style={({ pressed }) => [s.topic, pressed && s.topicPressed]}
                      >
                        <View style={s.topicIcon}><Icon name={topic.icon} size={18} color={GOLD} /></View>
                        <View style={s.topicCopy}>
                          <Text style={s.topicLabel}>{topic.label}</Text>
                          <Text style={s.topicHint}>{draws?.[topic.key] !== undefined ? '오늘의 풀이 보기' : topic.hint}</Text>
                        </View>
                        <Icon name="chevronRight" size={14} color={GOLD} />
                      </Pressable>
                    ))}
                  </View>
                  {!draws ? (
                    loadFailed ? (
                      <Pressable accessibilityRole="button" onPress={() => { setLoadFailed(false); void load(); }} style={s.change}>
                        <Text style={s.changeText}>뽑기 기록 다시 불러오기</Text>
                      </Pressable>
                    ) : <Text style={s.deckNote} accessibilityLiveRegion="polite">오늘의 뽑기 기록을 확인하고 있어요.</Text>
                  ) : null}
                </Animated.View>
              </Animated.View>
            ) : null}
          </Animated.View>
        ) : null}
      </View>
      <Text style={s.note}>카드의 상징을 재미로 읽어 보세요.</Text>
    </Screen>
  );
}

const s = StyleSheet.create({
  screen: { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 28 },
  back: { width: 34, minHeight: 44, justifyContent: 'center' },
  barTitle: { color: INK },
  stage: { position: 'relative' },
  introOverlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 },
  introFan: { marginTop: -62 },
  intro: { marginHorizontal: 20, marginTop: 12, alignItems: 'center' },
  dealPrompt: { marginHorizontal: 20, marginTop: -18, alignItems: 'center' },
  speaker: { ...sansW('600'), color: GOLD, fontSize: 13, lineHeight: 19, letterSpacing: 0.2 },
  heading: { ...sansW('700'), color: INK, fontSize: 25, lineHeight: 33, letterSpacing: -1.05, textAlign: 'center', marginTop: 5 },
  description: { ...sansW('400'), color: MUTE, fontSize: 14, lineHeight: 22, marginTop: 5, textAlign: 'center' },
  deckNote: { ...sansW('500'), color: GOLD, fontSize: 13, textAlign: 'center', marginTop: 12, marginHorizontal: 20 },
  error: { ...sansW('500'), color: '#FFC4C4', fontSize: 14, textAlign: 'center', margin: 12 },
  topics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginHorizontal: 20, marginTop: 20 },
  topic: { flexBasis: '47%', flexGrow: 1, paddingHorizontal: 8, paddingVertical: 10, minHeight: 62, gap: 5, flexDirection: 'row', alignItems: 'center', backgroundColor: '#25192F', borderColor: LINE, borderWidth: 1, borderRadius: 11 },
  topicPressed: { backgroundColor: '#3D2946', borderColor: GOLD },
  topicIcon: { padding: 3 },
  topicCopy: { flex: 1 },
  topicLabel: { ...sansW('700'), color: INK, fontSize: 15, lineHeight: 20, letterSpacing: -0.55 },
  topicHint: { ...sansW('400'), color: MUTE, fontSize: 11, lineHeight: 16, marginTop: 2, letterSpacing: -0.25 },
  result: { marginHorizontal: 20, alignItems: 'center' },
  english: { fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', web: 'Georgia, serif' }), color: GOLD, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  cardName: { ...sansW('700'), color: INK, fontSize: 27, lineHeight: 36, letterSpacing: -1, textAlign: 'center' },
  keyword: { ...sansW('500'), color: MUTE, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 2 },
  reading: { alignSelf: 'stretch', marginTop: 16, borderColor: LINE, borderWidth: 1, borderRadius: 12, padding: 16, backgroundColor: '#25192F', gap: 12 },
  readingText: { ...sansW('400'), color: INK, fontSize: 16, lineHeight: 26, letterSpacing: -0.25 },
  restart: { alignSelf: 'stretch', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8, minHeight: 48, padding: 10, marginTop: 12, borderRadius: 8, backgroundColor: GOLD },
  restartText: { ...sansW('700'), color: NIGHT, fontSize: 15 },
  promo: { alignSelf: 'stretch', marginTop: 12 },
  localReset: { ...sansW('500'), color: MUTE, fontSize: 13, textDecorationLine: 'underline' },
  change: { alignSelf: 'center', justifyContent: 'center', minHeight: 44, paddingHorizontal: 14 },
  changeText: { ...sansW('600'), color: GOLD, fontSize: 14, textDecorationLine: 'underline' },
  pressed: { opacity: 0.7 },
  note: { ...sansW('400'), color: '#AB9BB3', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 16, paddingHorizontal: 20 },
});
