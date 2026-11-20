import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@/navigation/compat';
import PressableScale from '../PressableScale';
import HScroll from '../HScroll';
import { HomeFreeArt } from './HomeDesignAssets';
import { colors, isDark } from '../../theme/colors';
import { radius, sansW } from '../../theme/typography';

type Kind = 'tal' | 'mbti' | 'char' | 'past' | 'star';
const ITEMS: Record<Kind, { title: string; sub: string; to: string }> = {
  tal: { title: '오늘의 부적', sub: '오늘 부적 받기', to: 'Talisman' },
  mbti: { title: '찰떡 MBTI', sub: '잘맞는 유형은?', to: 'MbtiMatch' },
  char: { title: '사주 캐릭터', sub: '나의 캐릭터는?', to: 'Character' },
  past: { title: '전생테스트', sub: '나의 전생은?', to: 'PastLife' },
  star: { title: '연예인 궁합', sub: '오늘의 천생연분', to: 'StarMatch' },
};
const DEFAULT_KINDS: Kind[] = ['tal', 'mbti', 'char', 'past', 'star'];

/** 무료 콘텐츠 카드 줄 — 홈 '무료로 즐기기'와 같은 카드. inset: 좌우 여백(가로 스크롤 안쪽) */
export default function FreeContentRow({ inset, kinds = DEFAULT_KINDS }: { inset: number; kinds?: readonly Kind[] }) {
  const nav = useNavigation();
  return (
    <View>
      <Text style={[s.heading, { paddingHorizontal: inset }]} accessibilityRole="header">무료로 즐기기</Text>
      <HScroll contentContainerStyle={{ paddingHorizontal: inset, gap: 12 }}>
        {kinds.map(k => {
          const { title, sub, to } = ITEMS[k];
          return (
            <PressableScale key={k} onPress={() => nav.navigate(to as never)} style={[s.card, s[k]]} scaleTo={0.96} accessibilityLabel={`${title}, ${sub}`}>
              <View style={s.top}><HomeFreeArt kind={k} /></View>
              <Text style={[s.title, k === 'mbti' && s.titleDark]}>{title}</Text>
              <Text style={[s.sub, k === 'mbti' && s.subDark]} numberOfLines={1}>{sub}</Text>
            </PressableScale>
          );
        })}
      </HScroll>
    </View>
  );
}

// 홈 무료로 즐기기 카드(HomeScreen freeCard)와 같은 모양
const s = StyleSheet.create({
  heading: { ...sansW('700'), fontSize: 16, lineHeight: 20, color: colors.ink, letterSpacing: -0.64, marginBottom: 12, includeFontPadding: false },
  card: { width: 116, height: 118, padding: 16, borderRadius: radius.lg, backgroundColor: colors.card },
  tal: { backgroundImage: isDark ? undefined : 'linear-gradient(221.36886913927867deg, #FFD277 33.96%, #FDFCF5 62.549%, #FFE399 95.265%)' },
  mbti: { backgroundColor: '#1D212D' },
  char: { backgroundColor: isDark ? colors.card : '#DFE9FF' },
  past: { backgroundColor: isDark ? colors.card : '#F2EEFB' },
  star: { backgroundColor: isDark ? colors.card : '#FFF0F3' },
  top: { height: 39, marginBottom: 8, justifyContent: 'center' },
  title: { ...sansW('700'), fontSize: 14, lineHeight: 17, color: colors.ink, letterSpacing: -0.56, includeFontPadding: false },
  titleDark: { color: '#FFFFFF' },
  sub: { ...sansW('500'), fontSize: 13, lineHeight: 18, color: isDark ? colors.inkSub : '#555555', letterSpacing: -0.65, marginTop: 4, includeFontPadding: false },
  subDark: { color: '#999999' },
});
