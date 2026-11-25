import React, { forwardRef } from 'react';
import { Platform, StyleSheet, Text, View, type ViewInstance } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { STORY_WIDTH, STORY_HEIGHT } from './ShareCardBackdrop';
import { Logo } from './Mascot';
import ShareLinkBadge from './ShareLinkBadge';
import StarAvatar from './StarAvatar';
import { ShareSpec, StarCardData } from '../services/share/shareSpecs';
import { formatKoreanDate } from '../utils/date';
import { sansW } from '../theme/typography';

/**
 * 연예인 궁합 공유 카드 — '오늘의 천생연분'이 아니라 '이 연예인과 나의 궁합'. 결과 화면 히어로와 같은 밤 분위기.
 * 위에 '드라마 속 우리라면' 장면을 포스터처럼 크게 깔고 (왼쪽 위에 장르 이름만), 그 아래 가장자리에 나와 연예인의 실루엣과
 * 가운데 오늘의 점수 고리를 걸친다. 아래로 '나 ♥ 연예인' · 두 사람 사이 한 줄 · 지표 세 칸 · 링크.
 * 다른 공유 카드와 같은 311×548 (캡처되도록 View · Text · Image만).
 */
const C = { white: '#FFFFFF', mute: '#C9BFCD', pink: '#FFC8E0', ink: '#0C030D' };
const EXTRA = Platform.OS === 'web' ? sansW('800') : { fontFamily: 'Pretendard-ExtraBold' };
const KEEP = (Platform.OS === 'web' ? { wordBreak: 'keep-all' } : {}) as object;
const DRAMA_ART = {
  friends: require('../../assets/figma/content/star/drama-friends.webp'),
  reunion: require('../../assets/figma/content/star/drama-reunion.webp'),
  status: require('../../assets/figma/content/star/drama-status.webp'),
  fate: require('../../assets/figma/content/star/drama-fate.webp'),
};

/** 웹 Text는 adjustsFontSizeToFit이 없어 글자 수로 크기를 맞춘다 (ShareCard와 같은 셈) */
const fit = (text: string, base: number, width: number) => {
  const units = Array.from(text).reduce((n, c) => n + (/\s/.test(c) ? 0.3 : c.charCodeAt(0) <= 255 ? 0.6 : 1), 0);
  return Math.min(base, Math.floor(width / Math.max(1, units - text.length * 0.05)));
};

/** 드라마 장면 칸 · 실루엣 · 점수 고리 */
const POSTER = { left: 28, top: 88, width: 255, height: 150 };
const AVATAR = 64;
const RING = 76;
const ROW_TOP = POSTER.top + POSTER.height - 34;

