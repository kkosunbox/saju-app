import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { colors, isDark } from '../theme/colors';
import { radius, sansW } from '../theme/typography';

/** 피그마 '요일별 흐름' 차트 색 (토큰에 없는 디자인 색) */
const BLUE = '#0967FE';
const CARD_BG = isDark ? colors.card : '#F2F5FD';
const SCORE_INK = isDark ? colors.ink : '#2E2F43';
const LABEL_INK = isDark ? colors.inkSub : '#43475B';
const BEST_INK = isDark ? colors.ink : '#02087E';
const BEST_PILL = isDark ? colors.surface : '#E3EBFD';
const GUIDE = isDark ? 'rgba(125,182,255,0.45)' : '#A9C8FA';

// 327×195 디자인 기준 좌표
const H = 195;
const PAD_X = 4;
const Y_TOP = 50; // 가장 높은 점
const Y_BOTTOM = 122; // 가장 낮은 점
const GUIDE_END = 150;
const LABEL_Y = 172;
const MIN_SPAN = 20; // 점수 차가 작아도 선이 납작해지지 않게 잡는 최소 폭

/**
 * 기간 운세의 흐름(요일·주차·월) 꺾은선 차트.
 * 가장 높은 점은 파란 말풍선으로 점수를 띄우고 아래 이름을 알약으로 감싼다.
 */
export default function FlowLineChart({ data }: { data: { label: string; score: number }[] }) {
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);
  const n = data.length;
  const scores = data.map(d => d.score);
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  const best = scores.indexOf(max);
  const span = Math.max(max - min, MIN_SPAN);
  const lo = max - span;
  const col = n ? (w - PAD_X * 2) / n : 0;
  const pts = data.map((d, i) => ({ x: PAD_X + col * (i + 0.5), y: Y_BOTTOM - ((d.score - lo) / span) * (Y_BOTTOM - Y_TOP) }));
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
  const area = pts.length ? `${line} L${pts[pts.length - 1].x} ${GUIDE_END} L${pts[0].x} ${GUIDE_END} Z` : '';

  return (
    <View style={s.card} onLayout={onLayout} accessible accessibilityLabel={data.map(d => `${d.label} ${d.score}점`).join(', ')}>
      {w > 0 && n > 0 ? (
        <>
          <Svg width={w} height={H} style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="flowArea" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={BLUE} stopOpacity={0.14} />
                <Stop offset="1" stopColor={BLUE} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Path d={area} fill="url(#flowArea)" />
            {pts.map((p, i) => (
              <Line key={`g${i}`} x1={p.x} y1={p.y} x2={p.x} y2={GUIDE_END} stroke={GUIDE} strokeWidth={1} strokeDasharray="2 2" />
            ))}
            <Path d={line} stroke={BLUE} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
            {pts.map((p, i) => i === best
              ? <Circle key={`p${i}`} cx={p.x} cy={p.y} r={6.5} fill={BLUE} stroke="#FFFFFF" strokeWidth={1.5} />
              : <Circle key={`p${i}`} cx={p.x} cy={p.y} r={5} fill="#FFFFFF" stroke="#4D93FF" strokeWidth={2} />)}
            <Rect x={pts[best].x - 16} y={pts[best].y - 36} width={32} height={22} rx={6} fill={BLUE} />
            <Path d={`M${pts[best].x - 4} ${pts[best].y - 14.5} L${pts[best].x} ${pts[best].y - 9.5} L${pts[best].x + 4} ${pts[best].y - 14.5} Z`} fill={BLUE} />
            {data.map((_, i) => i === best
              ? <Rect key="pill" x={pts[i].x - 16} y={LABEL_Y - 11} width={32} height={22} rx={11} fill={BEST_PILL} />
              : null)}
          </Svg>
          {pts.map((p, i) => (
            <Text key={`s${i}`} style={[s.score, i === best ? s.bubbleText : null, { left: p.x - 20, top: i === best ? p.y - 36 : p.y - 26 }]}>{data[i].score}</Text>
          ))}
          {pts.map((p, i) => (
            <Text key={`l${i}`} style={[s.label, i === best && s.labelBest, { left: p.x - 20, top: LABEL_Y - 9 }]}>{data[i].label}</Text>
          ))}
        </>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  card: { height: H, borderRadius: radius.lg, backgroundColor: CARD_BG, overflow: 'hidden' },
  score: { position: 'absolute', width: 40, textAlign: 'center', fontSize: 15, lineHeight: 18, ...sansW('600'), color: SCORE_INK, letterSpacing: -0.3 },
  bubbleText: { lineHeight: 22, ...sansW('700'), color: '#FFFFFF' },
  label: { position: 'absolute', width: 40, textAlign: 'center', fontSize: 13, lineHeight: 18, ...sansW('500'), color: LABEL_INK, letterSpacing: -0.5 },
  labelBest: { ...sansW('600'), color: BEST_INK },
});
