import React from 'react';
import { Text, View } from 'react-native';
import PressableScale from './PressableScale';
import { fonts, txt } from '../theme/typography';
import { colors } from '../theme/colors';

/**
 * 섹션 제목 — 신문 지면처럼 제목 옆으로 가는 선을 긋는다.
 * "01 · 제목" 형태면 번호를 낙관색 명조로 떼어 보여준다(유료 리포트 목차와 같은 리듬).
 */
export function HeadTitle({ title }: { title: string }) {
  const m = title.match(/^(\d{2}) · (.+)$/);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      {m ? <Text style={{ fontFamily: fonts.serif, fontSize: 15, fontWeight: '700', color: colors.seal, letterSpacing: 0.5 }}>{m[1]}</Text> : null}
      <Text style={[txt.h2, { flexShrink: 1 }]} accessibilityRole="header">{m ? m[2] : title}</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.lineStrong, marginLeft: 2, marginTop: 2 }} />
    </View>
  );
}

export default function SectionHeader({ title, caption, action, onAction, first }: { title: string; caption?: string; action?: string; onAction?(): void; first?: boolean }) {
  return (
    <View style={{ marginTop: first ? 8 : 32, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1 }}><HeadTitle title={title} /></View>
        {action ? (
          <PressableScale onPress={onAction} hitSlop={10} scaleTo={0.94}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.purpleSoft }}>{action}</Text>
          </PressableScale>
        ) : null}
      </View>
      {caption ? <Text style={[txt.small, { marginTop: 3 }]}>{caption}</Text> : null}
    </View>
  );
}
