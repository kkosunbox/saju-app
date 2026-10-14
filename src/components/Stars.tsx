import React from 'react';
import { Text } from 'react-native';

export const starCount = (score: number) => (score >= 90 ? 5 : score >= 80 ? 4 : score >= 70 ? 3 : score >= 60 ? 2 : 1);

export default function Stars({ score, color = '#D9B872', size = 13 }: { score: number; color?: string; size?: number }) {
  const n = starCount(score);
  return (
    <Text style={{ fontSize: size, color, letterSpacing: 1.5 }} accessibilityLabel={`별 5개 중 ${n}개`}>
      {'★'.repeat(n)}<Text style={{ opacity: 0.28 }}>{'★'.repeat(5 - n)}</Text>
    </Text>
  );
}
