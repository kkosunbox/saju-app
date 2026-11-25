import { useCallback, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useIsFocused } from 'expo-router';
import { dealTopicCards, TAROT_TOPICS, TarotTopic } from '../../data/topicTarot';
import { useApp } from '../../context/AppContext';
import { useNavigation } from '@/navigation/compat';
import { promosOf } from '../../services/promo/promos';
import { tarotSpec } from '../../services/share/shareSpecs';
import { sansW } from '../../theme/typography';
import { useWebTopBar } from '../../utils/webThemeColor';
import Icon from '../Icon';
import PromoSlot from '../PromoSlot';
import Screen from '../Screen';
import ShareCta from '../ShareCta';
import TarotFan from './TarotFan';

const TAROT_READER_ART = require('../../../assets/tarot/reader.webp');

const NIGHT = '#140E1D';
const GOLD = '#E9BF83';
const INK = '#FFF6E8';
const MUTE = '#CFC0D4';
const LINE = '#503952';
const TOP_BAR = [[0, NIGHT]] as const;

interface Deal {
  topic: TarotTopic;
  cards: ReturnType<typeof dealTopicCards>;
}

export default function TarotExperience() {
  const { user, today } = useApp();
  const nav = useNavigation();
  const focused = useIsFocused();
  const [deal, setDeal] = useState<Deal>();
  const [chosenIndex, setChosenIndex] = useState<number>();
  const [revealed, setRevealed] = useState(false);
  const chosen = useRef(false);
  const reveal = useCallback(() => setRevealed(true), []);
  const selected = revealed && chosenIndex !== undefined ? deal?.cards[chosenIndex] : undefined;
  useWebTopBar(TOP_BAR);

  const selectTopic = (topic: TarotTopic) => {
    setDeal({ topic, cards: dealTopicCards() });
  };
  const choose = (index: number) => {
    if (!deal?.cards[index] || chosen.current) return;
    chosen.current = true;
    setChosenIndex(index);
  };
  const reset = () => {
    chosen.current = false;
    setDeal(undefined);
    setChosenIndex(undefined);
    setRevealed(false);
  };

  const spec = deal && selected
    ? tarotSpec(user?.nickname, deal.topic.label, { ...selected, orientation: 'upright' }, selected.readings[deal.topic.key])
    : null;

  return (
    <Screen
      key={deal ? 'deal' : 'intro'}
      title="오늘의 타로"
      titleStyle={s.barTitle}
      bg={NIGHT}
      contentStyle={s.screen}
      left={
        <Pressable
          onPress={nav.goBack}
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
      <View style={[s.hero, deal && s.heroDealt]}>
        <Image
          source={TAROT_READER_ART}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          contentPosition={{ top: '42%', left: '50%' }}
          accessible={false}
          draggable={false}
        />
        <LinearGradient
          colors={['rgba(20,14,29,0)', 'rgba(20,14,29,0.22)', NIGHT]}
          locations={[0, 0.65, 1]}
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
        />
      </View>

      {deal ? (
        <>
          <View style={s.dealPrompt}>
            <Text style={s.speaker}>타로술사 · {deal.topic.label}</Text>
            <Text accessibilityRole="header" style={s.heading}>{selected ? '카드가 전하는 이야기' : '마음이 가는 카드 한 장'}</Text>
            <Text style={s.description}>{selected ? '이 카드에서 지금의 흐름을 읽어 볼게요.' : deal.topic.prompt}</Text>
          </View>
          <TarotFan cards={deal.cards} chosenIndex={chosenIndex} onChoose={choose} onReveal={reveal} />
          {selected ? (
            <View style={s.result} accessibilityLiveRegion="polite">
              <Text style={s.english}>{selected.englishName}</Text>
              <Text accessibilityRole="header" style={s.cardName}>{selected.name}</Text>
              <Text style={s.keyword}>{selected.keyword} · 정방향</Text>
              <View style={s.reading}>
                <Text style={s.speaker}>타로술사가 읽어주는 {deal.topic.label}</Text>
                <Text style={s.readingText}>{selected.readings[deal.topic.key]}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={reset}
                style={({ pressed }) => [s.restart, pressed && s.pressed]}
              >
                <Icon name="refresh" size={16} color={NIGHT} />
                <Text style={s.restartText}>다른 주제도 뽑아보기</Text>
              </Pressable>
              <ShareCta spec={spec} style={s.share} />
              <View style={s.share}>
                <PromoSlot screen="tarot" promo={promosOf(nav, today).consult} tone="mint" title="카드가 꺼낸 고민을 더 이야기해 볼까요?" />
              </View>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={reset}
              style={({ pressed }) => [s.change, pressed && s.pressed]}
            >
              <Text style={s.changeText}>주제 다시 고르기</Text>
            </Pressable>
          )}
        </>
      ) : (
        <>
          <View style={s.introFan}><TarotFan /></View>
          <View style={s.intro}>
            <Text style={s.speaker}>타로술사</Text>
            <Text accessibilityRole="header" style={s.heading}>어떤 이야기가 궁금한가요?</Text>
            <Text style={s.description}>궁금한 주제를 고르면 카드를 펼쳐 드릴게요.</Text>
          </View>
          <View style={s.topics}>
            {TAROT_TOPICS.map(topic => (
              <Pressable
                key={topic.key}
                onPress={() => selectTopic(topic)}
                accessibilityRole="button"
                accessibilityLabel={topic.label}
                accessibilityHint={topic.hint}
                style={({ pressed }) => [s.topic, pressed && s.topicPressed]}
              >
                <View style={s.topicIcon}><Icon name={topic.icon} size={18} color={GOLD} /></View>
                <View style={s.topicCopy}>
                  <Text style={s.topicLabel}>{topic.label}</Text>
                  <Text style={s.topicHint}>{topic.hint}</Text>
                </View>
                <Icon name="chevronRight" size={14} color={GOLD} />
              </Pressable>
            ))}
          </View>
        </>
      )}
      <Text style={s.note}>카드의 상징을 재미로 읽어 보세요.</Text>
    </Screen>
  );
}

const s = StyleSheet.create({
  screen: { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 28 },
  back: { width: 34, minHeight: 44, justifyContent: 'center' },
  barTitle: { color: INK },
  hero: { height: 260, overflow: 'hidden', backgroundColor: '#251728' },
  heroDealt: { height: 198 },
  introFan: { marginTop: -64 },
  intro: { marginHorizontal: 20, marginTop: 12, alignItems: 'center' },
  dealPrompt: { marginHorizontal: 20, marginTop: -18, alignItems: 'center' },
  speaker: { ...sansW('600'), color: GOLD, fontSize: 13, lineHeight: 19, letterSpacing: 0.2 },
  heading: { ...sansW('700'), color: INK, fontSize: 25, lineHeight: 33, letterSpacing: -1.05, textAlign: 'center', marginTop: 5 },
  description: { ...sansW('400'), color: MUTE, fontSize: 14, lineHeight: 22, marginTop: 5, textAlign: 'center' },
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
  reading: { alignSelf: 'stretch', marginTop: 16, borderColor: LINE, borderWidth: 1, borderRadius: 12, padding: 16, backgroundColor: '#25192F', gap: 7 },
  readingText: { ...sansW('400'), color: INK, fontSize: 16, lineHeight: 26, letterSpacing: -0.25 },
  restart: { alignSelf: 'stretch', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8, minHeight: 48, padding: 10, marginTop: 12, borderRadius: 8, backgroundColor: GOLD },
  restartText: { ...sansW('700'), color: NIGHT, fontSize: 15 },
  share: { alignSelf: 'stretch', marginTop: 12 },
  change: { alignSelf: 'center', justifyContent: 'center', minHeight: 44, paddingHorizontal: 14 },
  changeText: { ...sansW('600'), color: GOLD, fontSize: 14, textDecorationLine: 'underline' },
  pressed: { opacity: 0.7 },
  note: { ...sansW('400'), color: '#AB9BB3', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 16, paddingHorizontal: 20 },
});
