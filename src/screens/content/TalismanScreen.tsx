import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { Image as AssetImage } from 'expo-image';
import Screen from '../../components/Screen';
import ShareActions from '../../components/ShareActions';
import { useApp } from '../../context/AppContext';
import { usePremium } from '../../context/PremiumContext';
import { useFreeContent } from '../../services/server/contentApi';
import LoadingScreen from '../../components/LoadingScreen';
import { formatKoreanDate } from '../../utils/date';
import { sansW, SCREEN_PX, txt } from '../../theme/typography';
import { colors } from '../../theme/colors';
import { talismanSpec } from '../../services/share/shareSpecs';
import { WebCard, renderCardWeb, shareCardImage } from '../../services/shareService';
import TalismanPaper, { PAPER_H as H, PAPER_W as W } from '../../components/TalismanPaper';
import FriendCompare from '../../components/FriendCompare';
import ScratchCover from '../../components/ScratchCover';
import PrimaryButton from '../../components/PrimaryButton';
import PressableScale from '../../components/PressableScale';
import { useOpened } from '../../services/content/opened';

const LUCK_ICONS = {
  color: require('../../../assets/figma/talisman/color.svg'),
  number: require('../../../assets/figma/talisman/number.svg'),
  time: require('../../../assets/figma/talisman/time.svg'),
};

/** 무료: 매일 바뀌는 오늘의 부적 */
export default function TalismanScreen() {
  const { user: u, today } = useApp();
  const { toast } = usePremium();
  const card = useRef<View>(null);
  const q = useFreeContent('talisman');
  const draw = useOpened('talisman');
  const [revealDay, setRevealDay] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [paperReady, setPaperReady] = useState(false);
  const opened = draw.ready && draw.opened;
  // 웹은 부적을 미리 그려 둔다 — 누른 뒤에 그리면 iOS 사파리가 공유(사진첩 저장)를 막는다
  const prepared = useRef<WebCard | null>(null);
  useEffect(() => {
    if (Platform.OS !== 'web' || !opened || !paperReady) return;
    let alive = true;
    const t = setTimeout(() => {
      renderCardWeb(card, 'woonpick-talisman').then(c => { if (alive) prepared.current = c; }).catch(() => {});
    }, 300);
    return () => { alive = false; clearTimeout(t); prepared.current = null; };
  }, [opened, paperReady, q.data?.hanja, q.data?.mantra, today]);
  if (!u) return null;
  if (!q.data) return <LoadingScreen title="오늘의 부적" error={q.error} onRetry={q.refetch} />;
  const t = q.data;
  const sealed = !opened;
  const spec = talismanSpec(u, t);
  const save = async () => {
    if (sealed || saving || !paperReady) return;
    setSaving(true);
    try {
      const result = await shareCardImage(card, { file: spec.file, mode: 'save', aspectRatio: W / H, prepared: prepared.current });
      if (result === 'saved') toast('부적 이미지를 저장했어요');
    } finally {
      setSaving(false);
    }
  };
  const luck = [
    ['color', '행운의 색', t.color],
    ['number', '행운의 숫자', String(t.number)],
    ['time', '행운의 시간', t.time.replace('~', ' – ')],
  ] as const;

  return (
    <Screen
      title="오늘의 부적" titleStyle={s.screenTitle} back scroll={!sealed}
      contentStyle={sealed ? SEALED_PAD : s.content}
      right={sealed ? undefined : (
        <PressableScale onPress={save} disabled={saving || !paperReady} style={s.save} accessibilityLabel="부적 이미지 저장" accessibilityState={{ disabled: saving || !paperReady, busy: saving }}>
          {saving ? <ActivityIndicator size="small" color={colors.ink} /> : <AssetImage source={require('../../../assets/figma/talisman/download.svg')} style={s.downloadIcon} contentFit="contain" tintColor={colors.ink} />}
        </PressableScale>
      )}
    >
      {sealed ? null : <FriendCompare route="Talisman" spec={spec} />}
      <View style={{ alignItems: 'center', opacity: draw.ready ? 1 : 0 }}>
        <View style={s.paperWrap}>
          <TalismanPaper ref={card} data={{ hanja: t.hanja, mantra: t.mantra, keyword: t.keyword, nickname: u.nickname }} today={today} onLoad={() => setPaperReady(true)} />
          {sealed ? <ScratchCover key={today} width={W} height={H} radius={12} title="오늘의 부적" hint="손가락으로 금박을 긁어 보세요" reveal={revealDay === today} onDone={draw.open} /> : null}
        </View>
      </View>
      {sealed ? (
        <>
          <Text style={[txt.caption, s.sealedCaption]}>{formatKoreanDate(today)} · {u.nickname}님에게 온 부적</Text>
          <PrimaryButton variant="text" small label="한 번에 보기" onPress={() => setRevealDay(today)} style={s.reveal} />
        </>
      ) : <>
        <ShareActions spec={spec} title="친구의 운도 PICK해 볼까요?" outlined image={{ ref: card, aspectRatio: W / H, prepared: () => prepared.current }} />
        <View style={s.sectionHead}>
          <Text style={s.sectionTitle} accessibilityRole="header">부적과 함께하는 행운</Text>
          <View style={s.sectionCaption}>
            <View style={s.divider} />
            <Text style={s.captionText}>매일 자정에 새 부적으로 바뀌어요</Text>
          </View>
        </View>
        <View style={s.luck}>
          {luck.map(([icon, label, value], i) => (
            <View key={icon} style={[s.luckRow, i > 0 && s.rowBorder]}>
              <AssetImage source={LUCK_ICONS[icon]} style={s.luckIcon} contentFit="contain" />
              <Text style={s.luckLabel}>{label}</Text>
              <Text style={s.luckValue}>{value}</Text>
            </View>
          ))}
        </View>
        <Text style={s.tip}>휴대폰 배경화면으로 저장해 두고 하루를 시작해 보세요.</Text>
      </>}
    </Screen>
  );
}

