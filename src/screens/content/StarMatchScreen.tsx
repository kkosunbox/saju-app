import React, { useState } from 'react';
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
import { PointPill } from '../../components/HeaderPoints';
import { useApp } from '../../context/AppContext';
import { useOpened } from '../../services/content/opened';
import { useStarDetail, useStarMatch } from '../../services/server/starApi';
import { starSpec } from '../../services/share/shareSpecs';
import { colors } from '../../theme/colors';
import { LOCAL_TOOLS } from '../../utils/devTools';
import { radius, txt } from '../../theme/typography';
import { StarHero, StarSections } from './StarReport';
import StarOthers from './StarOthers';

/**
 * 무료: 연예인 궁합. 오늘 나와 가장 잘 맞는 반대 성별 연예인 세 명을 돌림판에 올려 한 명을 뽑는다.
 * 점수는 날마다 바뀌고 날마다 새로 뽑는다. 뽑으면 그 연예인과의 궁합 풀이를 바로 펼쳐 보여 주고,
 * 아래에는 반대 성별의 다른 연예인 다섯 명을 랜덤으로 보여 준다 (StarOthers). 사람은 사주 캐릭터 대신 이름으로 고정된 실루엣으로 그린다.
 */
export default function StarMatchScreen() {
  const nav = useNavigation();
  const { user: u } = useApp();
  const q = useStarMatch();
  const draw = useOpened('celebrity-match');
  const [drawn, setDrawn] = useState(false);
  const data = q.data;
  const pick = data?.pick ?? null;
  // 뽑힌 연예인과의 풀이 — 돌림판이 도는 동안 미리 받아 둔다
  const detail = useStarDetail(pick?.id ?? null);
  if (!u) return null;
  if (!data || !draw.ready) return <LoadingScreen title="연예인 궁합" error={q.error} onRetry={q.refetch} />;

  // 오늘 아직 안 돌렸으면 돌림판부터
  if (!draw.opened && pick) {
    return (
      <Screen title="연예인 궁합" back>
        <ProfileSwitch style={{ marginBottom: 16 }} />
        <StarRoulette pick={pick} finalists={data.finalists} onDone={() => { setDrawn(true); draw.open(); }} />
      </Screen>
    );
  }
  const d = detail.data;
  if (pick && !d) return <LoadingScreen title="연예인 궁합" error={detail.error} onRetry={detail.refetch} message="두 사람의 궁합을 살펴보고 있어요" />;

  const spec = pick ? starSpec(u, d ?? pick, data.me) : null;
  const wrap = (node: React.ReactNode) => (drawn ? <Reveal>{node}</Reveal> : node);
  return (
    <Screen title="연예인 궁합" back right={<View style={s.headRight}><PointPill attendHint quiet /><ShareIconButton spec={spec} /></View>}>
      <ProfileSwitch style={{ marginBottom: 16 }} />
      {pick && d ? wrap(
        <View>
          <StarHero me={u} star={d} eyebrow={`${u.nickname}님의 오늘의 천생연분은`} />
          {LOCAL_TOOLS ? (
            <PressableScale onPress={() => { draw.reset(); setDrawn(false); }} hitSlop={4} scaleTo={0.9} style={s.devReset} accessibilityLabel="돌림판 돌리기 전으로 되돌리기 (로컬 테스트용)">
              <Text style={s.devResetText}>결과 초기화 (로컬)</Text>
            </PressableScale>
          ) : null}
          <StarSections me={u} star={d} />
        </View>,
      ) : (
        <View style={s.empty}><Text style={txt.body}>지금은 궁합을 볼 수 있는 연예인이 없어요. 잠시 후 다시 찾아 주세요.</Text></View>
      )}

      {spec ? <ShareActions spec={spec} title={`${pick?.name ?? '연예인'}님과의 궁합을 공유해 볼까요?`} sub="궁합 점수와 케미까지 카드 한 장에 담았어요" marginTop={32} /> : null}

      <StarOthers stars={data.stars} exclude={pick?.id} gender={u.gender} />

      {/* 이 연예인의 이름·양력 생일·성별을 채운 궁합 상대 추가 화면으로 (저장은 거기서 궁합을 볼 때) */}
      {d ? <PrimaryButton size="medium" variant="soft" label="궁합 상대로 추가" labelStyle={s.btnLabel} onPress={() => nav.navigate('Compatibility', { star: { nickname: d.name, birthDate: d.birthDate, gender: d.gender } })} style={{ marginTop: 24 }} /> : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  headRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  empty: { padding: 20, borderRadius: radius.lg, backgroundColor: colors.card },
  devReset: { alignSelf: 'center', marginTop: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.inkMute },
  devResetText: { fontSize: 11, fontWeight: '600', color: colors.inkSub },
  btnLabel: { fontWeight: '700', letterSpacing: -0.56, color: colors.ink },
});
