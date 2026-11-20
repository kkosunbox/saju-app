import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@/navigation/compat';
import Screen from '../../components/Screen';
import ShareActions from '../../components/ShareActions';
import { ShareIconButton } from '../../components/ShareCta';
import ProfileSwitch from '../../components/premium/ProfileSwitch';
import PrimaryButton from '../../components/PrimaryButton';
import PressableScale from '../../components/PressableScale';
import Reveal from '../../components/Reveal';
import LoadingScreen from '../../components/LoadingScreen';
import StarRoulette from '../../components/StarRoulette';
import { CharacterAvatar } from '../../components/CharacterScene';
import { SubHead } from '../../components/premium/Kit';
import { PointPill } from '../../components/HeaderPoints';
import { useApp } from '../../context/AppContext';
import { useContentScope } from '../../context/ContentScopeContext';
import { useOpened } from '../../services/content/opened';
import { useStarMatch } from '../../services/server/starApi';
import { starSpec } from '../../services/share/shareSpecs';
import { colors } from '../../theme/colors';
import { parseISO } from '../../utils/date';
import { LOCAL_TOOLS } from '../../utils/devTools';
import { radius, sansW, txt } from '../../theme/typography';
import type { StarCard } from '../../types/content';

/** 결과 아래 '다른 스타'는 남녀 가리지 않고 랜덤 몇 명만 */
const OTHERS = 5;

const shuffled = <T,>(items: T[]) => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/**
 * 무료: 천생연분 스타 — 오늘의 궁합. 오늘 나와 가장 잘 맞는 반대 성별 스타 세 명을 돌림판에 올려 한 명을 뽑는다.
 * 점수는 날마다 바뀌고 날마다 새로 뽑는다. 결과 아래에는 다른 스타 다섯 명을 랜덤으로 보여 준다 (점수 없이).
 */
export default function StarMatchScreen() {
  const nav = useNavigation();
  const { user: u, today } = useApp();
  const scope = useContentScope();
  const q = useStarMatch();
  const draw = useOpened('celebrity-match');
  const [drawn, setDrawn] = useState(false);
  // 다른 스타: 남녀 가리지 않고 랜덤 다섯 명 (화면을 열 때 한 번 섞는다)
  const data = q.data;
  const pick = data?.pick ?? null;
  const others = useMemo(() => shuffled((data?.stars ?? []).filter(st => st.id !== pick?.id)).slice(0, OTHERS), [data, pick]);
  if (!u) return null;
  if (!data || !draw.ready) return <LoadingScreen title="천생연분 스타" error={q.error} onRetry={q.refetch} />;
  const open = (star: StarCard) => nav.navigate('StarMatchDetail', { id: String(star.id), profileId: scope?.profileId ?? undefined });

  const { m, d } = parseISO(today);
  // 오늘 아직 안 돌렸으면 돌림판부터
  if (!draw.opened && pick) {
    return (
      <Screen title="천생연분 스타" back>
        <ProfileSwitch style={{ marginBottom: 12 }} />
        <Text style={[txt.title, { marginTop: 8, marginBottom: 20 }]}>오늘의 천생연분 스타는?</Text>
        <StarRoulette pick={pick} finalists={data.finalists} onDone={() => { setDrawn(true); draw.open(); }} />
      </Screen>
    );
  }

  const spec = pick ? starSpec(u, pick, data.me) : null;
  const wrap = (node: React.ReactNode) => (drawn ? <Reveal>{node}</Reveal> : node);
  return (
    <Screen title="천생연분 스타" back right={<View style={s.headRight}><PointPill attendHint quiet /><ShareIconButton spec={spec} /></View>}>
      <ProfileSwitch style={{ marginBottom: 12 }} />
      {pick ? wrap(
        <View>
          <View style={s.hero}>
            <Text style={s.heroEyebrow}>{m}월 {d}일 · 오늘의 천생연분</Text>
            <View style={s.pair}>
              <View style={s.side}>
                <CharacterAvatar hanja={data.me.hanja} size={72} />
                <Text style={s.sideName} numberOfLines={1}>{data.me.character}</Text>
              </View>
              <View style={s.side}>
                <CharacterAvatar hanja={pick.hanja} size={72} />
                <Text style={s.sideName} numberOfLines={1}>{pick.character}</Text>
              </View>
            </View>
            <Text style={s.heroName}>{pick.name}</Text>
            {pick.description ? <Text style={s.heroDesc}>{pick.description}</Text> : null}
            <Text style={s.heroScore}>오늘의 궁합 <Text style={s.scoreValue}>{pick.score}점</Text></Text>
          </View>
          <PrimaryButton label={`${pick.name}님과 궁합 자세히 보기 →`} onPress={() => open(pick)} style={{ marginTop: 12 }} />
          {LOCAL_TOOLS ? (
            <PressableScale onPress={() => { draw.reset(); setDrawn(false); }} hitSlop={4} scaleTo={0.9} style={s.devReset} accessibilityLabel="돌림판 돌리기 전으로 되돌리기 (로컬 테스트용)">
              <Text style={s.devResetText}>결과 초기화 (로컬)</Text>
            </PressableScale>
          ) : null}
        </View>,
      ) : (
        <View style={s.empty}><Text style={txt.body}>지금은 볼 수 있는 스타가 없어요. 잠시 후 다시 찾아 주세요.</Text></View>
      )}

      {spec ? <ShareActions spec={spec} title="나의 천생연분 스타를 공유해 볼까요?" sub="오늘의 궁합 점수까지 카드 한 장에 담았어요" marginTop={16} /> : null}

      <SubHead title="다른 스타와 오늘의 궁합" />
      <View style={s.row}>
        {others.map(star => (
          <PressableScale key={star.id} onPress={() => open(star)} style={s.cell} scaleTo={0.94} accessibilityLabel={`${star.name}, 오늘의 궁합 보기`}>
            <CharacterAvatar hanja={star.hanja} size={42} />
            <Text style={s.cellName} numberOfLines={1}>{star.name}</Text>
            <Text style={s.cellSub} numberOfLines={1}>{star.character}</Text>
          </PressableScale>
        ))}
      </View>

    </Screen>
  );
}

