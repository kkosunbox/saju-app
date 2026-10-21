import React from 'react';
import { Text, View } from 'react-native';
import PressableScale from './PressableScale';
import Icon from './Icon';
import { fonts, txt } from '../theme/typography';
import { colors } from '../theme/colors';

/**
 * 섹션 제목 한 줄 — "제목 | 설명" (설명은 caption 으로 옆에 붙는다).
 * "01 · 제목" 형태면 번호를 하늘색으로 떼어 보여준다(유료 리포트 목차와 같은 리듬).
 */
export function HeadTitle({ title, caption }: { title: string; caption?: string }) {
  const m = title.match(/^(\d{2}) · (.+)$/);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 12, rowGap: 4, flexWrap: 'wrap' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
        {m ? <Text style={{ fontFamily: fonts.serif, fontSize: 15, fontWeight: '700', color: colors.accent }}>{m[1]}</Text> : null}
        <Text style={[txt.h2, { flexShrink: 1 }]} accessibilityRole="header">{m ? m[2] : title}</Text>
      </View>
      {caption ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, maxWidth: '100%' }}>
          <View style={{ width: 1, height: 14, backgroundColor: '#999999' }} />
          <Text style={[txt.small, { flexShrink: 1 }]}>{caption}</Text>
        </View>
      ) : null}
    </View>
  );
}

/** action 이 있으면 오른쪽 끝에 › 버튼 (라벨은 읽어 주기용, showAction 이면 › 앞에 글로도 보인다) */
export default function SectionHeader({ title, caption, action, onAction, first, showAction }: { title: string; caption?: string; action?: string; onAction?(): void; first?: boolean; showAction?: boolean }) {
  return (
    <View style={{ marginTop: first ? 8 : 32, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1 }}><HeadTitle title={title} caption={caption} /></View>
      {action ? (
        <PressableScale onPress={onAction} hitSlop={12} scaleTo={0.9} accessibilityLabel={action} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          {showAction ? <Text style={{ fontSize: 14, fontWeight: '500', color: colors.inkSub, letterSpacing: -0.5 }}>{action}</Text> : null}
          <Icon name="chevronRight" size={showAction ? 16 : 20} color={showAction ? colors.inkSub : colors.ink} />
        </PressableScale>
      ) : null}
    </View>
  );
}
