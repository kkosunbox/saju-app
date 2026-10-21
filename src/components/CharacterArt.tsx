import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';
import { BRANCHES, STEMS } from '../data/sajuData';

/**
 * 60갑자 사주 캐릭터 그림 — 갑자(01)부터 계해(60)까지 60갑자 순서.
 * 원본(1254px PNG)은 디자이너가 만든 것이고, 앱에는 384px webp로 줄여 넣었다.
 */
const ART = [
  require('../../assets/images/characters/01.webp'),
  require('../../assets/images/characters/02.webp'),
  require('../../assets/images/characters/03.webp'),
  require('../../assets/images/characters/04.webp'),
  require('../../assets/images/characters/05.webp'),
  require('../../assets/images/characters/06.webp'),
  require('../../assets/images/characters/07.webp'),
  require('../../assets/images/characters/08.webp'),
  require('../../assets/images/characters/09.webp'),
  require('../../assets/images/characters/10.webp'),
  require('../../assets/images/characters/11.webp'),
  require('../../assets/images/characters/12.webp'),
  require('../../assets/images/characters/13.webp'),
  require('../../assets/images/characters/14.webp'),
  require('../../assets/images/characters/15.webp'),
  require('../../assets/images/characters/16.webp'),
  require('../../assets/images/characters/17.webp'),
  require('../../assets/images/characters/18.webp'),
  require('../../assets/images/characters/19.webp'),
  require('../../assets/images/characters/20.webp'),
  require('../../assets/images/characters/21.webp'),
  require('../../assets/images/characters/22.webp'),
  require('../../assets/images/characters/23.webp'),
  require('../../assets/images/characters/24.webp'),
  require('../../assets/images/characters/25.webp'),
  require('../../assets/images/characters/26.webp'),
  require('../../assets/images/characters/27.webp'),
  require('../../assets/images/characters/28.webp'),
  require('../../assets/images/characters/29.webp'),
  require('../../assets/images/characters/30.webp'),
  require('../../assets/images/characters/31.webp'),
  require('../../assets/images/characters/32.webp'),
  require('../../assets/images/characters/33.webp'),
  require('../../assets/images/characters/34.webp'),
  require('../../assets/images/characters/35.webp'),
  require('../../assets/images/characters/36.webp'),
  require('../../assets/images/characters/37.webp'),
  require('../../assets/images/characters/38.webp'),
  require('../../assets/images/characters/39.webp'),
  require('../../assets/images/characters/40.webp'),
  require('../../assets/images/characters/41.webp'),
  require('../../assets/images/characters/42.webp'),
  require('../../assets/images/characters/43.webp'),
  require('../../assets/images/characters/44.webp'),
  require('../../assets/images/characters/45.webp'),
  require('../../assets/images/characters/46.webp'),
  require('../../assets/images/characters/47.webp'),
  require('../../assets/images/characters/48.webp'),
  require('../../assets/images/characters/49.webp'),
  require('../../assets/images/characters/50.webp'),
  require('../../assets/images/characters/51.webp'),
  require('../../assets/images/characters/52.webp'),
  require('../../assets/images/characters/53.webp'),
  require('../../assets/images/characters/54.webp'),
  require('../../assets/images/characters/55.webp'),
  require('../../assets/images/characters/56.webp'),
  require('../../assets/images/characters/57.webp'),
  require('../../assets/images/characters/58.webp'),
  require('../../assets/images/characters/59.webp'),
  require('../../assets/images/characters/60.webp'),
];

/** 60갑자 순서의 일주 한자 (甲子 · 乙丑 · … · 癸亥) */
const PILLARS = Array.from({ length: 60 }, (_, i) => STEMS[i % 10].hanja + BRANCHES[i % 12].hanja);
/** 캐릭터 이름 앞의 색 — 서버(free-content.ts)의 STEM_COLOR와 같다 */
const STEM_COLOR = ['푸른', '푸른', '붉은', '붉은', '노란', '노란', '하얀', '하얀', '검은', '검은'];
const NAMES = Array.from({ length: 60 }, (_, i) => `${STEM_COLOR[i % 10]} ${BRANCHES[i % 12].animal}`);

/** 일주 한자(예: 己丑)로 그림 찾기 */
export const artOfPillar = (hanja: string) => ART[PILLARS.indexOf(hanja)] ?? null;
/** 캐릭터 이름(예: 하얀 소)으로 그림 찾기 — 찰떡 캐릭터처럼 이름만 있을 때 */
export const artOfName = (name: string) => ART[NAMES.indexOf(name)] ?? null;

/** 사주 캐릭터 그림. hanja(일주) 또는 name 중 하나로 고른다. 못 찾으면 아무것도 그리지 않는다 */
export default function CharacterArt({ hanja, name, size, style }: { hanja?: string; name?: string; size: number; style?: StyleProp<ImageStyle> }) {
  const src = (hanja && artOfPillar(hanja)) || (name && artOfName(name)) || null;
  if (!src) return null;
  return <Image source={src} style={[{ width: size, height: size }, style]} resizeMode="contain" accessibilityIgnoresInvertColors />;
}
