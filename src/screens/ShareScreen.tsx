import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@/navigation/compat';
import Screen from '../components/Screen';
import ShareCard from '../components/ShareCard';
import PrimaryButton from '../components/PrimaryButton';
import Icon from '../components/Icon';
import { useApp } from '../context/AppContext';
import { usePremium } from '../context/PremiumContext';
import { RootStackParamList } from '../navigation/types';
import { shareCardImage } from '../services/shareService';
import { todaySpec } from '../services/share/shareSpecs';
import { useShare } from '../services/share/useShare';
import { colors } from '../theme/colors';
import { shadow, txt } from '../theme/typography';

/** 공유 카드 미리보기 · 테마 고르기 · 이미지 저장 / 공유 / 링크 복사 */
export default function ShareScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'Share'>>();
  const { fortune, user, today } = useApp();
  const { toast } = usePremium();
  const { sendLink, urlOf, reward } = useShare();
  const ref = useRef<View>(null);
  const [busy, setBusy] = useState<'share' | 'save' | null>(null);
  const spec = params?.spec ?? (fortune && user ? todaySpec(user, fortune.combined) : null);
  if (!spec) return null;

  const run = async (mode: 'share' | 'save') => {
    setBusy(mode);
    const r = await shareCardImage(ref, { file: spec.file, text: spec.text, url: urlOf(spec), mode });
    setBusy(null);
    if (r === 'saved') toast(mode === 'share' ? '이미지를 저장했어요. 인스타 스토리에 올려 보세요' : '이미지를 저장했어요');
    if (r === 'saved' || r === 'shared') reward(spec);
  };
  const copy = () => sendLink(spec);

  return (
    <Screen
      title="공유하기"
      back
      contentStyle={{ alignItems: 'center', justifyContent: 'center', flexGrow: 1, paddingTop: 12 }}
      footer={
        <View style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <PrimaryButton label={busy === 'save' ? '만드는 중…' : '이미지 저장'} variant="soft" onPress={() => run('save')} disabled={!!busy} style={{ flex: 1 }} />
            <PrimaryButton label={busy === 'share' ? '만드는 중…' : '공유하기'} onPress={() => run('share')} disabled={!!busy} style={{ flex: 1.4 }} icon={busy ? undefined : <Icon name="share" size={18} color={colors.white} />} />
          </View>
          <PrimaryButton label="링크만 복사하기" variant="text" onPress={copy} />
        </View>
      }
    >
      <View style={[s.shadow, shadow.hero]}>
        <ShareCard ref={ref} spec={spec} today={today} />
      </View>
      <Text style={[txt.caption, { marginTop: 12, textAlign: 'center' }]}>인스타그램 스토리에 꼭 맞는 9:16 크기예요{'\n'}가려진 내용은 앱에서만 볼 수 있어요</Text>
    </Screen>
  );
}

const s = StyleSheet.create({
  shadow: { borderRadius: 2, backgroundColor: colors.card },
});