const s = StyleSheet.create({
  headRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hero: { borderRadius: radius.lg, backgroundColor: colors.heroBg, paddingTop: 20, paddingBottom: 24, paddingHorizontal: 16, alignItems: 'center' },
  heroEyebrow: { ...sansW('600'), fontSize: 13, lineHeight: 18, letterSpacing: -0.5, color: 'rgba(255,255,255,0.7)' },
  pair: { alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 18 },
  side: { flex: 1, minWidth: 0, maxWidth: 96, alignItems: 'center' },
  sideName: { ...sansW('600'), fontSize: 12, lineHeight: 16, color: 'rgba(255,255,255,0.75)', marginTop: 6, letterSpacing: -0.4 },
  heroName: { ...sansW('800'), fontSize: 30, lineHeight: 38, letterSpacing: -1.4, color: '#FFFFFF', marginTop: 14 },
  heroDesc: { ...sansW('500'), fontSize: 13, lineHeight: 18, color: 'rgba(255,255,255,0.7)', marginTop: 4, textAlign: 'center' },
  heroScore: { ...sansW('500'), fontSize: 13, lineHeight: 22, color: 'rgba(255,255,255,0.75)', marginTop: 12 },
  scoreValue: { ...sansW('700'), fontSize: 17, color: '#F3C5DD', fontVariant: ['tabular-nums'] },
  empty: { padding: 20, borderRadius: radius.lg, backgroundColor: colors.card },
  devReset: { alignSelf: 'center', marginTop: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.inkMute },
  devResetText: { fontSize: 11, fontWeight: '600', color: colors.inkSub },
  row: { flexDirection: 'row', paddingVertical: 16, borderRadius: radius.lg, backgroundColor: colors.card },
  cell: { flex: 1, minWidth: 0, alignItems: 'center', paddingHorizontal: 2 },
  cellName: { ...sansW('700'), fontSize: 13, lineHeight: 18, letterSpacing: -0.5, color: colors.ink, marginTop: 6 },
  cellSub: { ...sansW('500'), fontSize: 10, lineHeight: 14, color: colors.inkMute, letterSpacing: -0.3 },
});
