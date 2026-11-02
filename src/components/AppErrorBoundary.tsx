import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import type { ErrorBoundaryProps } from 'expo-router';
import PrimaryButton from '@/components/PrimaryButton';
import Mascot from '@/components/Mascot';
import { colors } from '@/theme/colors';
import { txt } from '@/theme/typography';

/**
 * 웹은 화면마다 청크를 따로 받는다(Expo Router async routes). 탭을 열어 둔 사이 새 배포가 나가면
 * 아직 안 연 화면의 예전 청크가 404가 되어 화면 전체가 하얗게 됐다 — 이때는 한 번 새로고침해 새 버전을 받는다.
 * 새로고침 직후 또 실패하면(진짜 네트워크 문제 등) 되풀이하지 않고 아래 화면을 보여 준다.
 */
const RELOADED_AT = 'woonpick:chunk-reload-at';
const RELOAD_COOLDOWN_MS = 30_000;

const isChunkLoadError = (error: Error) =>
  error.name === 'AsyncRequireError' || /Loading module .* failed/.test(error.message);

/** 방금 새로고침한 적이 없으면 true. sessionStorage 를 못 쓰면 되풀이될 수 있으니 하지 않는다 */
function canReload(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOADED_AT));
    return !last || Date.now() - last >= RELOAD_COOLDOWN_MS;
  } catch {
    return false;
  }
}

/** 루트 _layout 의 ErrorBoundary — 어느 화면에서 난 오류든 하얀 화면 대신 여기로 온다 */
export default function AppErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const [reloading] = useState(() => Platform.OS === 'web' && isChunkLoadError(error) && canReload());
  useEffect(() => {
    if (!reloading) return;
    try {
      sessionStorage.setItem(RELOADED_AT, String(Date.now()));
    } catch {}
    window.location.reload();
  }, [reloading]);
  if (reloading) return <View style={s.wrap} />;

  const again = () => {
    if (Platform.OS === 'web') window.location.reload();
    else void retry();
  };
  return (
    <View style={s.wrap}>
      <Mascot name="mascot" size={96} />
      <Text style={[txt.h2, s.title]}>화면을 불러오지 못했어요</Text>
      <Text style={[txt.body, s.body]}>잠시 후 다시 시도해 주세요.</Text>
      <PrimaryButton label="다시 시도" onPress={again} style={s.button} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, backgroundColor: colors.cream },
  title: { marginTop: 20, textAlign: 'center' },
  body: { marginTop: 8, textAlign: 'center' },
  button: { marginTop: 28, alignSelf: 'stretch' },
});
