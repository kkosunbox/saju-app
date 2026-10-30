import React, { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View, type ViewInstance } from 'react-native';
import { RouteProp, useRoute } from '@/navigation/compat';
import Screen from '../components/Screen';
import ShareCard from '../components/ShareCard';
import PrimaryButton from '../components/PrimaryButton';
import Icon from '../components/Icon';
import { useApp } from '../context/AppContext';
import { usePremium } from '../context/PremiumContext';
import { RootStackParamList } from '../navigation/types';
import { WebCard, renderCardWeb, shareCardImage } from '../services/shareService';
import { todaySpec } from '../services/share/shareSpecs';
import { useShare } from '../services/share/useShare';
import { colors, isDark } from '../theme/colors';
import { sansW } from '../theme/typography';
import { dayNumber, parseISO } from '../utils/date';

/** 그해의 날 수 (365 · 366) */
const daysInYear = (iso: string) => {
  const { y } = parseISO(iso);
  return dayNumber(`${y + 1}-01-01`) - dayNumber(`${y}-01-01`);
};

/** 공유 카드 미리보기 · 이미지 저장 / 공유 */
export default function ShareScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'Share'>>();
  const { fortune, user, today } = useApp();
  const { toast } = usePremium();
  const { sendImage, urlOf, reward } = useShare();
  const ref = useRef<ViewInstance>(null);
  const [busy, setBusy] = useState<'share' | 'save' | null>(null);
  const spec = params?.spec ?? (fortune && user ? todaySpec(user, fortune.combined, fortune.shareCard) : null);
  // 웹은 미리 그려 둔다 — 누른 뒤에 그리면 iOS 사파리가 공유를 막는다 (아직 못 그렸으면 누를 때 그린다)
  const prepared = useRef<WebCard | null>(null);
  useEffect(() => {
    if (Platform.OS !== 'web' || !spec) return;
    let alive = true;
    const t = setTimeout(() => {
      renderCardWeb(ref, spec.file).then(c => { if (alive) prepared.current = c; }).catch(() => {});
    }, 300);
    return () => { alive = false; clearTimeout(t); prepared.current = null; };
    // spec은 매번 새로 만들어지니 내용(파일 이름·문구)이 바뀔 때만 다시 그린다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec?.file, spec?.text]);
  if (!spec) return null;

  const save = async () => {
    setBusy('save');
    const r = await shareCardImage(ref, { file: spec.file, text: spec.text, url: urlOf(spec), mode: 'save', prepared: prepared.current });
    setBusy(null);
    if (r === 'saved') toast('이미지를 저장했어요');
    if (r === 'saved' || r === 'shared') reward(spec);
  };
  // 이미지 공유가 안 되는 브라우저(데스크톱 · 일부 인앱)는 다운로드 대신 문구·링크로 공유한다
  const share = async () => {
    setBusy('share');
    await sendImage(spec, { ref, prepared: () => prepared.current });
    setBusy(null);
  };

  return (
    <Screen
      title="공유하기"
      back
      titleStyle={{ ...sansW('600'), fontSize: 18, lineHeight: 21, letterSpacing: 0 }}
      contentStyle={{ alignItems: 'center', flexGrow: 1, paddingTop: 16 }}
      footer={
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <PrimaryButton size="medium" label={busy === 'save' ? '만드는 중…' : '이미지 저장'} variant="soft" onPress={save} disabled={!!busy} style={{ flex: 111 }} />
          <PrimaryButton size="medium" label={busy === 'share' ? '만드는 중…' : '공유하기'} onPress={share} disabled={!!busy} style={{ flex: 204 }} icon={busy ? undefined : <View style={{ marginRight: -4 }}><Icon name="external" size={16} strokeWidth={1.95} color={colors.white} /></View>} />
        </View>
      }
    >
      <View style={s.todayShadow}>
        <ShareCard ref={ref} spec={spec} today={today} />
      </View>
      <Text style={s.todayCaption}>{spec.today
        ? `올해 ${daysInYear(today)}일 중 오늘의 순위를 담았어요.`
        : '나의 결과를 친구에게 공유해 보세요.'}</Text>
    </Screen>
  );
}

const s = StyleSheet.create({
  // 피그마: 0 2 12 rgba(0,0,0,.2)
  todayShadow: { borderRadius: 20, backgroundColor: '#8ACAFF', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 6 },
  // 피그마: 카드 아래 16, 12/17 Regular #838383 — 카드 바깥이라 다크 모드에서는 글자색만 화면을 따른다
  todayCaption: { ...sansW('400'), marginTop: 16, fontSize: 12, lineHeight: 17, fontWeight: '400', letterSpacing: -0.48, textAlign: 'center', color: isDark ? colors.inkMute : '#838383' },
});
