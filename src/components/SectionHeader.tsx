import React from 'react';
import { Text, View } from 'react-native';
import PressableScale from './PressableScale';
import { txt } from '../theme/typography';
import { colors } from '../theme/colors';

export default function SectionHeader({ title, caption, action, onAction, first }: { title: string; caption?: string; action?: string; onAction?(): void; first?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: first ? 8 : 32, marginBottom: 12 }}>
      <View style={{ flex: 1 }}>
        <Text style={txt.h2} accessibilityRole="header">{title}</Text>
        {caption ? <Text style={[txt.small, { marginTop: 2 }]}>{caption}</Text> : null}
      </View>
      {action ? (
        <PressableScale onPress={onAction} hitSlop={10} scaleTo={0.94}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.purpleSoft }}>{action}</Text>
        </PressableScale>
      ) : null}
    </View>
  );
}
