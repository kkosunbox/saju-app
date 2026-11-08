import React, { forwardRef } from 'react';
import { Platform, StyleSheet, Text, View, type ViewInstance } from 'react-native';
import ShareCardBackdrop, { STORY_FRAME, STORY_WIDTH, STORY_HEIGHT } from './ShareCardBackdrop';
import { Logo } from './Mascot';
import CharacterArt from './CharacterArt';
import { CharacterCardData } from '../services/share/shareSpecs';
import { formatKoreanDate } from '../utils/date';
import { sansW } from '../theme/typography';

/**
 * 사주 캐릭터 공유 카드 — 주인공은 내 캐릭터.
 * 내 캐릭터 그림 · 이름 · 한 줄 성격 · 기운/강점을 크게 보여 주고,
 * 그 아래 작은 칸에 찰떡 캐릭터와 어떤 사이인지를 붙인다.
 * 다른 공유 카드와 같은 311×548 · 구름 액자를 쓰고, 캡처되도록 View·Text·Image만 쓴다.
 */
const C = { ink: '#000000', mute: '#777777', accent: '#28B2FE', blue: '#1FA6FD', pink: '#FF6F91', dark: '#1D212D' };
const EXTRA = Platform.OS === 'web' ? sansW('800') : { fontFamily: 'Pretendard-ExtraBold' };
const KEEP = (Platform.OS === 'web' ? { wordBreak: 'keep-all' } : {}) as object;

/** 웹 Text는 adjustsFontSizeToFit이 없어 글자 수로 크기를 맞춘다 (ShareCard와 같은 셈) */
const fit = (text: string, base: number, width: number) => {
  const units = Array.from(text).reduce((n, c) => n + (/\s/.test(c) ? 0.3 : c.charCodeAt(0) <= 255 ? 0.6 : 1), 0);
  return Math.min(base, Math.floor(width / Math.max(1, units - text.length * 0.05)));
};

const ART = 112;

const CharacterShareCard = forwardRef<ViewInstance, { data: CharacterCardData; today: string }>(function CharacterShareCard({ data, today }, ref) {
  const { mine, friend } = data;
  const nameSize = fit(mine.name, 30, 251);
  const coreSize = fit(mine.core, 16, 251);
  const friendSize = fit(friend.name, 15, 150);
  return (
    <View ref={ref} collapsable={false} style={s.card} testID="share-card">
      <ShareCardBackdrop />
      <View style={s.logo}><Logo height={49} /></View>

      <Text style={[s.row, s.date]}>{formatKoreanDate(today)}</Text>
      <Text style={[s.row, s.eyebrow]} numberOfLines={1}>60가지 사주 캐릭터 중 {data.nickname}님은</Text>

      {/* 내 캐릭터 — 카드의 주인공 */}
      <View style={s.art}><CharacterArt hanja={mine.hanja} name={mine.name} size={96} /></View>
      <Text style={[s.row, s.name, { fontSize: nameSize, letterSpacing: -nameSize * 0.05 }]} numberOfLines={1}>{mine.name}</Text>
      <Text style={[s.row, s.core, { fontSize: coreSize }, KEEP]} numberOfLines={1}>“{mine.core}”</Text>
      <View style={s.chips}>
        <View style={s.chip}><Text style={s.chipText}>{mine.element}의 기운</Text></View>
        <View style={s.chip}><Text style={s.chipText}>강점 · {mine.strength}</Text></View>
      </View>

      {/* 찰떡 캐릭터 — 작은 칸 */}
      <View style={s.friend}>
        <View style={s.friendArt}><CharacterArt hanja={friend.hanja} name={friend.name} size={42} /></View>
        <View style={{ flex: 1 }}>
          <Text style={s.friendLabel}>나와 찰떡인 캐릭터</Text>
          <Text style={[s.friendName, { fontSize: friendSize }]} numberOfLines={1}>{friend.name}</Text>
          <Text style={s.friendBond} numberOfLines={1}>{data.bond}</Text>
        </View>
        <View style={s.heart}><Text style={s.heartText}>♥</Text></View>
      </View>

      <View style={s.foot}>
        <View style={{ flex: 1 }}>
          <Text style={s.hook}>너의 사주 캐릭터도 확인해 봐!</Text>
          <Text style={s.url}>생일만 넣으면 30초 · 운픽</Text>
        </View>
        <View style={s.cta}><Text style={s.ctaText}>내 캐릭터 찾기</Text></View>
      </View>
    </View>
  );
});

export default CharacterShareCard;

const s = StyleSheet.create({
  card: { width: STORY_WIDTH, height: STORY_HEIGHT, borderRadius: 20, overflow: 'hidden', backgroundColor: '#8ACAFF' },
  logo: { position: 'absolute', left: 20, top: 9 },
  row: { position: 'absolute', left: 30, right: 30, textAlign: 'center' },
  date: { ...sansW('500'), top: 70, fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: C.mute },
  eyebrow: { ...sansW('700'), top: 96, fontSize: 14, lineHeight: 17, letterSpacing: -0.56, color: C.accent },
  art: { position: 'absolute', left: (STORY_WIDTH - ART) / 2, top: 124, width: ART, height: ART, borderRadius: ART / 2, borderWidth: 3, borderColor: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.75)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  name: { ...EXTRA, top: 246, fontSize: 30, lineHeight: 36, color: C.ink },
  core: { ...EXTRA, top: 284, fontSize: 16, lineHeight: 20, letterSpacing: -0.64, color: C.blue },
  chips: { position: 'absolute', left: 30, right: 30, top: 312, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  chip: { height: 22, paddingHorizontal: 9, borderRadius: 11, justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.85)' },
  chipText: { ...sansW('700'), fontSize: 11, lineHeight: 13, letterSpacing: -0.33, color: '#4F4F4F' },
  // 찰떡 칸 — 액자 아래쪽
  friend: { position: 'absolute', left: 36, right: 36, top: 358, height: 68, borderRadius: 16, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.7)' },
  friendArt: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  friendLabel: { ...sansW('700'), fontSize: 10, lineHeight: 12, color: C.pink },
  friendName: { ...EXTRA, marginTop: 1, fontSize: 15, lineHeight: 19, letterSpacing: -0.6, color: C.ink },
  friendBond: { ...sansW('600'), fontSize: 11, lineHeight: 14, letterSpacing: -0.33, color: C.mute },
  heart: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.pink, alignItems: 'center', justifyContent: 'center' },
  heartText: { color: '#FFFFFF', fontSize: 12, lineHeight: 14, marginTop: 1 },
  // 액자 아래(466)부터 카드 끝(548)까지의 칸 한가운데에 둔다 — 위아래 여백이 같도록
  foot: { position: 'absolute', left: 24, right: 24, top: STORY_FRAME.top + STORY_FRAME.height, bottom: 0, flexDirection: 'row', alignItems: 'center', gap: 12 },
  hook: { ...EXTRA, fontSize: 16, lineHeight: 18, letterSpacing: -0.8, color: C.ink },
  url: { ...sansW('500'), marginTop: 8, fontSize: 14, lineHeight: 17, letterSpacing: -0.56, color: C.ink },
  cta: { height: 36, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 5, backgroundColor: C.dark },
  ctaText: { ...sansW('600'), fontSize: 13, letterSpacing: -0.26, color: '#EDEDED' },
});
