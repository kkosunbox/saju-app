import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import PrimaryButton from './PrimaryButton';
import PressableScale from './PressableScale';
import OptionChip from './OptionChip';
import Icon from './Icon';
import { MBTI } from '../types';
import { MBTI_INFO } from '../data/mbtiData';
import { colors } from '../theme/colors';
import { radius, txt } from '../theme/typography';

/** MBTI 간이 테스트 — 축마다 한 문항 */
const QUIZ: { q: string; a: [string, string]; axis: [string, string] }[] = [
  { q: '주말에 충전하는 방법은?', a: ['친구들과 밖에서 놀기', '집에서 혼자 쉬기'], axis: ['E', 'I'] },
  { q: '새로운 일을 배울 때 나는?', a: ['순서와 사례부터 익힌다', '큰 그림과 원리부터 본다'], axis: ['S', 'N'] },
  { q: '친구가 고민을 털어놓으면?', a: ['해결책을 같이 찾는다', '먼저 마음을 공감해 준다'], axis: ['T', 'F'] },
  { q: '여행을 떠날 때 나는?', a: ['일정을 미리 짜둔다', '가서 끌리는 대로 다닌다'], axis: ['J', 'P'] },
];

/** MBTI 4문항 — 이것만 잠깐 따로 띄웠다가 결과를 들고 돌아간다 */
export default function MbtiQuiz({ onDone, onClose }: { onDone(t: MBTI): void; onClose(): void }) {
  const [ans, setAns] = useState<(0 | 1 | null)[]>([null, null, null, null]);
  const result = ans.every(x => x !== null) ? ans.map((x, k) => QUIZ[k].axis[x!]).join('') as MBTI : null;
  // 결과가 나오면 아래로 내려 보여준다
  const scroll = useRef<ScrollViewInstance>(null);
  useEffect(() => { if (result) scroll.current?.scrollToEnd({ animated: true }); }, [result]);
  return (
    <>
      <View style={s.top}>
        <PressableScale onPress={onClose} hitSlop={10} style={s.back} scaleTo={0.9} accessibilityLabel="MBTI 찾기 그만두기">
          <Icon name="chevronLeft" size={24} />
        </PressableScale>
      </View>
      <ScrollView ref={scroll} contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <Text style={txt.title}>4문항으로 MBTI 찾기</Text>
        <Text style={[txt.small, { marginTop: 6 }]}>나와 더 가까운 쪽을 골라주세요.</Text>
        <View style={{ gap: 18, marginTop: 28 }}>
          {QUIZ.map((qz, i) => (
            <View key={qz.q}>
              <Text style={s.quizQ}>{i + 1}. {qz.q}</Text>
              <View style={{ gap: 8, marginTop: 8 }}>
                {qz.a.map((a, k) => (
                  <OptionChip key={a} compact label={a} selected={ans[i] === k} onPress={() => setAns(prev => prev.map((x, j) => (j === i ? k as 0 | 1 : x)))} />
                ))}
              </View>
            </View>
          ))}
          {result ? (
            <View style={s.result}>
              <Text style={txt.small}>나의 MBTI는</Text>
              <Text style={s.resultType}>{result} · {MBTI_INFO[result].nickname}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: 24, paddingBottom: 12 }}>
        <PrimaryButton label="이걸로 할게요" onPress={() => result && onDone(result)} disabled={!result} />
      </View>
    </>
  );
}

const s = StyleSheet.create({
  top: { height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24 },
  back: { width: 44, height: 44, justifyContent: 'center' },
  quizQ: { fontSize: 15, fontWeight: '700', color: colors.ink },
  result: { alignItems: 'center', padding: 16, borderRadius: radius.lg, backgroundColor: colors.lavenderSoft },
  resultType: { fontSize: 20, fontWeight: '700', color: colors.purple, marginTop: 4 },
});
