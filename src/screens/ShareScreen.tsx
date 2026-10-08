import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import Screen from '../components/Screen';
import ShareCard from '../components/ShareCard';
import PrimaryButton from '../components/PrimaryButton';
import Icon from '../components/Icon';
import { useApp } from '../context/AppContext';
import { shareCardImage } from '../services/shareService';
import { formatKoreanDate } from '../utils/date';
import { colors } from '../theme/colors';
import { shadow } from '../theme/typography';

export default function ShareScreen() {
  const { fortune, user, today } = useApp();
  const ref = useRef<View>(null);
  const [busy, setBusy] = useState(false);
  if (!fortune || !user) return null;
  const share = async () => { setBusy(true); await shareCardImage(ref); setBusy(false); };
  return (
    <Screen
      title="공유하기"
      back
      contentStyle={{ alignItems: 'center', paddingTop: 8 }}
      footer={<PrimaryButton label={busy ? '이미지 만드는 중…' : '이미지로 공유하기'} onPress={share} disabled={busy} icon={busy ? undefined : <Icon name="share" size={18} color={colors.white} />} />}
    >
      <View style={[{ borderRadius: 28, backgroundColor: colors.purple }, shadow.hero]}>
        <ShareCard ref={ref} fortune={fortune.combined} nickname={user.nickname} dateLabel={formatKoreanDate(today)} />
      </View>
    </Screen>
  );
}
