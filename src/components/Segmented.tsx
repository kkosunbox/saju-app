import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View, Pressable, LayoutChangeEvent } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { radius, shadow } from '../theme/typography';

interface Props<T extends string> { options: { key: T; label: string }[]; value: T; onChange(v: T): void }

/** 선택 표시가 미끄러지듯 이동하는 세그먼트 컨트롤 */
export default function Segmented<T extends string>({ options, value, onChange }: Props<T>) {
  const [w, setW] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  const idx = Math.max(0, options.findIndex(o => o.key === value));
  const segW = w ? (w - 8) / options.length : 0;

  useEffect(() => {
    Animated.spring(x, { toValue: idx * segW, useNativeDriver: true, speed: 20, bounciness: 4 }).start();
  }, [idx, segW]);

  return (
    <View style={s.wrap} onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)} accessibilityRole="tablist">
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
            <Text style={[s.label, on && s.labelOn]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: 'row', backgroundColor: colors.line, borderRadius: 14, padding: 4 },
  thumb: { position: 'absolute', top: 4, left: 4, bottom: 4, backgroundColor: colors.card, borderRadius: radius.sm, ...shadow.card },
  item: { flex: 1, height: 38, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: colors.inkMute },
  labelOn: { color: colors.ink, fontWeight: '700' },
});
