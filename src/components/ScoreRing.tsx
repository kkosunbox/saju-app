import React, { useEffect, useId, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import AnimatedNumber from './AnimatedNumber';
import { useReducedMotion, motion } from '../utils/motion';
import { fonts } from '../theme/typography';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  score: number; size?: number; stroke?: number;
  color?: string; track?: string; textColor?: string;
  label?: string; delay?: number; animate?: boolean;
}

/** 달의 궤도처럼 차오르는 점수 링 + 숫자 카운트업 */
export default function ScoreRing({
  score, size = 132, stroke = 9, color = '#D9B872', track = 'rgba(255,255,255,0.14)',
  textColor = '#FFFFFF', label, delay = 150, animate = true,
}: Props) {
  const reduced = useReducedMotion();
  // React 19.1의 useId는 «r0» 형식 → SVG url(#id)에 쓸 수 없는 문자를 모두 제거
  const gid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const startsFinished = !animate || reduced;
  const progress = useRef(new Animated.Value(startsFinished ? score : 0)).current;
  const r = (size - stroke) / 2 - 2;
  const c = 2 * Math.PI * r;

  useEffect(() => {
    if (!animate || reduced) {
      progress.setValue(score);
      return;
    }
    progress.setValue(0);
    Animated.timing(progress, { toValue: score, duration: motion.slow, delay, easing: motion.easeOut, useNativeDriver: false }).start();
  }, [score, animate, reduced]);

  const offset = progress.interpolate({ inputRange: [0, 100], outputRange: [c, 0] });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} accessible accessibilityLabel={`${score}점`}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id={`ring${gid}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0.5} />
            <Stop offset="1" stopColor={color} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2} cy={size / 2} r={r}
          stroke={`url(#ring${gid})`} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={offset}
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <AnimatedNumber value={progress} initial={startsFinished ? score : 0} style={{ fontFamily: fonts.serif, fontSize: size * 0.32, fontWeight: '500', color: textColor, letterSpacing: -1, fontVariant: ['tabular-nums'] }} />
      {label ? <Text style={{ fontSize: 12, fontWeight: '600', color: textColor, opacity: 0.75, marginTop: -2 }}>{label}</Text> : null}
    </View>
  );
}
