import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { ConsultCat } from '../../services/content/consult';
import { colors } from '../../theme/colors';

/** 16×16 칸에 그린 단색 글리프 — c: 아이콘 색, t: 칸 색(아이콘 안의 뚫린 부분과 겹친 테두리) */
type Glyph = (c: string, t: string) => React.ReactNode;

// 앞에 겹친 모양은 칸 색 테두리를 먼저 깔고 그 위에 채운다 (웹의 paint-order: stroke)
const outlined = (t: string, shape: React.ReactNode, c: string) => (
  <>
    <G fill={t} stroke={t} strokeWidth={1.4} strokeLinejoin="round">{shape}</G>
    <G fill={c}>{shape}</G>
  </>
);

const GLYPHS: Record<ConsultCat, Glyph> = {
  love: (c, t) => (
    <>
      <Path d="M7 14.5C3.5 12 1 9.8 1 6.8 1 4.6 2.6 3 4.5 3c1.1 0 2 .6 2.5 1.5C7.5 3.6 8.4 3 9.5 3 11.4 3 13 4.6 13 6.8c0 3-2.5 5.2-6 7.7z" fill={c} />
      {outlined(t, <Path d="M13 6.4c-1.5-1-2.6-2-2.6-3.3 0-.9.7-1.6 1.5-1.6.5 0 .9.2 1.1.6.2-.4.6-.6 1.1-.6.8 0 1.5.7 1.5 1.6 0 1.3-1.1 2.3-2.6 3.3z" />, c)}
    </>
  ),
  crush: (c, t) => (
    <>
      <Rect x={1} y={3} width={14} height={10.5} rx={2} fill={c} />
      <Path d="M2 4.2l6 4.8 6-4.8" fill="none" stroke={t} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  marriage: c => (
    <>
      <Circle cx={8} cy={10.2} r={4.4} fill="none" stroke={c} strokeWidth={2} />
      <Path d="M5.8 3.6L8 1.3l2.2 2.3L8 6z" fill={c} stroke={c} strokeWidth={0.8} strokeLinejoin="round" />
    </>
  ),
  // 재회 · 사업은 피그마 원본 (38px 칸 좌표라 11씩 당긴다)
  reunion: c => (
    <Path
      transform="translate(-11 -11)" fill={c}
      d="M26.9629 16.922C26.226 21.0953 22.2285 24.3635 18.9481 27C15.9401 24.438 12.1366 21.3459 11.1078 17.5972C10.6571 15.2216 11.6408 13.0138 13.669 12.2785C15.7383 11.5288 17.8919 12.2848 19.0089 14.6417C20.0161 12.5789 21.9816 11.6324 23.9549 12.1874C25.9282 12.7425 27.2411 14.6872 26.9629 16.924V16.922Z"
    />
  ),
  business: c => (
    <G transform="translate(-11 -11)" fill={c}>
      <Path d="M25.787 19.4633C21.1439 20.3507 16.5784 20.3451 12.0535 19.3604C11.7569 19.2967 11.0454 18.9223 11.0415 18.6209L11.0086 16.2697C10.9969 15.4123 11.6483 14.6242 12.5479 14.6111L15.4559 14.5681L15.4694 12.5051C15.4753 11.7264 16.1383 11.0112 16.9835 11.0094L20.8706 11C21.8244 10.9963 22.6425 11.7619 22.6541 12.6829L22.6754 14.5793L25.5001 14.5943C26.4326 14.5999 27.0006 15.3356 26.9948 16.1705L26.9812 18.7969C26.7835 19.0122 26.2135 19.381 25.787 19.4633ZM21.4153 14.5587L21.33 12.2561L16.7858 12.3123L16.6792 14.5868L21.4153 14.5587Z" />
      <Path d="M26.9998 19.9837L26.9843 25.5772C26.9823 26.532 25.9762 27 25.1329 27L12.3144 26.9869C11.6999 26.9869 10.9981 26.1819 11 25.5941L11.0039 19.9818C13.1248 20.7681 15.0208 20.8485 17.1145 21.0208C17.0467 21.3634 17.227 22.3855 17.5934 22.3892L20.6468 22.436C20.8814 22.1159 20.9899 21.5431 21.0132 21.0226C23.041 20.8953 25.1038 20.7531 26.9998 19.9837Z" />
    </G>
  ),
  work: (c, t) => (
    <>
      <Rect x={3} y={1.5} width={10} height={13} rx={1.6} fill={c} />
      <G fill={t}>
        <Rect x={5} y={4} width={2} height={1.8} rx={0.4} /><Rect x={9} y={4} width={2} height={1.8} rx={0.4} />
        <Rect x={5} y={7.2} width={2} height={1.8} rx={0.4} /><Rect x={9} y={7.2} width={2} height={1.8} rx={0.4} />
        <Rect x={6.8} y={11} width={2.4} height={3.5} rx={0.5} />
      </G>
    </>
  ),
  job: (c, t) => (
    <>
      <Rect x={1} y={3} width={14} height={10.5} rx={2} fill={c} />
      <Circle cx={5} cy={7} r={1.6} fill={t} />
      <Path d="M2.8 11.2a2.2 1.8 0 0 1 4.4 0z" fill={t} />
      <Path d="M9.2 7h3.6M9.2 9.6h2.6" stroke={t} strokeWidth={1.3} strokeLinecap="round" />
    </>
  ),
  money: (c, t) => (
    <>
      <Circle cx={8} cy={8} r={6.6} fill={c} />
      <Path d="M4.9 5.6l1.3 5 1.8-3.6 1.8 3.6 1.3-5" fill="none" stroke={t} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  people: (c, t) => (
    <>
      <Circle cx={11.2} cy={4.8} r={2.2} fill={c} />
      <Path d="M7.6 13.5C7.6 10.6 9.2 9 11.2 9s3.6 1.6 3.6 4.5z" fill={c} />
      {outlined(t, <><Circle cx={5.4} cy={5.4} r={2.6} /><Path d="M1 14.5C1 11.2 3 9.6 5.4 9.6s4.4 1.6 4.4 4.9z" /></>, c)}
    </>
  ),
  friend: (c, t) => (
    <>
      <Circle cx={8} cy={8} r={6.6} fill={c} />
      <Circle cx={5.8} cy={6.6} r={0.95} fill={t} /><Circle cx={10.2} cy={6.6} r={0.95} fill={t} />
      <Path d="M5.2 9.5Q8 12.4 10.8 9.5" fill="none" stroke={t} strokeWidth={1.3} strokeLinecap="round" />
    </>
  ),
  family: (c, t) => (
    <>
      <Path d="M8 1.8l7 6h-1.8V14H2.8V7.8H1z" fill={c} stroke={c} strokeWidth={1} strokeLinejoin="round" />
      <Rect x={6.6} y={10} width={2.8} height={4.5} rx={0.6} fill={t} />
    </>
  ),
  children: (c, t) => (
    <>
      <Path d="M6.8 3.6Q6.8 1.2 8 1.2t1.2 2.4z" fill={c} />
      <Rect x={5.4} y={3.6} width={5.2} height={2} rx={0.6} fill={c} />
      <Rect x={4.8} y={6.2} width={6.4} height={8.6} rx={2} fill={c} />
      <Path d="M6.2 9h1.6M6.2 11.4h1.6" stroke={t} strokeWidth={1.1} strokeLinecap="round" />
    </>
  ),
  study: c => (
    <>
      <Path d="M8 2.4l7.5 3.6L8 9.6.5 6z" fill={c} stroke={c} strokeWidth={0.8} strokeLinejoin="round" />
      <Path d="M3.8 8.2v3q4.2 3 8.4 0v-3L8 10.3z" fill={c} />
      <Path d="M14.2 6.4v4" stroke={c} strokeWidth={1} strokeLinecap="round" />
      <Circle cx={14.2} cy={11} r={1} fill={c} />
    </>
  ),
  decision: c => (
    <>
      <Rect x={7.2} y={1.5} width={1.6} height={13} rx={0.8} fill={c} />
      <G fill={c} stroke={c} strokeWidth={1} strokeLinejoin="round">
        <Path d="M8.6 3h4.3l1.9 2-1.9 2H8.6z" /><Path d="M7.4 8.5H3.1l-1.9 2 1.9 2h4.3z" />
      </G>
    </>
  ),
  self: c => (
    <>
      <Path d="M8 15V8" stroke={c} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M8 9.4C4 9.8 1.6 7.2 1.8 3.8 5.6 3.6 8 6 8 9.4z" fill={c} />
      <Path d="M8 7.6c.2-3.6 2.6-6 6.2-5.8.2 3.4-2.2 5.9-6.2 5.8z" fill={c} />
    </>
  ),
};

/** 상담 주제 아이콘 — 흰 칸(38) 가운데에 하늘색 글리프(16) */
export default function CatIcon({ cat }: { cat: ConsultCat }) {
  const glyph = GLYPHS[cat] ?? GLYPHS.self;
  return (
    <View style={s.tile}>
      <Svg width={16} height={16} viewBox="0 0 16 16">{glyph(colors.accent, colors.surface)}</Svg>
    </View>
  );
}

const s = StyleSheet.create({
  tile: { width: 38, height: 38, borderRadius: 6, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
});
