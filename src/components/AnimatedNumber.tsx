import React, { useEffect, useState } from 'react';
import { Animated, Text, TextStyle, StyleProp } from 'react-native';

/** Animated.Value를 따라 올라가는 숫자 (점수 카운트업) */
export default function AnimatedNumber({ value, style, initial = 0 }: { value: Animated.Value; style?: StyleProp<TextStyle>; initial?: number }) {
  const [n, setN] = useState(initial);
  useEffect(() => {
    const id = value.addListener(({ value: v }) => setN(Math.round(v)));
    return () => value.removeListener(id);
  }, [value]);
  return <Text style={style}>{n}</Text>;
}