const StarShareCard = forwardRef<ViewInstance, { spec: ShareSpec; data: StarCardData; today: string }>(function StarShareCard({ spec, data, today }, ref) {
  const nameSize = fit(spec.headline, 30, 251);
  const statSize = Math.max(13, Math.min(16, ...spec.stats.map(([, v]) => fit(v, 16, 76))));
  return (
    <View ref={ref} collapsable={false} style={s.card} testID="share-card">
      <LinearGradient pointerEvents="none" colors={['#14061A', '#0C030D', '#2A0F28']} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      {/* 히어로와 같은 자줏빛 구름을 아래쪽에 */}
      <Image source={require('../../assets/figma/content/star/hero-bg.webp')} style={s.clouds} contentFit="cover" accessible={false} />
      <View style={s.logo}><Logo height={49} color={C.white} /></View>
      <Text style={[s.row, s.date]}>{formatKoreanDate(today)}</Text>

      {/* 드라마 속 우리라면 — 포스터 */}
      <View style={s.poster}>
        <Image source={data.drama ? DRAMA_ART[data.drama.key] : require('../../assets/figma/content/star/hero-bg.webp')} style={StyleSheet.absoluteFill} contentFit="cover" accessible={false} />
        <LinearGradient pointerEvents="none" colors={['rgba(12,3,13,0)', 'rgba(12,3,13,0.15)', 'rgba(12,3,13,0.92)']} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
        {data.drama ? (
          <View style={s.genre}>
            <Text style={s.genreTitle} numberOfLines={1}>{data.drama.title}</Text>
          </View>
        ) : null}
      </View>

      {/* 나 · 점수 · 연예인 — 포스터 아래 가장자리에 걸친다 */}
      <View style={[s.pair, { top: ROW_TOP }]}>
        <StarAvatar name={data.nickname} gender={data.myGender} size={AVATAR} style={s.avatar} />
        <View style={s.ring}>
          <Image source={require('../../assets/figma/content/star/score-ring.svg')} style={StyleSheet.absoluteFill} contentFit="contain" accessible={false} />
          <Text style={s.score}>{data.score}</Text>
          <Text style={s.scoreLabel}>궁합 점수</Text>
        </View>
        <StarAvatar name={data.name} gender={data.gender} size={AVATAR} style={s.avatar} />
      </View>

      <Text style={[s.row, s.eyebrow]} numberOfLines={1}>{spec.eyebrow}</Text>
      <Text style={[s.row, s.name, { fontSize: nameSize, letterSpacing: -nameSize * 0.05 }]} numberOfLines={1}>{spec.headline}</Text>
      {spec.sub ? <Text style={[s.row, s.bond, KEEP]} numberOfLines={1}>“{spec.sub}”</Text> : null}

      <View style={s.stats} testID="share-stats">
        {spec.stats.map(([label, value]) => (
          <View key={label} style={s.stat}>
            <Text style={[s.statValue, { fontSize: statSize }]} numberOfLines={1}>{value}</Text>
            <Text style={s.statLabel} numberOfLines={1}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={s.foot}>
        <View style={{ flex: 1 }}>
          <Text style={s.hook}>{spec.hook}</Text>
          <Text style={s.url}>생일만 넣으면 30초 · 운픽</Text>
        </View>
        <ShareLinkBadge style={s.link} />
      </View>
    </View>
  );
});

export default StarShareCard;

const s = StyleSheet.create({
  card: { width: STORY_WIDTH, height: STORY_HEIGHT, borderRadius: 20, overflow: 'hidden', backgroundColor: C.ink },
  clouds: { position: 'absolute', left: -70, right: -70, bottom: 0, height: 320, opacity: 0.9 },
  logo: { position: 'absolute', left: 20, top: 9 },
  row: { position: 'absolute', left: 28, right: 28, textAlign: 'center' },
  date: { ...sansW('500'), top: 62, fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: C.mute },
  poster: { position: 'absolute', ...POSTER, borderRadius: 16, overflow: 'hidden', backgroundColor: '#1D0C1F' },
  genre: { position: 'absolute', left: 14, right: 14, top: 12 },
  genreTitle: { ...EXTRA, fontSize: 16, lineHeight: 20, letterSpacing: -0.8, color: C.white, textShadowColor: 'rgba(0,0,0,0.45)', textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 } },
  pair: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 },
  avatar: { borderWidth: 2.5, borderColor: C.white },
  ring: { width: RING, height: RING, borderRadius: RING / 2, alignItems: 'center', paddingTop: 15, backgroundColor: 'rgba(12,3,13,0.88)' },
  score: { ...sansW('600'), fontSize: 30, lineHeight: 32, letterSpacing: -1.5, color: C.white, fontVariant: ['tabular-nums'] },
  scoreLabel: { ...sansW('600'), fontSize: 10, lineHeight: 12, letterSpacing: -0.5, color: C.white },
  eyebrow: { ...sansW('600'), top: ROW_TOP + RING + 12, fontSize: 13, lineHeight: 17, letterSpacing: -0.52, color: C.mute },
  name: { ...EXTRA, top: ROW_TOP + RING + 32, fontSize: 30, lineHeight: 36, color: C.white },
  bond: { ...sansW('700'), top: ROW_TOP + RING + 72, fontSize: 14, lineHeight: 18, letterSpacing: -0.6, color: C.pink },
  stats: { position: 'absolute', left: 28, width: 255, top: 398, height: 61, flexDirection: 'row', alignItems: 'center', borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,200,224,0.22)' },
  stat: { flex: 1, alignItems: 'center', paddingHorizontal: 3 },
  statValue: { ...EXTRA, lineHeight: 20, letterSpacing: -0.64, color: C.white, maxWidth: '100%' },
  statLabel: { ...sansW('600'), marginTop: 3, fontSize: 11, lineHeight: 13, letterSpacing: -0.44, color: C.mute },
  foot: { position: 'absolute', left: 24, right: 24, top: 466, bottom: 7, flexDirection: 'row', alignItems: 'center', gap: 12 },
  hook: { ...EXTRA, fontSize: 16, lineHeight: 18, letterSpacing: -0.8, color: C.white },
  url: { ...sansW('500'), marginTop: 8, fontSize: 14, lineHeight: 17, letterSpacing: -0.56, color: C.mute },
  link: { marginRight: -4, backgroundColor: 'rgba(255,255,255,0.14)' },
});
