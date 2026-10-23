import { Text } from 'react-native';
import { router } from 'expo-router';
import Screen from '@/components/Screen';
import PrimaryButton from '@/components/PrimaryButton';
import Mascot from '@/components/Mascot';
import { txt } from '@/theme/typography';

/** 없는 주소 — 웹은 정적 404.html 로도 나간다 (scripts/web-postbuild.mjs) */
export default function NotFound() {
  return (
    <Screen title="페이지를 찾을 수 없어요" contentStyle={{ alignItems: 'center', paddingTop: 48 }}>
      <Mascot name="mascot" size={96} />
      <Text style={[txt.body, { marginTop: 20, textAlign: 'center' }]}>주소가 바뀌었거나 없어진 페이지예요.</Text>
      <PrimaryButton label="처음으로" onPress={() => router.replace('/')} style={{ marginTop: 28, alignSelf: 'stretch' }} />
    </Screen>
  );
}
