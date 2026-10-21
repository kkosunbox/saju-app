import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useApp } from '../context/AppContext';
import PrimaryButton from '../components/PrimaryButton';
import PressableScale from '../components/PressableScale';
import Card from '../components/Card';
import BrandMark from '../components/BrandMark';
import { Illustration } from './OnboardingScreen';
import { COPY } from '../content/copy';
import { analysisTheme, colors } from '../theme/colors';
import { fonts, radius, txt } from '../theme/typography';

const SOURCES = ['saju', 'thai', 'mbti', 'blood'] as const;
const SOURCE_LINE: Record<(typeof SOURCES)[number], string> = {
  saju: '태어난 날의 네 기둥과 오늘의 일진이 만나는 자리',
  thai: '서양 · 인도 · 태국, 세 갈래 별점이 오늘 건네는 힌트',
  mbti: '지금의 성향이 오늘의 흐름을 어떻게 받는지',
  blood: '기질 한마디로 보는 오늘의 컨디션',
};
const FREE: [string, string, string][] = [
  ['日', '오늘의 운세', '종합 점수와 연애·재물·일·관계, 오늘 할 일과 피할 일'],
  ['週', '주간 · 월간 · 연간 흐름', '분야별로 좋은 날과 조심할 날'],
  ['和', '궁합', '상대 정보를 넣거나, 링크 하나로 친구에게 신청받기'],
  ['遊', '찰떡 MBTI · 사주 캐릭터 · 오늘의 부적 · 전생', '가볍게 보고 친구와 나누는 콘텐츠'],
];
const PAID = ['상세 사주 해석', '평생운 · 10년 대운', '신년 · 월별 운세', '연애 · 재물 · 직업 운세', '길일 찾기', '미래 배우자', '그 사람의 속마음', '말 못 할 고민 상담'];

/**
 * 웹 첫 화면 (프로필이 없는 방문자). 앱은 온보딩 슬라이드를 쓴다.
 * [내 운세 보기] → 프로필 입력 → 홈. 계정이 있으면 [로그인].
 */
export default function LandingScreen() {
  const { completeOnboarding } = useApp();
  const start = () => { completeOnboarding(); };
  const login = async () => { await completeOnboarding(); router.push('/login'); };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }}>
      <View style={s.top}>
        <BrandMark />
        <PressableScale onPress={login} hitSlop={12} scaleTo={0.94} accessibilityRole="link"><Text style={s.topLink}>로그인</Text></PressableScale>
      </View>
      <ScrollView contentContainerStyle={s.body}>
        <Illustration kind="sheet" />
        <Text style={[txt.title, s.hero]} accessibilityRole="header">{COPY.ask.replace('어떤 운을 ', '어떤 운을\n')}</Text>
        <Text style={[txt.body, { marginTop: 10 }]}>{COPY.pickMe} 생년월일만 넣으면 오늘의 운세가 바로 나와요. 가입하지 않아도 돼요.</Text>
        <PrimaryButton label="내 운세 보기 · 무료" onPress={start} style={{ marginTop: 20 }} />

        <Text style={s.h}>네 가지 관점으로 나를 읽어요</Text>
        <Card style={{ paddingVertical: 4, paddingHorizontal: 16 }}>
          {SOURCES.map((k, i) => (
            <View key={k} style={[s.row, i > 0 && s.line]}>
              <View style={[s.seal, { backgroundColor: analysisTheme[k].bg }]}><Text style={[s.sealText, { color: analysisTheme[k].color }]}>{analysisTheme[k].emoji}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>{analysisTheme[k].label}</Text>
                <Text style={txt.small}>{SOURCE_LINE[k]}</Text>
              </View>
            </View>
          ))}
        </Card>
        <Text style={[txt.small, { marginTop: 10 }]}>네 관점이 같은 말을 할수록 그날의 흐름이 또렷해져요. 그래서 한 가지 점보다 덜 들쭉날쭉해요.</Text>

        <Text style={s.h}>무료로 즐기기</Text>
        <Card style={{ paddingVertical: 4, paddingHorizontal: 16 }}>
          {FREE.map(([h, t, d], i) => (
            <View key={t} style={[s.row, i > 0 && s.line]}>
              <View style={[s.seal, { backgroundColor: colors.lavenderSoft }]}><Text style={[s.sealText, { color: colors.purple }]}>{h}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>{t}</Text>
                <Text style={txt.small}>{d}</Text>
              </View>
            </View>
          ))}
        </Card>

        <Text style={s.h}>{COPY.deeper}</Text>
        <View style={s.chips}>{PAID.map(p => <View key={p} style={s.chip}><Text style={s.chipText}>{p}</Text></View>)}</View>
        <Text style={[txt.small, { marginTop: 10 }]}>알로 원하는 것만 열어 보세요. 1,000원 = 100알, 가입하면 100알을 드려요.</Text>

        <Text style={s.h}>뽑은 결과는 친구와 나눠요</Text>
        <Illustration kind="story" />
        <Text style={[txt.small, { marginTop: 10 }]}>결과를 인스타 스토리 크기 카드로 만들고, 친구 결과와 나란히 비교해 보세요.</Text>

        <PrimaryButton label="내 운세 보기 · 무료" onPress={start} style={{ marginTop: 28 }} />
        <View style={s.footer}>
          <Text style={txt.caption}>운세는 재미와 참고를 위한 콘텐츠예요. 중요한 결정은 전문가와 상의하세요.</Text>
          <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
            <PressableScale onPress={() => router.push('/legal/terms')} hitSlop={8} accessibilityRole="link"><Text style={s.footLink}>이용약관</Text></PressableScale>
            <PressableScale onPress={() => router.push('/legal/privacy')} hitSlop={8} accessibilityRole="link"><Text style={s.footLink}>개인정보처리방침</Text></PressableScale>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  top: { height: 52, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topLink: { fontSize: 14, fontWeight: '700', color: colors.purple },
  body: { paddingHorizontal: 24, paddingBottom: 40 },
  hero: { fontSize: 28, lineHeight: 38, marginTop: 28 },
  h: { fontFamily: fonts.display, fontSize: 19, fontWeight: '700', color: colors.ink, marginTop: 36, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  line: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
  seal: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sealText: { fontFamily: fonts.serif, fontSize: 19, fontWeight: '700' },
  rowTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.inkSub },
  footer: { marginTop: 32, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
  footLink: { fontSize: 13, fontWeight: '600', color: colors.inkSub, textDecorationLine: 'underline' },
});
