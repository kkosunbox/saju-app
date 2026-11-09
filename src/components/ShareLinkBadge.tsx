import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SITE_URL } from '../content/seo';
import { sansW } from '../theme/typography';

/** 'woonpick.com' — 공유 카드 오른쪽 아래에 붙는 사이트 주소 */
const HOST = SITE_URL.replace(/^https?:\/\//, '');
const FG = '#EDEDED';

/** 피그마 Icon/Outline/globe-alt (12 틀 안에 9×9, 선 1.2) — 내보낸 SVG의 d를 그대로 옮겼다 */
const GLOBE = 'M10.3529 5.49997C10.3529 8.18017 8.1802 10.3529 5.5 10.3529M10.3529 5.49997C10.3529 2.81976 8.1802 0.647032 5.5 0.647032M10.3529 5.49997H0.647065M5.5 10.3529C2.8198 10.3529 0.647065 8.18017 0.647065 5.49997M5.5 10.3529C6.3934 10.3529 7.11765 8.18017 7.11765 5.49997C7.11765 2.81976 6.3934 0.647032 5.5 0.647032M5.5 10.3529C4.6066 10.3529 3.88235 8.18017 3.88235 5.49997C3.88235 2.81976 4.6066 0.647032 5.5 0.647032M0.647065 5.49997C0.647065 2.81976 2.8198 0.647032 5.5 0.647032';

/**
 * 공유 카드 링크 뱃지 — 남색 알약 안에 지구본 + woonpick.com (피그마 main bt_m).
 * 예전 '나도 뽑아보기' 버튼 자리. 캡처에서도 나오도록 View·Text·Svg만 쓴다.
 */
export default function ShareLinkBadge({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[s.badge, style]}>
      <View style={s.icon}>
        <Svg width={11} height={11} viewBox="0 0 11 11" fill="none">
          <Path d={GLOBE} stroke={FG} strokeWidth={1.29412} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </View>
      <Text style={s.text} numberOfLines={1}>{HOST}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 24, backgroundColor: '#1D212D' },
  icon: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center' },
  text: { ...sansW('600'), fontSize: 12, lineHeight: 15, letterSpacing: -0.24, color: FG },
});
