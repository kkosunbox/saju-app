import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router, type Href } from 'expo-router';
import { useApp } from '../context/AppContext';
import PrimaryButton from '../components/PrimaryButton';
import Card from '../components/Card';
import BrandMark from '../components/BrandMark';
import BusinessFooter from '../components/BusinessFooter';
import Mascot from '../components/Mascot';
import { GUIDES, GUIDE_SLUGS, type GuideSlug } from '../content/guides';
import { colors, gradients } from '../theme/colors';
import { fonts, radius, txt } from '../theme/typography';
import { useWebTopBar, webSafeTop } from '../utils/webThemeColor';

/**
 * 웹 서비스 소개 페이지 (/g/*) — 로그인 없이 읽고 검색엔진이 인덱싱한다.
 * 본문은 모두 펼쳐 둔다 (정적 HTML에 들어가야 검색엔진이 읽는다). 다른 소개 페이지로는 <a href> 링크.
 * [시작] → 프로필이 있으면 그 서비스 화면, 없으면 프로필 입력.
 */
export default function GuideScreen({ slug }: { slug: GuideSlug }) {
  const g = GUIDES[slug];
  const { onboarded, user, completeOnboarding } = useApp();
  const insets = useSafeAreaInsets();
  const safeTop = webSafeTop(insets.top);
  const onScroll = useWebTopBar([[0, gradients.sky[0]], [safeTop + 56, gradients.sky[0]], [360, gradients.sky[1]], [520, gradients.sky[2]]]);
  const cta = `${g.name} 보러 가기`;
  const start = async () => {
    if (user) { router.push(g.route); return; }
    if (!onboarded) await completeOnboarding();
    router.replace('/profile-setup');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream, overflow: 'hidden' }}>
      {/* 당겨도 위가 하얗게 비지 않게 */}
      <View pointerEvents="none" style={[s.overscroll, { backgroundColor: gradients.sky[0] }]} />
      <ScrollView onScroll={e => onScroll(e.nativeEvent.contentOffset.y)} scrollEventThrottle={16}>
        <LinearGradient colors={gradients.sky} locations={[0, 0.5, 0.92]} style={[s.hero, { paddingTop: safeTop }]}>
          <View style={s.top}>
            <Link href="/" asChild>
              <Pressable accessibilityLabel="운Pick 홈" hitSlop={8}><BrandMark light /></Pressable>
            </Link>
          </View>
          <View style={s.art}><Mascot name={g.art} size={110} /></View>
          <View style={s.badge}><Text style={s.badgeText}>{g.badge}</Text></View>
          <Text style={[txt.title, s.headline]} role="heading" aria-level={1}>{g.name}</Text>
          <Text style={[txt.body, s.lead]}>{g.lead}</Text>
          <PrimaryButton label={cta} onPress={start} style={{ marginTop: 20 }} />
        </LinearGradient>

        <View style={s.body}>
          <Text style={s.h} role="heading" aria-level={2}>이런 걸 알 수 있어요</Text>
          <Card style={{ paddingVertical: 4, paddingHorizontal: 16 }}>
            {g.points.map(([t, d], i) => (
              <View key={t} style={[s.row, i > 0 && s.line]}>
                <View style={s.dot}><Text style={s.dotText}>{i + 1}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowTitle}>{t}</Text>
                  <Text style={txt.small}>{d}</Text>
                </View>
              </View>
            ))}
          </Card>

          <Text style={s.h} role="heading" aria-level={2}>{g.name}, 이렇게 봐요</Text>
          <View style={{ gap: 10 }}>
            {g.how.map(p => <Text key={p} style={txt.body}>{p}</Text>)}
          </View>

          <Text style={s.h} role="heading" aria-level={2}>자주 묻는 질문</Text>
          <View style={{ gap: 10 }}>
            {g.faq.map(([q, a]) => (
              <Card key={q} style={{ padding: 16, gap: 6 }}>
                <Text style={s.rowTitle} role="heading" aria-level={3}>{q}</Text>
                <Text style={txt.body}>{a}</Text>
              </Card>
            ))}
          </View>

          <PrimaryButton label={cta} onPress={start} style={{ marginTop: 32 }} />

          <Text style={s.h} role="heading" aria-level={2}>다른 운세도 PICK해 보세요</Text>
          <Card style={{ paddingVertical: 4, paddingHorizontal: 16 }}>
            {GUIDE_SLUGS.filter(k => k !== slug).map((k, i) => (
              <Link key={k} href={`/g/${k}` as Href} asChild>
                <Pressable style={StyleSheet.flatten([s.row, i > 0 && s.line])}>
                  <View style={s.seal}><Mascot name={GUIDES[k].art} size={30} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.rowTitle}>{GUIDES[k].name}</Text>
                    <Text style={txt.small}>{GUIDES[k].short}</Text>
                  </View>
                  <Text style={s.arrow}>→</Text>
                </Pressable>
              </Link>
            ))}
          </Card>

          <Text style={[txt.caption, { marginTop: 32 }]}>운세는 재미와 참고를 위한 콘텐츠예요. 중요한 결정은 전문가와 상의하세요.</Text>
          <BusinessFooter style={{ marginTop: 16 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  overscroll: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%' },
  hero: { paddingHorizontal: 24, paddingBottom: 28 },
  top: { height: 56, flexDirection: 'row', alignItems: 'center' }, // 랜딩 · 홈 상단 바와 같은 높이
  art: { alignItems: 'center', marginTop: 8 },
  badge: { alignSelf: 'center', marginTop: 16, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.card },
  badgeText: { fontSize: 12, fontWeight: '700', color: colors.purpleSoft },
  headline: { fontSize: 28, lineHeight: 38, marginTop: 10, textAlign: 'center' },
  lead: { marginTop: 10, textAlign: 'center' },
  body: { paddingHorizontal: 24, paddingBottom: 40, backgroundColor: colors.cream },
  h: { fontFamily: fonts.display, fontSize: 19, fontWeight: '700', color: colors.ink, marginTop: 36, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  line: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
  dot: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  dotText: { fontSize: 14, fontWeight: '700', color: colors.white },
  seal: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
  rowTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  arrow: { fontSize: 15, color: colors.inkMute },
});
