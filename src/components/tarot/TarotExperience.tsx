import React, { useEffect, useState } from 'react';
import { Animated, ImageBackground, Platform, StyleSheet, Text, View } from 'react-native';
import Screen from '../Screen';
import PressableScale from '../PressableScale';
import PrimaryButton from '../PrimaryButton';
import ShareCta, { ShareIconButton } from '../ShareCta';
import SectionHeader from '../SectionHeader';
import SolidIcon from '../SolidIcon';
import { Logo } from '../Mascot';
import { PointPill } from '../HeaderPoints';
import { useApp } from '../../context/AppContext';
import { useTarotDraw } from '../../services/content/opened';
import { useReducedMotion } from '../../utils/motion';
import { tarotSpec } from '../../services/share/shareSpecs';
import { colors, isDark } from '../../theme/colors';
import { radius, sansW } from '../../theme/typography';
import { TarotReading } from '../../types';
import TarotCard from './TarotCard';
import PromoSlot from '../PromoSlot';
import { useNavigation } from '@/navigation/compat';
import { promosOf } from '../../services/promo/promos';

// 밤하늘 · 구름 그림 (카드 자리는 비워 둔 그림 — 카드는 위에 따로 얹는다)
const HERO_BG = require('../../../assets/images/tarot-hero-bg.webp');

