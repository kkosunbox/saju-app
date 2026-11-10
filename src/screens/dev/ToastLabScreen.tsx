/**
 * 토스트 · 풀이 완성 알림 확인 (개발용, /dev/toast).
 * - 토스트 두 종류(일반 / 눌러서 이동)를 바로 띄워 본다
 * - 풀이 완성 신호를 흉내 내서, 실제 앱과 같은 판단(readingDone.ts)으로 무엇이 뜨는지 본다
 * - 앱에서는 서버 푸시와 같은 모양의 알림을 몇 초 뒤 띄워, 앱을 켜 둘 때·백그라운드일 때를 비교한다
 * 라우트(src/app/dev/toast.tsx)는 로컬 개발 서버(__DEV__)에서만 이 화면을 연다. 배포 번들에는 들어가지 않는다.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Switch, Text, View } from 'react-native';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import PressableScale from '../../components/PressableScale';
import PrimaryButton from '../../components/PrimaryButton';
import { usePremium } from '../../context/PremiumContext';
import { hrefOfKey, titleOfKey } from '../../services/premium/catalog';
import { markViewing } from '../../services/readingPresence';
import { announceReadingDone, ReadingDoneOutcome } from '../../services/readingDone';
import { push } from '../../services/push';
import { colors } from '../../theme/colors';
import { sansW } from '../../theme/typography';

const KEYS = ['saju', 'monthly:2026-11', 'theme:love', 'lucky:move', 'spouse', 'pet:1', 'compat:1'];
const PUSH_DELAY_S = 5;

const OUTCOME: Record<ReadingDoneOutcome, string> = {
  viewing: '그 화면을 보고 있어서 아무것도 띄우지 않았어요',
  background: '앱이 백그라운드라 앱은 아무것도 안 해요 (서버 푸시가 알려요)',
  pushed: '이미 푸시로 알려서 토스트를 띄우지 않았어요 (알림 센터에 남아 있거나 눌러서 들어옴)',
  toast: '다른 화면에 있는 것으로 보고 눌러서 이동하는 토스트를 띄웠어요',
};

export default function ToastLabScreen() {
  const { toast } = usePremium();
  const [key, setKey] = useState(KEYS[0]);
  const [viewing, setViewing] = useState(false);
  const [outcome, setOutcome] = useState<string | null>(null);
  const [pushNote, setPushNote] = useState<string | null>(null);

  // "그 화면을 보고 있다고 치기": 켜 둔 동안 고른 콘텐츠를 보고 있는 것으로 기록한다
  useEffect(() => (viewing ? markViewing(key) : undefined), [viewing, key]);

  // 알림을 예약하고 앱을 백그라운드로 보냈다 돌아오는 사이에도 결과 문구가 남게
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  const simulate = async () => {
    const result = await announceReadingDone(key, toast);
    if (mounted.current) setOutcome(OUTCOME[result]);
  };

  const schedulePush = async () => {
    const ok = await push.devScheduleReadingDone(key, PUSH_DELAY_S);
    setPushNote(ok
      ? `${PUSH_DELAY_S}초 뒤에 알림이 와요. 지금 홈으로 나가면 알림이 뜨고, 앱을 켜 두면 배너가 숨겨져요`
      : '알림 권한이 없어요. 설정 앱에서 알림을 켜 주세요');
  };

  return (
    <Screen title="토스트 · 완성 알림" back>
      <Text style={s.lead}>토스트 모양과, AI 풀이가 다 써졌을 때 상황별로 무엇이 뜨는지 확인해요. 서버는 부르지 않아요.</Text>

      <Text style={[s.label, { marginTop: 24 }]}>1. 토스트 모양</Text>
      <View style={s.buttons}>
        <PrimaryButton label="일반 토스트" variant="soft" small onPress={() => toast('출석 체크 +10알')} style={s.flex} />
        <PrimaryButton
          label="눌러서 이동"
          small
          onPress={() => toast(`${titleOfKey(key)} 풀이가 완성됐어요`, () => setOutcome(`토스트를 눌렀어요 → ${hrefOfKey(key)}`))}
          style={s.flex}
        />
      </View>
      <Text style={s.hint}>눌러서 이동 토스트는 여기서는 이동하지 않고 아래에 이동할 경로만 보여 줘요.</Text>

      <Text style={[s.label, { marginTop: 28 }]}>2. 풀이 완성 신호</Text>
      <Text style={s.hint}>실제 앱과 같은 판단으로 처리해요. 토스트를 누르면 진짜 그 화면으로 가요.</Text>
      <View style={s.chips}>
        {KEYS.map(k => (
          <PressableScale key={k} onPress={() => setKey(k)} style={[s.chip, k === key && s.chipOn]} scaleTo={0.95} accessibilityRole="radio" accessibilityState={{ selected: k === key }}>
            <Text style={[s.chipText, k === key && s.chipTextOn]}>{k}</Text>
          </PressableScale>
        ))}
      </View>
      <Card style={{ marginTop: 12 }}>
        <View style={s.row}>
          <View style={s.flex}>
            <Text style={s.name}>그 화면을 보고 있다고 치기</Text>
            <Text style={s.desc}>{titleOfKey(key)} 화면을 띄워 둔 것으로 기록해요</Text>
          </View>
          <Switch value={viewing} onValueChange={setViewing} />
        </View>
      </Card>
      <PrimaryButton label="풀이 완성 신호 보내기" onPress={simulate} style={{ marginTop: 12 }} />
      {outcome ? <Text style={s.result}>{outcome}</Text> : null}

      <Text style={[s.label, { marginTop: 28 }]}>3. 푸시 알림 (앱에서만)</Text>
      {Platform.OS === 'web' ? (
        <Text style={s.hint}>웹은 앱 푸시가 없어요. iOS·Android 개발 빌드에서 확인해 주세요.</Text>
      ) : (
        <>
          <Text style={s.hint}>서버가 보내는 것과 같은 알림을 이 기기에 띄워요. 알림을 누르면 고른 콘텐츠 화면으로 가요.</Text>
          <PrimaryButton label={`${PUSH_DELAY_S}초 뒤 완성 알림 받기`} variant="soft" onPress={schedulePush} style={{ marginTop: 12 }} />
          {pushNote ? <Text style={s.result}>{pushNote}</Text> : null}
        </>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  lead: { ...sansW('400'), fontSize: 14, lineHeight: 21, letterSpacing: -0.6, color: colors.inkSub, marginTop: 8 },
  label: { ...sansW('600'), fontSize: 15, lineHeight: 22, letterSpacing: -0.75, color: colors.ink },
  hint: { ...sansW('400'), fontSize: 13, lineHeight: 19, letterSpacing: -0.6, color: colors.inkMute, marginTop: 6 },
  buttons: { flexDirection: 'row', gap: 8, marginTop: 10 },
  flex: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  chip: { paddingHorizontal: 12, height: 32, borderRadius: 16, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: colors.navy },
  chipText: { ...sansW('500'), fontSize: 13, color: colors.ink },
  chipTextOn: { color: colors.white },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { ...sansW('600'), fontSize: 15, letterSpacing: -0.75, color: colors.ink },
  desc: { ...sansW('400'), fontSize: 13, lineHeight: 19, letterSpacing: -0.6, color: colors.inkMute, marginTop: 2 },
  result: { ...sansW('500'), fontSize: 13, lineHeight: 19, letterSpacing: -0.6, color: colors.accent, marginTop: 10 },
});
