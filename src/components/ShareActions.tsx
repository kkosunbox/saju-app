import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { useNavigation } from '@/navigation/compat';
import PressableScale from './PressableScale';
import GradientBorder from './GradientBorder';
import { SHARE_P, usePremium } from '../context/PremiumContext';
import { ShareSpec } from '../services/share/shareSpecs';
import { ShareImage, useShare } from '../services/share/useShare';
import { colors } from '../theme/colors';
import { radius, sansW, txt } from '../theme/typography';
import { COPY } from '../content/copy';
import { POSES } from './ResultMascot';
import type { MascotPose } from '../utils/resultMascot';

/**
 * 무료 결과 아래 공유 블록 — 결과를 본 직후가 가장 공유하고 싶은 순간이라 크게 보여준다.
 * 링크로 보내면 친구가 열었을 때 내 결과와 친구 결과가 나란히 비교된다.
 * image가 있으면(예: 오늘의 부적) 친구에게 그 이미지를 링크와 함께 보낸다.
 * 왼쪽 마스코트(pose) + 질문형 제목 + '서로 ~인지 확인해 보세요' 같은 한 줄로 친구와 함께 볼 이유를 준다.
 * 공유 보상(+N알)은 '공유하기' 버튼 안에 붙인다.
 */
export default function ShareActions({ spec, title = COPY.friend, sub = '보내면 친구 결과와 내 결과가 나란히 비교돼요', pose = 'hearts', outlined = false, image, marginTop }: {
  spec: ShareSpec; title?: string; sub?: string; pose?: MascotPose; outlined?: boolean; image?: ShareImage; marginTop?: number;
}) {
  const nav = useNavigation();
  const { shareRewardsLeft } = usePremium();
  const { sendLink, sendImage } = useShare();
  const content = (
    <>
      <View style={s.head}>
        <View style={s.mascotBox}>
          {/* 마스코트 발밑 그림자 — 가운데가 진하고 바깥으로 흐려지는 타원 */}
          <Svg width={36} height={8} style={s.shadow}>
            <Defs>
              <RadialGradient id="share-mascot-shadow">
                <Stop offset="0" stopColor="#1D212D" stopOpacity={0.18} />
                <Stop offset="1" stopColor="#1D212D" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Ellipse cx="50%" cy="50%" rx="50%" ry="50%" fill="url(#share-mascot-shadow)" />
          </Svg>
          <Image source={POSES[pose]} style={s.mascot} contentFit="contain" accessible={false} transition={0} />
        </View>
        <View style={s.copy}>
          <Text style={[s.title, KEEP]}>{title}</Text>
          <Text style={[s.sub, outlined && s.outlinedSub, KEEP]}>{sub}</Text>
        </View>
      </View>
      <View style={s.row}>
        <PressableScale onPress={() => (image ? sendImage(spec, image) : sendLink(spec))} style={[s.btn, s.solid]} scaleTo={0.96} haptic accessibilityLabel="친구에게 공유하기">
          <Text style={[s.text, { color: colors.white }]}>공유하기</Text>
          {shareRewardsLeft > 0 ? <View style={s.badge}><Text style={s.badgeText}>+{SHARE_P}알</Text></View> : null}
        </PressableScale>
        <PressableScale onPress={() => nav.navigate('Share', { spec })} style={[s.btn, s.soft]} scaleTo={0.96} accessibilityLabel="스토리용 카드 만들기">
          <Text style={[s.text, { color: colors.ink }]}>스토리 카드</Text>
        </PressableScale>
      </View>
    </>
  );
  return <GradientBorder outer={{ marginTop: marginTop ?? (outlined ? 24 : 20) }} style={[s.box, outlined && s.outlined]}>{content}</GradientBorder>;
}

const KEEP = (Platform.OS === 'web' ? { wordBreak: 'keep-all' } : {}) as object;

const s = StyleSheet.create({
  box: { paddingTop: 14, paddingHorizontal: 16, paddingBottom: 16 },
  // 테두리 1px이 안쪽을 차지하므로 Figma(가운데 정렬 선) 기준 14·16에서 1씩 뺀다
  outlined: { paddingTop: 13, paddingHorizontal: 15, paddingBottom: 15 },
  outlinedSub: { letterSpacing: -0.65 },
  // 스타일시트에 둬야 웹에서 글꼴이 클래스로 붙어 자간이 전역 -0.2px에 덮이지 않는다
  sub: { ...txt.small, marginTop: 4 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mascotBox: { width: 52, height: 56, alignItems: 'center' },
  mascot: { width: 52, height: 52 },
  // 그림 아래 여백이 있어 발밑(약 48)에 타원 가운데가 오도록 올린다
  shadow: { position: 'absolute', bottom: 4 },
  copy: { flex: 1 },
  title: { ...sansW('700'), fontSize: 16, lineHeight: 22, color: colors.ink, letterSpacing: -0.8 },
  // 보내기 버튼 안 보상 표시 — 남색 버튼 위 하늘색 알약
  badge: { height: 20, justifyContent: 'center', paddingHorizontal: 7, borderRadius: 10, backgroundColor: colors.accent },
  badgeText: { ...sansW('700'), fontSize: 11, lineHeight: 13, letterSpacing: -0.22, color: colors.white },
  row: { flexDirection: 'row', gap: 12, marginTop: 12 },
  btn: { flex: 1, height: 40, borderRadius: radius.xs, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  soft: { backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.lineStrong },
  solid: { backgroundColor: colors.navy },
  text: { ...sansW('600'), fontSize: 14, letterSpacing: -0.28 },
});