const SEALED_PAD = { paddingHorizontal: SCREEN_PX, paddingTop: 3 };
const s = StyleSheet.create({
  content: { paddingTop: 3 },
  screenTitle: { ...sansW('600'), fontSize: 18, lineHeight: 21, letterSpacing: 0 },
  save: { width: 44, height: 44, alignItems: 'flex-end', justifyContent: 'center' },
  downloadIcon: { width: 24, height: 24 },
  paperWrap: { width: W, height: H, borderRadius: 12, backgroundColor: '#FFF3B8', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 6 },
  sealedCaption: { textAlign: 'center', marginTop: 16 },
  reveal: { marginTop: 4, alignSelf: 'center' },
  sectionHead: { marginTop: 32, marginBottom: 16, flexDirection: 'row', alignItems: 'center', columnGap: 12, rowGap: 4, flexWrap: 'wrap' },
  sectionTitle: { ...sansW('600'), fontSize: 18, lineHeight: 21, letterSpacing: -0.9, color: colors.ink },
  sectionCaption: { flexDirection: 'row', alignItems: 'center', gap: 12, maxWidth: '100%' },
  divider: { width: 1, height: 14, backgroundColor: '#999999' },
  captionText: { ...sansW('500'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.inkMute, flexShrink: 1 },
  luck: { borderRadius: 12, backgroundColor: colors.card, overflow: 'hidden' },
  luckRow: { paddingLeft: 16, paddingRight: 20, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowBorder: { borderTopWidth: 1, borderColor: colors.lineStrong },
  luckIcon: { width: 16, height: 16 },
  luckLabel: { ...sansW('600'), fontSize: 14, lineHeight: 18, letterSpacing: -0.7, color: colors.ink },
  luckValue: { ...sansW('600'), flex: 1, fontSize: 14, lineHeight: 18, letterSpacing: -0.7, textAlign: 'right', color: colors.ink },
  tip: { ...sansW('700'), marginTop: 20, fontSize: 12, lineHeight: 17, letterSpacing: -0.48, color: colors.inkMute, textAlign: 'center' },
});
