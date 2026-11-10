import React from 'react';
import Screen from '../components/Screen';
import CombinedAnalysisContent from '../components/CombinedAnalysisContent';
import FortuneSealed from '../components/FortuneSealed';
import LoadingScreen from '../components/LoadingScreen';
import { useApp } from '../context/AppContext';
import { useFortuneDraw, useMarkOpened } from '../services/content/opened';
import { colors, isDark } from '../theme/colors';
import { sansW } from '../theme/typography';

const TITLE = '오늘의 운세 · 종합풀이';

export default function CombinedAnalysisScreen() {
  const { fortune, today, fortuneWriting } = useApp();
  const { sealed } = useMarkOpened('fortune');
  useFortuneDraw();
  if (!fortune) return null;
  // 화면을 띄워 둔 채 날짜가 바뀌었으면 새 날 운세는 홈에서 직접 뽑게 한다
  if (sealed) return <Screen title={TITLE} back><FortuneSealed message={'날짜가 바뀌었어요\n홈에서 오늘의 운세를 새로 뽑아 주세요'} /></Screen>;
  if (fortuneWriting) return <LoadingScreen title={TITLE} message="네 가지 관점을 엮어 오늘의 이야기를 쓰고 있어요" />;
  return (
    <Screen title={TITLE} titleStyle={{ ...sansW('600'), fontSize: 18, lineHeight: 21, letterSpacing: 0, color: isDark ? colors.ink : '#000000', includeFontPadding: false }} back contentStyle={{ paddingTop: 0 }}>
      <CombinedAnalysisContent fortune={fortune} today={today} />
    </Screen>
  );
}
