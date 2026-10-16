import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Screen from './Screen';
import PrimaryButton from './PrimaryButton';
import { colors } from '../theme/colors';
import { txt } from '../theme/typography';

/** While server content loads (or failed): the screen frame with a spinner or a retry. */
export default function LoadingScreen({ title, error, onRetry }: { title?: string; error?: unknown; onRetry?(): void }) {
  return (
    <Screen title={title} back>
      <View style={s.box}>
        {error ? (
          <>
            <Text style={[txt.body, { textAlign: 'center' }]}>불러오지 못했어요. 인터넷 연결을 확인해 주세요.</Text>
            {onRetry ? <PrimaryButton label="다시 시도" onPress={onRetry} style={{ marginTop: 16, alignSelf: 'stretch' }} /> : null}
          </>
        ) : (
          <ActivityIndicator color={colors.purple} />
        )}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({ box: { paddingVertical: 80, alignItems: 'center', justifyContent: 'center' } });
