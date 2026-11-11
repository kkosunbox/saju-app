import React, { forwardRef } from 'react';
import { Platform, StyleSheet, Text, View, type ViewInstance } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { STORY_FRAME, STORY_WIDTH, STORY_HEIGHT, BLUE_LINE, NIGHT_LOCATIONS, NIGHT_BORDER_LINE, NIGHT_BORDER_LOCATIONS } from './ShareCardBackdrop';
import { Logo } from './Mascot';
import ShareLinkBadge from './ShareLinkBadge';
import CharacterScene, { CharacterAvatar } from './CharacterScene';
import { characterScene, CHARACTER_SHARE_THEMES } from '../data/characterScene';
import { CharacterCardData } from '../services/share/shareSpecs';
import { formatKoreanDate } from '../utils/date';
import { sansW } from '../theme/typography';

/**
 * 사주 캐릭터 공유 카드 — 주인공은 내 캐릭터.
 * 내 캐릭터 그림 · 이름 · 한 줄 성격 · 기운/강점을 크게 보여 주고,
 * 그 아래 작은 칸에 찰떡 캐릭터와 어떤 사이인지를 붙인다.
 * 다른 공유 카드와 같은 311×548 액자에 캐릭터와 어울리는 오행 풍경을 담는다.
 * 배경은 캐릭터의 오행마다 5종(Figma 505:3403) — 카드 바탕·액자 테두리·액자 안쪽·한 줄 성격 색이 바뀐다.
 * 그라디언트 각도는 다른 공유 카드처럼 피그마 렌더 픽셀로 맞춘 선(바탕 152°, 테두리 168.45°)을 쓴다.
 */
const C = { ink: '#000000', mute: '#777777', eyebrow: '#515D77', pink: '#FF6F91' };
const EXTRA = Platform.OS === 'web' ? sansW('800') : { fontFamily: 'Pretendard-ExtraBold' };
const KEEP = (Platform.OS === 'web' ? { wordBreak: 'keep-all' } : {}) as object;

/** 웹 Text는 adjustsFontSizeToFit이 없어 글자 수로 크기를 맞춘다 (ShareCard와 같은 셈) */
const fit = (text: string, base: number, width: number) => {
  const units = Array.from(text).reduce((n, c) => n + (/\s/.test(c) ? 0.3 : c.charCodeAt(0) <= 255 ? 0.6 : 1), 0);
  return Math.min(base, Math.floor(width / Math.max(1, units - text.length * 0.05)));
};

const ART = { left: 40, top: 100, width: 231, height: 155 };

const CharacterShareCard = forwardRef<ViewInstance, { data: CharacterCardData; today: string }>(function CharacterShareCard({ data, today }, ref) {
  const { mine, friend } = data;
  const scene = characterScene(mine.hanja, mine.name);
  const theme = CHARACTER_SHARE_THEMES[scene?.element ?? 'wood'];
  const energyLabel = scene?.energyLabel ?? `${mine.element}의 기운`;
  const nameSize = fit(mine.name, 32, 251);
  const coreSize = fit(mine.core, 16, 251);
  const friendSize = fit(friend.name, 15, 150);
  return (
    <View ref={ref} collapsable={false} style={[s.card, { backgroundColor: theme.card[1] }]} testID="share-card">
      <LinearGradient pointerEvents="none" colors={theme.card} locations={NIGHT_LOCATIONS} {...BLUE_LINE} style={StyleSheet.absoluteFill} />
      {/* 액자 — 그라디언트 테두리 3 안에 위에서 아래로 흰색이 되는 안쪽 */}
      <View pointerEvents="none" style={s.frame} testID="share-frame">
        <LinearGradient colors={theme.border} locations={NIGHT_BORDER_LOCATIONS} {...NIGHT_BORDER_LINE} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={[theme.frame, '#FFFFFF']} style={s.frameInner} />
      </View>
      <View style={s.logo}><Logo height={49} /></View>

      <Text style={[s.row, s.date]}>{formatKoreanDate(today)}</Text>

      {/* 내 캐릭터 — 카드의 주인공 */}
      <View style={s.art}><CharacterScene hanja={mine.hanja} name={mine.name} size={115} style={{ width: ART.width, height: ART.height }} /></View>
      <Text style={[s.row, s.eyebrow]} numberOfLines={1}>60가지 사주 캐릭터 중 {data.nickname}님은</Text>
      <Text style={[s.row, s.name, { fontSize: nameSize, letterSpacing: -nameSize * 0.05 }]} numberOfLines={1}>{mine.name}</Text>
      <Text style={[s.row, s.core, { color: theme.core, fontSize: coreSize }, KEEP]} numberOfLines={1}>“{mine.core}”</Text>
      <View style={s.traits}>
        <Text style={s.trait}>{energyLabel}</Text>
        <Text style={s.trait}>강점 <Text style={s.dot}>·</Text> {mine.strength}</Text>
      </View>

      {/* 찰떡 캐릭터 — 작은 칸 */}
      <View style={s.friend}>
        <View style={s.friendArt}><CharacterAvatar hanja={friend.hanja} name={friend.name} size={44} /></View>
        <View style={{ flex: 1 }}>
          <Text style={s.friendLabel}>나와 찰떡인 캐릭터</Text>
          <Text style={[s.friendName, { fontSize: friendSize }]} numberOfLines={1}>{friend.name}</Text>
          <Text style={s.friendBond} numberOfLines={1}>{data.bond}</Text>
        </View>
        <View style={s.heart}><Text style={s.heartText}>♥</Text></View>
      </View>

      <View style={s.foot}>
        <View style={{ flex: 1 }}>
          <Text style={s.hook}>너의 사주 캐릭터는?</Text>
          <Text style={s.url}>생일만 넣으면 30초 · 운픽</Text>
        </View>
        <ShareLinkBadge style={s.link} />
      </View>
    </View>
  );
});

