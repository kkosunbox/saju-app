/**
 * 보유 콘텐츠 — 어느 프로필로 어떤 유료 콘텐츠를 가졌는지 한눈에. 누르면 그 프로필(·그 기록)로 바로 연다.
 * 마이페이지 「프리미엄 콘텐츠 · 보유 N개」에서 들어온다. 개수와 목록은 같은 기준(ownedContents)을 쓴다.
 */
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import PressableScale from '../../components/PressableScale';
import PrimaryButton from '../../components/PrimaryButton';
import FigmaAsset from '../../components/profile/FigmaAsset';
import { SubHead } from '../../components/premium/Kit';
import { useApp } from '../../context/AppContext';
import { usePremium } from '../../context/PremiumContext';
import { compatApi, compatKeys } from '../../services/server/compatApi';
import { petApi, petKeys } from '../../services/server/petApi';
import { hrefOfKey, titleOfKey } from '../../services/premium/catalog';
import { OwnedContent, byRecordKey, ownedContents } from '../../services/premium/owned';
import { RELATIONSHIP_LABEL } from '../../types';
import { colors } from '../../theme/colors';
import { sansW } from '../../theme/typography';

interface Row { id: string; title: string; caption: string; href: string | null }
interface Group { id: string; title: string; caption?: string; rows: (Row & { at: string })[] }

const dot = (d: string) => d.slice(0, 10).replace(/-/g, '.');

export default function OwnedContentScreen() {
  const { user, profiles } = useApp();
  const { entitlements } = usePremium();
  const primaryId = user?.profileId ?? null;
  const owned = useMemo(() => ownedContents(entitlements, primaryId), [entitlements, primaryId]);

  // 궁합 · 속마음은 상대 이름, 반려동물은 아이 이름을 붙인다 (각 화면과 같은 캐시를 쓴다)
  const needCompat = owned.some(o => byRecordKey(o.contentKey));
  const needPet = owned.some(o => o.contentKey.startsWith('pet:'));
  const compat = useQuery({ queryKey: [...compatKeys.list, user?.id, user?.version], queryFn: () => compatApi.list(user!.id), enabled: !!user && needCompat });
  const pets = useQuery({ queryKey: [...petKeys.list, user?.id, '', user?.version], queryFn: () => petApi.list(), enabled: !!user && needPet });

  const groups = useMemo(() => {
    const byProfile = new Map<string, Group>();
    const groupOf = (profileId: number | null, fallbackName: string | null): Group => {
      const p = profiles.find(x => x.profileId === profileId);
      const id = p ? String(p.profileId) : `gone:${profileId ?? ''}`;
      let g = byProfile.get(id);
      if (!g) {
        g = p
          ? { id, title: p.nickname, caption: p.isPrimary ? '대표 프로필' : RELATIONSHIP_LABEL[p.relationship ?? 'other'], rows: [] }
          : { id, title: fallbackName ?? '지운 프로필', caption: '지금은 없는 프로필이에요', rows: [] };
        byProfile.set(id, g);
      }
      return g;
    };
    const rowOf = (o: OwnedContent): { row: Row & { at: string }; profileId: number | null } => {
      const e = o.entitlement;
      const [kind, arg] = o.contentKey.split(':');
      let title = titleOfKey(o.contentKey);
      let profileId = o.profileId;
      if (kind === 'compat' || kind === 'crush') {
        const rec = compat.data?.find(r => r.id === Number(arg));
        if (rec) title = kind === 'compat' ? `${rec.target.nickname}님과 심층 궁합` : `${rec.target.nickname}님의 속마음`;
        profileId = rec?.profileId ?? primaryId;
      } else if (kind === 'pet') {
        const pet = pets.data?.find(x => x.id === Number(arg));
        if (pet) title = `${pet.name} · 반려동물 궁합`;
      }
      // 날짜만 — 처음 연 날 (아직 안 열었으면 산 날)
      const caption = dot(e.openedOn ?? e.createdAt);
      const href = hrefOfKey(o.contentKey, { profileId: o.profileId, entitlementId: e.current ? null : e.id });
      return { row: { id: `${o.contentKey}|${o.profileId ?? ''}`, title, caption, href, at: e.createdAt }, profileId };
    };
    for (const o of owned) {
      const { row, profileId } = rowOf(o);
      groupOf(profileId, o.entitlement.nickname).rows.push(row);
    }
    // 프로필 목록 순서(대표 먼저), 지운 프로필은 맨 뒤 · 안에서는 최근에 산 순
    const order = (g: Group) => { const i = profiles.findIndex(p => String(p.profileId) === g.id); return i < 0 ? profiles.length : i; };
    const list = [...byProfile.values()].sort((a, b) => order(a) - order(b));
    list.forEach(g => g.rows.sort((a, b) => b.at.localeCompare(a.at)));
    return list;
  }, [owned, profiles, primaryId, compat.data, pets.data]);

  return (
    <Screen title="보유 콘텐츠" back>
      {groups.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyTitle}>아직 가진 프리미엄 콘텐츠가 없어요</Text>
          <Text style={s.emptyCaption}>상세 사주 · 신년운세 · 평생운 같은 풀이를 열면 여기에 모여요</Text>
          <PrimaryButton label="콘텐츠 둘러보기 →" onPress={() => router.navigate('/content')} small style={{ marginTop: 20, alignSelf: 'stretch' }} />
        </View>
      ) : (
        groups.map((g, i) => (
          <View key={g.id}>
            <SubHead title={`${g.title} · ${g.rows.length}개`} caption={g.caption} first={i === 0} />
            <Card style={s.card}>
              {g.rows.map((r, j) => (
                <PressableScale
                  key={r.id}
                  onPress={r.href ? () => router.push(r.href as Href) : undefined}
                  disabled={!r.href}
                  scaleTo={0.98}
                  style={[s.row, j > 0 && s.line]}
                  accessibilityLabel={`${g.title} ${r.title} 보기`}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={s.title} numberOfLines={1}>{r.title}</Text>
                    <Text style={s.caption} numberOfLines={1}>{r.caption}</Text>
                  </View>
                  <View style={s.arrow}><FigmaAsset name="chevron" /></View>
                </PressableScale>
              ))}
            </Card>
          </View>
        ))
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  card: { paddingVertical: 0, paddingHorizontal: 15 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 60, paddingVertical: 10 },
  line: { borderTopWidth: 1, borderTopColor: colors.lineStrong },
  title: { ...sansW('600'), fontSize: 14, lineHeight: 18, letterSpacing: -0.7, color: colors.ink },
  caption: { ...sansW('500'), fontSize: 12, lineHeight: 16, letterSpacing: -0.6, color: colors.inkMute },
  arrow: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 24 },
  emptyTitle: { ...sansW('700'), fontSize: 16, lineHeight: 22, letterSpacing: -0.64, color: colors.ink, textAlign: 'center' },
  emptyCaption: { ...sansW('500'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.inkMute, textAlign: 'center', marginTop: 6 },
});
