import React from 'react';
import { Text } from 'react-native';
import { colors } from '../theme/colors';

export default function Disclaimer({ compact }: { compact?: boolean }) {
  return (
    <Text style={{ fontSize: 11, color: colors.inkMute, lineHeight: 16, textAlign: 'center', marginTop: compact ? 20 : 36, opacity: 0.9 }}>
      재미와 참고를 위한 운세 콘텐츠예요.{'\n'}금전·건강·법률 등 중요한 결정은 전문가와 상의하세요.
    </Text>
  );
}
