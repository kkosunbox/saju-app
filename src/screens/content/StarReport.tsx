import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Card from '../../components/Card';
import ScoreBar from '../../components/ScoreBar';
import SectionHeader from '../../components/SectionHeader';
import StarAvatar from '../../components/StarAvatar';
import { Logo } from '../../components/Mascot';
import { Bullet } from '../../components/premium/Kit';
import { colors, isDark } from '../../theme/colors';
import { radius, sansW, txt } from '../../theme/typography';
import type { User } from '../../types';
import type { StarMatchDetail } from '../../types/content';

const THREAD = isDark ? '#E6A9C3' : '#B96284';
/** 피그마 연예인 궁합 — 하트·번호 동그라미 색 */
const ROSE = '#B05779';
const CHEMI_BG = isDark ? '#3A2530' : '#FEF0F3';
const BARS: ['love' | 'personality' | 'conversation' | 'life', string][] = [['love', '연애'], ['personality', '성격'], ['conversation', '대화'], ['life', '생활']];
const DRAMA_ART = {
  friends: require('../../../assets/figma/content/star/drama-friends.webp'),
  reunion: require('../../../assets/figma/content/star/drama-reunion.webp'),
  status: require('../../../assets/figma/content/star/drama-status.webp'),
  fate: require('../../../assets/figma/content/star/drama-fate.webp'),
};
const HEART = require('../../../assets/figma/content/star/heart.webp');

/** 섹션 제목 16/800 */
function Head({ title, caption }: { title: string; caption?: string }) {
  return <SectionHeader title={title} caption={caption} titleStyle={s.head} />;
}

/**
 * 연예인 궁합 히어로 (피그마 결과 화면) — 어두운 카드에 나와 연예인의 실루엣, 가운데 오늘의 점수 고리, 아래 한 줄.
 * 실루엣은 이름으로 고정된다 (StarAvatar).
 */
export function StarHero({ me, star, eyebrow }: { me: Pick<User, 'nickname' | 'gender'>; star: StarMatchDetail; eyebrow: string }) {
  return (
    <View style={s.hero}>
      <Image source={require('../../../assets/figma/content/star/hero-bg.webp')} style={StyleSheet.absoluteFill} contentFit="cover" accessible={false} />
      <Image source={HEART} style={[s.deco, { left: 18, top: 44 }]} accessible={false} />
      <Image source={HEART} style={[s.deco, { right: 12, top: 116 }]} accessible={false} />
      <View style={s.logo}><Logo height={20} color="#FFFFFF" /></View>
      <Text style={s.eyebrow} numberOfLines={1}>{eyebrow}</Text>
      <View style={s.pair}>
        <View style={s.side}>
          <StarAvatar name={me.nickname} gender={me.gender} size={80} />
          <Text style={s.who} numberOfLines={1}>{me.nickname}</Text>
          <Text style={s.char} numberOfLines={1}>{star.me.character}</Text>
        </View>
        <View style={s.mid}>
          <View style={s.ring} accessible accessibilityLabel={`오늘의 궁합 ${star.score}점`}>
            <Image source={require('../../../assets/figma/content/star/score-ring.svg')} style={StyleSheet.absoluteFill} contentFit="contain" accessible={false} />
            <Text style={s.score}>{star.score}</Text>
            <Text style={s.scoreLabel}>오늘의 궁합</Text>
          </View>
        </View>
        <View style={s.side}>
          <StarAvatar name={star.name} gender={star.gender} size={80} />
          <Text style={s.who} numberOfLines={1}>{star.name}</Text>
          <Text style={s.char} numberOfLines={1}>{star.character}</Text>
        </View>
      </View>
      <Text style={s.bond} numberOfLines={1}>{star.bond}</Text>
    </View>
  );
}

