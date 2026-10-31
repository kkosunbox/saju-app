import React, { useEffect, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import Screen from '../Screen';
import PressableScale from '../PressableScale';
import PrimaryButton from '../PrimaryButton';
import ShareCta from '../ShareCta';
import { useApp } from '../../context/AppContext';
import { useTarotDraw } from '../../services/content/opened';
import { useReducedMotion } from '../../utils/motion';
import { tarotSpec } from '../../services/share/shareSpecs';
import { colors } from '../../theme/colors';
import { fonts, sansW } from '../../theme/typography';
import { TarotReading } from '../../types';
import TarotCard from './TarotCard';

export default function TarotExperience({ reading }: { reading?: TarotReading }) {
  const { user, today, fortuneError, refreshFortune, fortune } = useApp();
  const { ready, opened, open } = useTarotDraw();
  const reduced = useReducedMotion();
  const [scale] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (!opened || reduced) return;
    scale.setValue(0);
    const animation = Animated.timing(scale, { toValue: 1, duration: 380, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [opened, reduced, scale]);
  const visible = ready && opened;
  return <Screen title="오늘의 타로" back>
    <View style={s.header}>
      <Text style={s.date}>{today.replaceAll('-', '.')} · 하루 한 장</Text>
      <Text style={s.title}>{visible && reading ? reading.name : '오늘, 나에게 온 카드'}</Text>
      <Text style={s.intro}>{visible && reading ? `${reading.englishName} · 정방향` : '카드 한 장에서 오늘의 선택을 위한 힌트를 찾아보세요.'}</Text>
    </View>
    <PressableScale onPress={open} disabled={!ready || opened || !reading} accessibilityLabel={visible ? '오늘의 타로 카드' : '오늘의 타로 카드 펼치기'} style={s.card}>
      <Animated.View style={{ transform: [{ perspective: 900 }, { rotateY: scale.interpolate({ inputRange: [0, 1], outputRange: ['-90deg', '0deg'] }) }] }}>
        <TarotCard width={216} reading={reading} hidden={!visible} />
      </Animated.View>
    </PressableScale>
    {!reading ? <View style={s.body}><Text style={[s.text, KEEP]}>{fortuneError ? '카드를 불러오지 못했어요.' : '오늘의 카드를 준비하고 있어요.'}</Text><PrimaryButton label="다시 불러오기" onPress={() => { void refreshFortune(); }} /></View>
      : !visible ? <View style={s.body}><PrimaryButton label="오늘의 카드 펼치기" onPress={open} disabled={!ready} /><Text style={s.note}>타로 카드만 펼쳐요. 카드는 하루 동안 같아요.</Text></View>
      : <View style={s.body}>
        <Text style={s.keyword}>{reading.keyword}</Text>
        <Text style={[s.message, KEEP]}>{reading.message}</Text>
        <Text style={[s.text, KEEP]}>{reading.meaning}</Text>
        <View style={s.rule} />
        <Text style={s.label}>오늘 해볼 일</Text><Text style={[s.text, KEEP]}>{reading.action}</Text>
        <Text style={s.label}>조심할 점</Text><Text style={[s.text, KEEP]}>{reading.caution}</Text>
        <View style={s.question}><Text style={s.label}>나에게 묻기</Text><Text style={[s.questionText, KEEP]}>{reading.question}</Text></View>
        <ShareCta spec={user ? tarotSpec(user, reading) : null} />
        {fortune?.viewpointsVersion === 'legacy' ? <Text style={s.note}>종합 운세는 뽑았을 당시의 풀이로 보관하고, 타로는 오늘의 메시지로 함께 보여드려요.</Text> : null}
      </View>}
    <Text style={s.note}>메이저 아르카나 22장의 상징으로 생각을 돌아보는 콘텐츠예요. 카드는 미래의 사건을 확정하지 않아요.</Text>
  </Screen>;
}
const KEEP = (Platform.OS === 'web' ? { wordBreak: 'keep-all' } : {}) as object;
const s = StyleSheet.create({
  header: { alignItems: 'center', paddingTop: 14 },
  date: { ...sansW('500'), fontSize: 12, color: colors.inkMute, letterSpacing: 1 },
  title: { fontFamily: fonts.serif, fontSize: 28, lineHeight: 38, color: colors.ink, marginTop: 14, textAlign: 'center' },
  intro: { ...sansW('400'), fontSize: 13, lineHeight: 21, color: colors.inkSub, textAlign: 'center', marginTop: 6, maxWidth: 280 },
  card: { alignSelf: 'center', marginVertical: 26 },
  body: { paddingHorizontal: 8, gap: 12 },
  keyword: { ...sansW('600'), fontSize: 12, color: '#9B7BBE', letterSpacing: 2, textAlign: 'center' },
  message: { fontFamily: fonts.serif, fontSize: 23, lineHeight: 34, color: colors.ink, textAlign: 'center', marginBottom: 8 },
  text: { ...sansW('400'), fontSize: 15, lineHeight: 25, color: colors.inkSub },
  label: { ...sansW('700'), fontSize: 13, lineHeight: 20, color: colors.ink, marginTop: 8 },
  rule: { height: 1, backgroundColor: colors.line, marginVertical: 10 },
  question: { borderLeftWidth: 2, borderLeftColor: '#B49ACF', paddingLeft: 16, marginTop: 12, paddingVertical: 4 },
  questionText: { fontFamily: fonts.serif, fontSize: 20, lineHeight: 30, color: colors.ink, marginTop: 8 },
  note: { ...sansW('400'), fontSize: 12, lineHeight: 20, textAlign: 'center', color: colors.inkMute, marginTop: 24, marginBottom: 12 },
});
