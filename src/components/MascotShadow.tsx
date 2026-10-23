import React, { useId } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

const COLOR = '#0B3F6E';
const W = 0.7;
const H = 0.11;

/**
 * 마스코트 발밑의 옅은 그림자. ResultMascot과 같은 칸(size×1.08 가로, size 세로) 안에 absolute로 둔다.
 * 몸통 너비(0.89)보다 좁게, 몸통 바닥(getMascotFrame의 0.93)보다 조금 아래에 깐다.
 * style로 그림자만 따로 움직인다 (눌리면 옆으로 퍼지고, 떠오르면 작아지는 식).
 */
export default function MascotShadow({ size, style }: { size: number; style?: StyleProp<Animated.WithAnimatedValue<ViewStyle>> }) {
  const id = `mascot-shadow-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: size * (0.54 - W / 2), top: size * (0.955 - H / 2), width: size * W, height: size * H }, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 20" preserveAspectRatio="none">
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor={COLOR} stopOpacity={0.3} />
            <Stop offset="0.6" stopColor={COLOR} stopOpacity={0.12} />
            <Stop offset="1" stopColor={COLOR} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={50} cy={10} rx={50} ry={10} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}
