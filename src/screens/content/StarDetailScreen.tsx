import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@/navigation/compat';
import Screen from '../../components/Screen';
import PrimaryButton from '../../components/PrimaryButton';
import ProfileSwitch from '../../components/premium/ProfileSwitch';
import LoadingScreen from '../../components/LoadingScreen';
import { ShareIconButton } from '../../components/ShareCta';
import { useApp } from '../../context/AppContext';
import { useStarDetail, useStarMatch } from '../../services/server/starApi';
import { starSpec } from '../../services/share/shareSpecs';
import { colors } from '../../theme/colors';
import { StarHero, StarSections } from './StarReport';
import StarOthers from './StarOthers';

const MIN_LOADING_MS = 480;

/** 무료: 연예인 한 명과의 궁합 — 결과 화면과 같은 히어로와 풀이 (StarReport) */
export default function StarDetailScreen() {
  const nav = useNavigation();
  const { params } = useRoute<{ params: { id?: string } }>();
  const id = params?.id && /^\d+$/.test(params.id) ? Number(params.id) : null;
  const { user: u } = useApp();
  const q = useStarDetail(id);
  // 아래 '다른 연예인과의 궁합' 목록 (결과 화면과 같은 데이터 — 받아 둔 게 있으면 그대로)
  const all = useStarMatch();
  const [readyId, setReadyId] = useState<number | null>(null);
  useEffect(() => {
    if (id == null) return;
    const timer = setTimeout(() => setReadyId(id), MIN_LOADING_MS);
    return () => clearTimeout(timer);
  }, [id]);
  if (!u) return null;
  const d = q.data;
  if (!d || readyId !== id) {
    const error = id == null ? new Error('연예인을 찾을 수 없어요') : !d ? q.error : undefined;
    return <LoadingScreen title="연예인 궁합" error={error} onRetry={id == null ? undefined : q.refetch} message="두 사람의 궁합을 살펴보고 있어요" />;
  }
  const spec = starSpec(u, d, d.me);

  return (
    <Screen title="연예인 궁합" back right={<ShareIconButton spec={spec} />}>
      <ProfileSwitch style={{ marginBottom: 16 }} />
      <StarHero me={u} star={d} eyebrow={`${u.nickname}님과 ${d.name}님의 오늘의 궁합`} />
      <StarSections me={u} star={d} />
      {all.data ? <StarOthers stars={all.data.stars} exclude={d.id} gender={u.gender} inDetail /> : null}

      {/* 이 연예인의 이름·양력 생일·성별을 채운 궁합 상대 추가 화면으로 (저장은 거기서 궁합을 볼 때) */}
      <PrimaryButton size="medium" variant="soft" label="궁합 상대로 추가" labelStyle={[s.btnLabel, { color: colors.ink }]} onPress={() => nav.navigate('Compatibility', { star: { nickname: d.name, birthDate: d.birthDate, gender: d.gender } })} style={{ marginTop: 24 }} />
    </Screen>
  );
}

const s = StyleSheet.create({
  btnLabel: { fontWeight: '700', letterSpacing: -0.56 },
});
