/**
 * 메인 「○○님의 오늘 (›)」 — 제목 전체가 버튼이고, 끝의 동그란 화살표는 피그마 576:1787 그대로다.
 * 누르면 오늘의 운세를 누구 것으로 볼지 바텀시트에서 고른다.
 * 콘텐츠 화면의 프로필 선택과는 따로 놀고, 이번 실행 동안만 기억한다 (앱을 다시 켜면 대표 프로필).
 * 하루 한 명은 무료로 뽑고, 같은 날 다른 프로필은 알로 연다 (서버 drawCost).
 * 프로필이 하나뿐이어도 보여 준다 — 시트에서 프로필을 추가할 수 있다.
 */
import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import BottomSheet from '../BottomSheet';
import Icon from '../Icon';
import PressableScale from '../PressableScale';
import { useApp } from '../../context/AppContext';
import { RELATIONSHIP_LABEL } from '../../types';
import { colors } from '../../theme/colors';
import { radius, txt } from '../../theme/typography';

const dot = (iso: string) => iso.replace(/-/g, '.');
/** 화살표 동그라미 지름 · 화살표 색 (피그마 576:1787) */
const CIRCLE = 24;
const CHEVRON_INK = '#575757';

/** textStyle: 제목(「님의 오늘」)과 같은 글자 스타일 — 이름이 제목의 일부로 읽히게 */
export default function FortuneProfileBadge({ style, textStyle }: { style?: object; textStyle?: object }) {
  const { user, fortuneUser } = useApp();
  const [open, setOpen] = useState(false);
  if (!user) return null;
  const name = fortuneUser?.nickname ?? user.nickname;
  const close = () => setOpen(false);

  return (
    <>
      <PressableScale onPress={() => setOpen(true)} style={[s.title, style]} scaleTo={0.98} accessibilityRole="button" accessibilityLabel={`${name}님의 오늘의 운세를 보는 중, 다른 프로필로 변경`}>
        <Text style={[textStyle, s.titleText]} numberOfLines={1}>{name}님의 오늘</Text>
        <View style={s.circle}>
          {/* 피그마 576:1787 경로 그대로 (24×24 동그라미 안 › · 선 1.3) */}
          <Svg width={CIRCLE} height={CIRCLE} viewBox="0 0 24 24" fill="none">
            {/* 유리 효과의 빛 테두리 — 오른쪽 위 · 왼쪽 아래만 밝고, 그 사이(왼쪽 위 · 오른쪽 아래)는 사라진다 */}
            <Defs>
              <LinearGradient id="rim" x1="1" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#fff" stopOpacity={1} />
                <Stop offset="0.4" stopColor="#fff" stopOpacity={0} />
                <Stop offset="0.6" stopColor="#fff" stopOpacity={0} />
                <Stop offset="1" stopColor="#fff" stopOpacity={1} />
              </LinearGradient>
            </Defs>
            <Circle cx={12} cy={12} r={11.5} stroke="url(#rim)" strokeWidth={1} />
            <Path d="M10 16.6666L14.6667 12L10 7.33331" stroke={CHEVRON_INK} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>
      </PressableScale>
      <FortuneProfileSheet visible={open} onClose={close} />
    </>
  );
}

/** 다른 화면의 프로필 칩과 같은 모양 — 「운픽님 ⌄」, 누르면 오늘의 운세를 볼 프로필을 고른다 */
export function FortuneProfileChip({ style }: { style?: object }) {
  const { user, fortuneUser } = useApp();
  const [open, setOpen] = useState(false);
  if (!user) return null;
  const name = fortuneUser?.nickname ?? user.nickname;
  return (
    <>
      <PressableScale onPress={() => setOpen(true)} style={[s.chip, style]} scaleTo={0.97} accessibilityLabel={`${name}님 운세를 보는 중, 다른 프로필 고르기`}>
        <Text style={s.chipText} numberOfLines={1}>{name}님</Text>
        <Icon name="chevronDown" size={12} color={colors.purpleSoft} strokeWidth={2.2} />
      </PressableScale>
      <FortuneProfileSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

/** 오늘의 운세를 누구 것으로 볼지 고르는 시트 (하루 한 명 무료, 같은 날 다른 프로필은 알) */
export function FortuneProfileSheet({ visible, onClose: close }: { visible: boolean; onClose(): void }) {
  const { profiles, user, fortuneProfileId, selectFortuneProfile } = useApp();
  if (!user) return null;
  const selectedId = fortuneProfileId ?? user.profileId;
  return (
    <BottomSheet visible={visible} onClose={close}>
      <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false}>
        <Text style={txt.h2}>프로필 선택</Text>
        <View style={s.list}>
          {profiles.map(p => {
            const selected = p.profileId === selectedId;
            return (
              <PressableScale
                key={p.profileId}
                onPress={() => { selectFortuneProfile(p.isPrimary ? null : p.profileId!); close(); }}
                style={[s.row, selected && s.rowOn]}
                scaleTo={0.98}
                accessibilityState={{ selected }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={txt.bodyStrong}>{p.nickname}{p.isPrimary ? '  · 대표' : ''}</Text>
                  <Text style={txt.caption}>{RELATIONSHIP_LABEL[p.relationship ?? 'other']} · {dot(p.birthDateInput ?? p.birthDate)}{p.calendarType === 'lunar' ? ' (음력)' : ''}</Text>
                </View>
                {selected ? <Icon name="check" size={18} color={colors.ink} strokeWidth={2.4} /> : null}
              </PressableScale>
            );
          })}
        </View>
        <PressableScale onPress={() => { close(); router.push('/profiles/new?for=fortune'); }} style={s.add} scaleTo={0.98} accessibilityRole="button" accessibilityLabel="프로필 추가하기">
          <Text style={s.addText}>+ 프로필 추가하기</Text>
        </PressableScale>
      </ScrollView>
    </BottomSheet>
  );
}

const s = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.lavenderSoft, maxWidth: 160,
  },
  chipText: { ...txt.caption, fontSize: 12, color: colors.purpleSoft, flexShrink: 1 },
  title: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  titleText: { flexShrink: 1 },
  // 피그마 576:1787 — 24 동그라미 · 흰색 40% · 그림자 y4 blur4 rgba(23,67,132,.12) · 제목과 8 간격
  // 유리 효과: 오른쪽 위 · 왼쪽 아래 빛 테두리(SVG 안) + 뒤 배경 흐림 (SVG 내보내기엔 빠지고 PNG에만 보이는 처리)
  circle: {
    width: CIRCLE, height: CIRCLE, borderRadius: CIRCLE / 2, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.4)',
    shadowColor: 'rgb(23,67,132)', shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 4 }, elevation: 2,
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(6px)' } as object) : null),
  },
  list: { marginTop: 12, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1.5, borderColor: 'transparent' },
  rowOn: { borderColor: colors.ink },
  add: { marginTop: 10, height: 48, borderRadius: radius.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' },
  addText: { ...txt.small, color: colors.ink },
});