export default CharacterShareCard;

const s = StyleSheet.create({
  card: { width: STORY_WIDTH, height: STORY_HEIGHT, borderRadius: 20, overflow: 'hidden', backgroundColor: '#8ACAFF' },
  frame: { position: 'absolute', left: STORY_FRAME.left, top: STORY_FRAME.top, width: STORY_FRAME.width, height: STORY_FRAME.height, borderRadius: 32, overflow: 'hidden' },
  frameInner: { position: 'absolute', left: 3, top: 3, right: 3, bottom: 3, borderRadius: 29 },
  logo: { position: 'absolute', left: 20, top: 9 },
  row: { position: 'absolute', left: 30, right: 30, textAlign: 'center' },
  // Figma 텍스트 상자(줄높이 18) 위치에 글자 가운데를 맞추도록, 큰 글자는 줄높이를 늘린 만큼 top을 올렸다
  date: { ...sansW('500'), top: 70, fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: C.mute },
  art: { position: 'absolute', ...ART, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  eyebrow: { ...sansW('600'), top: 269, fontSize: 14, lineHeight: 17, letterSpacing: -0.56, color: C.eyebrow },
  name: { ...EXTRA, top: 292, fontSize: 32, lineHeight: 38, color: C.ink },
  core: { ...EXTRA, top: 335, fontSize: 16, lineHeight: 20, letterSpacing: -0.8 },
  traits: { position: 'absolute', left: 30, right: 30, top: 368, flexDirection: 'row', justifyContent: 'center', gap: 23 },
  trait: { ...sansW('600'), fontSize: 14, lineHeight: 17, letterSpacing: -0.56, color: C.ink },
  dot: { ...sansW('400') },
  // 찰떡 칸 — 액자 아래쪽을 채우는 흰 칸 (아래 모서리만 25)
  friend: { position: 'absolute', left: 28, right: 28, top: 398, height: 61, borderBottomLeftRadius: 25, borderBottomRightRadius: 25, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF' },
  friendArt: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  friendLabel: { ...sansW('700'), fontSize: 10, lineHeight: 12, color: C.pink },
  friendName: { ...EXTRA, marginTop: 1, fontSize: 15, lineHeight: 19, letterSpacing: -0.6, color: C.ink },
  friendBond: { ...sansW('600'), fontSize: 11, lineHeight: 14, letterSpacing: -0.33, color: C.mute },
  heart: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.pink, alignItems: 'center', justifyContent: 'center' },
  heartText: { color: '#FFFFFF', fontSize: 12, lineHeight: 14, marginTop: 1 },
  // Figma: 글 묶음 482~525 · 링크 뱃지 492 — 둘 다 가운데가 503.5라 칸(466~541)의 가운데에 맞춘다
  foot: { position: 'absolute', left: 24, right: 24, top: STORY_FRAME.top + STORY_FRAME.height, bottom: 7, flexDirection: 'row', alignItems: 'center', gap: 12 },
  hook: { ...EXTRA, fontSize: 16, lineHeight: 18, letterSpacing: -0.8, color: C.ink },
  url: { ...sansW('500'), marginTop: 8, fontSize: 14, lineHeight: 17, letterSpacing: -0.56, color: C.ink },
  // 링크 뱃지 — 오늘의 운세 카드와 같이 오른쪽 끝 291 (foot 오른쪽 24보다 4 바깥)
  link: { marginRight: -4 },
});