/** 연예인 궁합 풀이 (피그마 '자세히 보기') — 분야 점수 · 케미 유형 · 왜 잘 맞을까 · 함께라면 · 연인이라면 · 드라마 · 이런 순간 */
export function StarSections({ me, star }: { me: Pick<User, 'nickname'>; star: StarMatchDetail }) {
  return (
    <>
      <Card style={{ marginTop: 16 }}>
        {BARS.map(([k, label]) => (
          <View key={k} style={s.barRow}>
            <Text style={s.barLabel}>{label}</Text>
            <View style={{ flex: 1 }}><ScoreBar value={star.scores[k]} color={THREAD} track={isDark ? colors.lineStrong : '#F1E3E6'} /></View>
            <Text style={s.barValue}>{star.scores[k]}</Text>
          </View>
        ))}
      </Card>

      {star.chemistry ? (
        <View style={s.chemi}>
          <View style={s.chemiHead}>
            <Image source={require('../../../assets/figma/content/star/favorites-fill.svg')} style={{ width: 20, height: 20 }} accessible={false} />
            <Text style={s.chemiTitle}>{star.chemistry.title}</Text>
          </View>
          <Text style={s.chemiLine}>{star.chemistry.line}</Text>
          <View style={s.tags}>
            {star.chemistry.tags.map(t => <View key={t} style={s.tag}><Text style={s.tagText}>{t}</Text></View>)}
          </View>
        </View>
      ) : null}

      <Head title="왜 잘 맞을까?" caption="두 사람의 사주가 만나는 자리" />
      <Card>
        {star.reasons.map(r => <Bullet key={r} color={THREAD} textStyle={txt.body}>{r}</Bullet>)}
      </Card>

      <Head title="함께라면 이런 하루" caption="상상은 자유니까요" />
      <Card>
        {star.together.map(t => <Bullet key={t} color={THREAD} textStyle={txt.body}>{t}</Bullet>)}
      </Card>

      {star.lover ? (
        <>
          <Head title="만약 우리가 연인이라면?" />
          <View style={s.lover}>
            <View style={s.loverCol}>
              <Text style={s.loverLabel}>먼저 다가가는 사람</Text>
              <Text style={s.loverValue} numberOfLines={1}>{star.lover.first === 'me' ? me.nickname : star.name}님</Text>
            </View>
            <Image source={require('../../../assets/figma/content/star/favorite-fill.svg')} style={s.loverHeart} accessible={false} />
            <View style={s.loverCol}>
              <Text style={s.loverLabel}>우리의 연애 스타일</Text>
              <Text style={s.loverValue} numberOfLines={1}>{star.lover.style}</Text>
            </View>
          </View>
        </>
      ) : null}

      {star.drama ? (
        <>
          <Head title="드라마 속 우리라면?" />
          <View style={s.drama}>
            <Image source={DRAMA_ART[star.drama.key]} style={s.dramaArt} contentFit="cover" accessible={false} />
            <View style={s.dramaText}>
              <Text style={s.dramaLabel}>우리의 로맨스 장르</Text>
              <Text style={s.dramaTitle}>{star.drama.title}</Text>
              <Text style={s.dramaLabel}>{star.drama.line}</Text>
            </View>
          </View>
        </>
      ) : null}

      {star.moments?.length ? (
        <>
          <Head title="이런 순간 잘 맞아요" caption="특히 더 가까워지는 시간들" />
          <View style={s.moments}>
            {star.moments.map((m, i) => (
              <View key={m.title} style={[s.moment, i > 0 && s.momentLine]}>
                <View style={s.num}><Text style={s.numText}>{i + 1}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.momentTitle}>{m.title}</Text>
                  <Text style={s.momentText}>{m.text}</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      ) : null}
    </>
  );
}

const s = StyleSheet.create({
  head: { ...sansW('800'), fontSize: 16, lineHeight: 19, letterSpacing: -0.64, color: isDark ? colors.ink : '#000000' },
  hero: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#0C030D', paddingTop: 20, paddingBottom: 20, alignItems: 'center' },
  deco: { position: 'absolute', width: 15.6, height: 14.8 },
  logo: { position: 'absolute', left: 12, top: 6 },
  eyebrow: { ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: '#DDDDDD' },
  pair: { flexDirection: 'row', justifyContent: 'center', marginTop: 11 },
  side: { width: 96, alignItems: 'center' },
  who: { ...sansW('600'), fontSize: 14, lineHeight: 17, letterSpacing: -0.7, color: '#FFFFFF', marginTop: 8, maxWidth: '100%' },
  char: { ...sansW('400'), fontSize: 13, lineHeight: 16, letterSpacing: -0.65, color: '#C5C5C5', marginTop: 4, maxWidth: '100%' },
  mid: { width: 96, alignItems: 'center', paddingTop: 12 },
  ring: { width: 78, height: 78, alignItems: 'center', paddingTop: 16 },
  score: { ...sansW('600'), fontSize: 32, lineHeight: 34, letterSpacing: -1.6, color: '#FFFFFF', fontVariant: ['tabular-nums'] },
  scoreLabel: { ...sansW('600'), fontSize: 10, lineHeight: 12, letterSpacing: -0.5, color: '#FFFFFF' },
  bond: { ...sansW('700'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: '#FFFFFF', marginTop: 7, paddingHorizontal: 16 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  barLabel: { ...sansW('600'), width: 32, fontSize: 13, lineHeight: 18, color: colors.inkSub },
  barValue: { ...sansW('700'), width: 28, fontSize: 14, lineHeight: 18, color: colors.ink, textAlign: 'right' },
  chemi: { marginTop: 16, borderRadius: radius.lg, backgroundColor: CHEMI_BG, padding: 16 },
  chemiHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chemiTitle: { ...sansW('600'), fontSize: 16, lineHeight: 20, letterSpacing: -0.8, color: isDark ? colors.ink : '#000000' },
  chemiLine: { ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: isDark ? colors.ink : '#000000', marginTop: 7 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 7 },
  tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 30, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF' },
  tagText: { ...sansW('600'), fontSize: 12, lineHeight: 14, color: isDark ? colors.ink : 'rgba(0,0,0,0.8)' },
  lover: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.lg, backgroundColor: colors.card, paddingTop: 12, paddingBottom: 13 },
  loverCol: { flex: 1, minWidth: 0, alignItems: 'center', gap: 4, paddingHorizontal: 8 },
  loverHeart: { width: 16, height: 16 },
  loverLabel: { ...sansW('400'), fontSize: 12, lineHeight: 18, letterSpacing: -0.6, color: isDark ? colors.inkSub : '#000000' },
  loverValue: { ...sansW('700'), fontSize: 14, lineHeight: 17, letterSpacing: -0.56, color: colors.ink, maxWidth: '100%' },
  drama: { flexDirection: 'row', alignItems: 'center', gap: 16, borderRadius: radius.lg, backgroundColor: colors.card, padding: 12 },
  dramaArt: { width: 144, height: 94, borderRadius: radius.lg },
  dramaText: { flex: 1, minWidth: 0, gap: 4 },
  dramaLabel: { ...sansW('400'), fontSize: 12, lineHeight: 18, letterSpacing: -0.6, color: isDark ? colors.inkSub : '#000000' },
  dramaTitle: { ...sansW('700'), fontSize: 14, lineHeight: 17, letterSpacing: -0.56, color: colors.ink },
  moments: { borderRadius: radius.lg, borderWidth: 1, borderColor: isDark ? colors.lineStrong : '#E8E8E8', overflow: 'hidden' },
  moment: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  momentLine: { borderTopWidth: 1, borderTopColor: isDark ? colors.lineStrong : '#E8E8E8' },
  num: { width: 24, height: 24, borderRadius: 12, backgroundColor: ROSE, alignItems: 'center', justifyContent: 'center' },
  numText: { ...sansW('700'), fontSize: 13, lineHeight: 16, letterSpacing: -0.52, color: '#FFFFFF' },
  momentTitle: { ...sansW('700'), fontSize: 13, lineHeight: 16, letterSpacing: -0.52, color: colors.ink },
  momentText: { ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: isDark ? colors.inkSub : '#000000', marginTop: 2 },
});
