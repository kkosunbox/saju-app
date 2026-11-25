import React, { useMemo } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@/navigation/compat';
import SectionHeader from '../../components/SectionHeader';
import PressableScale from '../../components/PressableScale';
import StarAvatar from '../../components/StarAvatar';
import { useContentScope } from '../../context/ContentScopeContext';
import { colors } from '../../theme/colors';
import { radius, sansW } from '../../theme/typography';
import type { StarCard } from '../../types/content';

/** '다른 연예인'은 반대 성별에서 랜덤 몇 명만 */
const OTHERS = 5;

const shuffled = <T,>(items: T[]) => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/** 남자 프로필은 여자 연예인만, 여자 프로필은 남자 연예인만 (성별을 모르면 모두) */
export const oppositeOf = (gender?: string | null) => (gender === 'male' ? 'female' : gender === 'female' ? 'male' : null);
export const forGender = <T extends { gender?: string | null }>(stars: T[], gender?: string | null) => {
  const opposite = oppositeOf(gender);
  return opposite ? stars.filter(st => st.gender === opposite) : stars;
};

/**
 * 다른 연예인과의 궁합 — 지금 보고 있는 연예인을 빼고 반대 성별에서 다섯 명을 랜덤으로 (화면을 열 때 한 번 섞는다).
 * 연예인 궁합 결과 화면과 연예인 한 명과의 궁합 화면에서 같이 쓴다. '연예인 검색'으로 전체 목록.
 * 연예인 화면(inDetail)에서는 뒤로가기가 쌓이지 않게: 다른 연예인은 지금 화면을 바꿔 끼우고,
 * 검색은 스택에 이미 있으면 거기로 돌아가고 없으면 지금 화면을 바꿔 끼운다 (결과 → 검색 → 연예인, 많아야 세 겹).
 */
export default function StarOthers({ stars, exclude, gender, inDetail }: { stars: StarCard[]; exclude?: number | null; gender?: string | null; inDetail?: boolean }) {
  const nav = useNavigation();
  const scope = useContentScope();
  const others = useMemo(
    () => shuffled(forGender(stars, gender).filter(st => st.id !== exclude)).slice(0, OTHERS),
    [stars, exclude, gender],
  );
  if (!others.length) return null;
  const profileId = scope?.profileId ?? undefined;
  const open = (star: StarCard) => (inDetail ? nav.replace : nav.navigate)('StarMatchDetail', { id: String(star.id), profileId });
  const search = () => {
    const href = { pathname: '/star/search', params: { profileId } } as const;
    if (inDetail) router.dismissTo(href);
    else router.push(href);
  };
  return (
    <>
      <SectionHeader
        title="다른 연예인과의 궁합"
        action="연예인 검색"
        onAction={search}
      />
      <View style={s.row}>
        {others.map(star => (
          <PressableScale key={star.id} onPress={() => open(star)} style={s.cell} scaleTo={0.94} accessibilityLabel={`${star.name}, 오늘의 궁합 보기`}>
            <StarAvatar name={star.name} gender={star.gender} size={36} />
            <Text style={s.cellName} numberOfLines={1}>{star.name}</Text>
            <Text style={s.cellSub} numberOfLines={1}>{star.character}</Text>
          </PressableScale>
        ))}
      </View>
    </>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', paddingVertical: 16, borderRadius: radius.lg, backgroundColor: colors.card },
  cell: { flex: 1, minWidth: 0, alignItems: 'center', paddingHorizontal: 2 },
  cellName: { ...sansW('700'), fontSize: 13, lineHeight: 18, letterSpacing: -0.5, color: colors.ink, marginTop: 6 },
  cellSub: { ...sansW('500'), fontSize: 10, lineHeight: 14, color: colors.inkMute, letterSpacing: -0.3 },
});
