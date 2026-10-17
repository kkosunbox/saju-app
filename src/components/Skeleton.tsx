import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleProp, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { radius, SCREEN_PX } from '../theme/typography';

export function SkeletonBlock({ style }: { style: StyleProp<ViewStyle> }) {
  const v = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const a = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(v, { toValue: 0.5, duration: 800, useNativeDriver: true }),
    ]));
    a.start();
    return () => a.stop();
  }, []);
  return <Animated.View style={[{ backgroundColor: colors.line, borderRadius: radius.sm, opacity: v }, style]} />;
}

/** 운세 계산 중 홈 레이아웃을 미리 보여줘 화면이 튀지 않게 */
export default function HomeSkeleton() {
  return (
    <View style={{ paddingHorizontal: SCREEN_PX, paddingTop: 16, gap: 14 }}>
      <SkeletonBlock style={{ width: 150, height: 24 }} />
      <SkeletonBlock style={{ width: 110, height: 14 }} />
      <SkeletonBlock style={{ height: 300, borderRadius: radius.xl, marginTop: 8 }} />
      <SkeletonBlock style={{ height: 76, borderRadius: radius.lg }} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <SkeletonBlock style={{ flex: 1, height: 160, borderRadius: radius.lg }} />
        <SkeletonBlock style={{ flex: 1, height: 160, borderRadius: radius.lg }} />
      </View>
    </View>
  );
}
