import React from 'react';
import { Text } from 'react-native';

export default function Disclaimer({ compact, mt }: { compact?: boolean; mt?: number }) {
  return (
    <Text style={{ fontSize: 12, color: '#838383', lineHeight: 17, letterSpacing: -0.48, textAlign: 'center', marginTop: mt ?? (compact ? 20 : 36), paddingHorizontal: 20 }}>
      재미와 참고를 위한 운세 콘텐츠예요.{'\n'}금전·건강·법률 등 중요한 결정은 전문가와 상의하세요.
    </Text>
  );
}