export default function TarotExperience({ reading }: { reading?: TarotReading }) {
  const { user, today, fortuneError, refreshFortune, fortune } = useApp();
  const { ready, opened, open } = useTarotDraw();
  const reduced = useReducedMotion();
  const nav = useNavigation();
  const [scale] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (!opened || reduced) return;
    scale.setValue(0);
    const animation = Animated.timing(scale, { toValue: 1, duration: 380, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [opened, reduced, scale]);
  const visible = ready && opened;
  const spec = visible && reading && user ? tarotSpec(user, reading) : null;
  return <Screen title="오늘의 타로" back right={<><PointPill /><ShareIconButton spec={spec} /></>}>
    <ImageBackground source={HERO_BG} style={s.hero} imageStyle={s.heroImg} resizeMode="cover">
      <View style={s.logo}><Logo height={36 * 55 / 65} /></View>
      <Text style={s.date}>{today.replaceAll('-', '.')} · 하루 한 장</Text>
      <Text style={s.title}>{visible && reading ? reading.name : '오늘, 나에게 온 카드'}</Text>
      <Text style={[s.intro, KEEP]}>{visible && reading ? `${reading.englishName} · ${reading.orientation === 'reversed' ? '역방향' : '정방향'}` : '카드 한 장에서 오늘의 선택을 위한 힌트를 찾아보세요.'}</Text>
      <PressableScale onPress={open} disabled={!ready || opened || !reading} accessibilityLabel={visible ? '오늘의 타로 카드' : '오늘의 타로 카드 펼치기'} style={s.card}>
        <Animated.View style={[s.cardGlow, { transform: [{ perspective: 900 }, { rotateY: scale.interpolate({ inputRange: [0, 1], outputRange: ['-90deg', '0deg'] }) }] }]}>
          <TarotCard width={118} reading={reading} hidden={!visible} />
        </Animated.View>
      </PressableScale>
      {visible && reading ? <>
        <View style={s.chip}><Text style={s.chipText}>{reading.keyword}</Text></View>
        <Text style={[s.message, KEEP]}>{reading.message}</Text>
      </> : null}
    </ImageBackground>
    {!reading ? <View style={s.body}><Text style={[s.text, KEEP]}>{fortuneError ? '카드를 불러오지 못했어요.' : '오늘의 카드를 준비하고 있어요.'}</Text><PrimaryButton label="다시 불러오기" onPress={() => { void refreshFortune(); }} /></View>
      : !visible ? <View style={s.body}><PrimaryButton label="오늘의 카드 펼치기" onPress={open} disabled={!ready} /><Text style={s.note}>타로 카드만 펼쳐요. 카드는 하루 동안 같아요.</Text></View>
      : <>
        <View style={s.keywordBox}>
          <View style={s.keywordHead}><SolidIcon name="tarot" size={20} color={TAROT_PURPLE} /><Text style={s.keywordTitle}>오늘의 키워드</Text></View>
          <Text style={[s.text, KEEP]}>{reading.meaning}</Text>
        </View>
        <SectionHeader title="오늘의 가이드" variant="figma" />
        <View style={{ gap: 16 }}>
          <Guide title="오늘 해볼 일" text={reading.action} />
          <Guide title="조심할 점" text={reading.caution} />
          <Guide title="나에게 묻기" text={reading.question} dark />
        </View>
        <ShareCta spec={spec} style={{ marginTop: 32 }} />
        {/* 카드가 던진 질문을 이어서 물어볼 곳 */}
        <View style={{ marginTop: 12 }}><PromoSlot screen="tarot" promo={promosOf(nav, today).consult} tone="mint" title="카드의 질문, 더 이야기해 보고 싶다면" /></View>
        {fortune?.viewpointsVersion === 'legacy' ? <Text style={s.note}>종합 운세는 뽑았을 당시의 풀이로 보관하고, 타로는 오늘의 메시지로 함께 보여드려요.</Text> : null}
      </>}
    <Text style={[s.note, KEEP]}>메이저 아르카나 22장의 상징으로 생각을 돌아보는 콘텐츠예요. 카드는 미래의 사건을 확정하지 않아요.</Text>
  </Screen>;
}

/** 오늘의 가이드 한 칸 — 책 아이콘 + 굵은 제목 + 한 줄. dark 면 남색 칸(나에게 묻기) */
function Guide({ title, text, dark }: { title: string; text: string; dark?: boolean }) {
  return (
    <View style={[s.guide, dark && { backgroundColor: colors.navy }]}>
      <View style={s.guideHead}><SolidIcon name="book" size={20} color={colors.accent} /><Text style={[s.guideTitle, dark && { color: colors.white }]}>{title}</Text></View>
      <Text style={[s.guideText, dark && { color: colors.white, lineHeight: 18 }, KEEP]}>{text}</Text>
    </View>
  );
}

const KEEP = (Platform.OS === 'web' ? { wordBreak: 'keep-all' } : {}) as object;
const TAROT_PURPLE = '#B157FB';
const s = StyleSheet.create({
  hero: { minHeight: 393, borderRadius: radius.lg, overflow: 'hidden', alignItems: 'center', paddingTop: 32, paddingHorizontal: 16, paddingBottom: 22, marginTop: 4 },
  heroImg: { width: '100%', height: '100%', borderRadius: radius.lg },
  logo: { position: 'absolute', left: 16, top: 12 },
  // 그림이 어두워 화면 모드와 상관없이 밝은 글자
  date: { ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: '#DDDDDD' },
  title: { ...sansW('700'), fontSize: 28, lineHeight: 34, letterSpacing: -1.4, color: '#FFF386', marginTop: 8, textAlign: 'center' },
  intro: { ...sansW('500'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: '#FFFFFF', textAlign: 'center', marginTop: 2, maxWidth: 280 },
  card: { marginTop: 25 },
  cardGlow: { borderRadius: 7, shadowColor: '#FEF7DB', shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 2, height: 2 } },
  chip: { marginTop: 11, borderWidth: 1, borderColor: '#6270B7', borderRadius: 5, paddingHorizontal: 4, paddingVertical: 2 },
  chipText: { ...sansW('600'), fontSize: 12, lineHeight: 14, color: '#6270B7' },
  // 아래쪽 밝은 구름 위라 어두운 글자
  message: { ...sansW('700'), fontSize: 16, lineHeight: 20, letterSpacing: -0.8, color: '#000000', textAlign: 'center', marginTop: 6 },
  body: { paddingHorizontal: 8, gap: 12, marginTop: 24 },
  keywordBox: { marginTop: 16, borderRadius: radius.lg, backgroundColor: isDark ? colors.card : '#F2F4FF', padding: 16, gap: 7 },
  keywordHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  keywordTitle: { ...sansW('600'), fontSize: 16, lineHeight: 20, letterSpacing: -0.8, color: colors.ink },
  text: { ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.ink },
  guide: { borderRadius: radius.sm, backgroundColor: colors.card, padding: 16 },
  guideHead: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 17 }, // 아이콘(20)은 제목 줄(17) 위아래로 살짝 넘친다
  guideTitle: { ...sansW('700'), fontSize: 14, lineHeight: 17, letterSpacing: -0.56, color: colors.ink },
  guideText: { ...sansW('400'), fontSize: 13, lineHeight: 16, letterSpacing: -0.65, color: colors.ink, marginTop: 4 },
  note: { ...sansW('400'), fontSize: 12, lineHeight: 17, letterSpacing: -0.48, textAlign: 'center', color: isDark ? colors.inkMute : '#838383', marginTop: 24, marginBottom: 12, paddingHorizontal: 20 },
});
