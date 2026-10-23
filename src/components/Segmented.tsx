import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View, Pressable, LayoutChangeEvent } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, isDark } from '../theme/colors';
import { radius } from '../theme/typography';
import { profileType } from '../theme/profileDesign';

interface Props<T extends string> { options: { key: T; label: string; renderIcon?(selected: boolean): React.ReactNode }[]; value: T; onChange(v: T): void; variant?: 'default' | 'figma' }

/** 선택 표시가 미끄러지듯 이동하는 세그먼트 컨트롤 */
export default function Segmented<T extends string>({ options, value, onChange, variant = 'default' }: Props<T>) {
  const gap = variant === 'figma' ? 4 : 0;
  const [w, setW] = useState(0);
  const [x] = useState(() => new Animated.Value(0));
  const idx = Math.max(0, options.findIndex(o => o.key === value));
  const segW = w ? (w - 8 - gap * (options.length - 1)) / options.length : 0;

  useEffect(() => {
    Animated.spring(x, { toValue: idx * (segW + gap), useNativeDriver: true, speed: 20, bounciness: 4 }).start();
  }, [idx, segW, gap, x]);

  return (
    <View style={[s.wrap, { gap }]} onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)} accessibilityRole="tablist">
      {segW > 0 && <Animated.View style={[s.thumb, { width: segW, transform: [{ translateX: x }] }]} />}
      {options.map(o => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            style={s.item}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => { if (!on) { Haptics.selectionAsync().catch(() => {}); onChange(o.key); } }}
          >
            <View style={[s.content, variant === 'figma' && { gap: 4 }]}>
              {o.renderIcon?.(on)}
              <Text style={[s.label, on && s.labelOn, variant === 'figma' && profileType(14, on ? '700' : '500', 17, 0, on ? colors.ink : '#808080')]}>{o.label}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: 'row', backgroundColor: isDark ? colors.card : '#ECEEF2', borderRadius: radius.sm, padding: 4 },
  thumb: { position: 'absolute', top: 4, left: 4, bottom: 4, backgroundColor: colors.cream, borderRadius: radius.xs },
  item: { flex: 1, height: 40, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 14, fontWeight: '500', color: '#808080', letterSpacing: -0.4 },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  labelOn: { color: colors.ink, fontWeight: '700' },
});
