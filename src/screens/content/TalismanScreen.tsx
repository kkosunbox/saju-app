import React, { useRef, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
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
import { shareCardImage } from '../../services/shareService';
import FriendCompare from '../../components/FriendCompare';
import ScratchCover from '../../components/ScratchCover';
import PrimaryButton from '../../components/PrimaryButton';
import PressableScale from '../../components/PressableScale';
import { useOpened } from '../../services/content/opened';

/** Figma's illustrated paper stays light in both appearance modes. */
const INK = '#BC3827';
const W = 247, H = 335;
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
  if (!u) return null;
  if (!q.data) return <LoadingScreen title="오늘의 부적" error={q.error} onRetry={q.refetch} />;
  const t = q.data;
  const sealed = !draw.ready || !draw.opened;
  const spec = talismanSpec(u, t);
  const save = async () => {
    if (sealed || saving || !paperReady) return;
    setSaving(true);
    try {
      const result = await shareCardImage(card, { file: spec.file, mode: 'save', aspectRatio: W / H });
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
      title="오늘의 부적" back scroll={!sealed}
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
          <View ref={card} collapsable={false} style={s.paper}>
            <Image source={require('../../../assets/figma/talisman/paper.png')} style={s.paperImage} resizeMode="cover" onLoad={() => setPaperReady(true)} accessible={false} />
            <Text style={s.top}>{formatKoreanDate(today)}</Text>
            <View style={s.charm}><Text style={[s.hanja, t.hanja.length > 1 && s.multipleHanja]} adjustsFontSizeToFit numberOfLines={1}>{t.hanja}</Text></View>
            <View style={s.message}>
              <Text style={s.mantra} adjustsFontSizeToFit numberOfLines={2}>{t.mantra}</Text>
              <View style={s.keyword}><Text style={s.keywordText} numberOfLines={1}>{u.nickname} · 오늘의 {t.keyword}</Text></View>
            </View>
          </View>
          {sealed ? <ScratchCover key={today} width={W} height={H} radius={12} title="오늘의 부적" hint="손가락으로 금박을 긁어 보세요" reveal={revealDay === today} onDone={draw.open} /> : null}
        </View>
      </View>
      {sealed ? (
        <>
          <Text style={[txt.caption, s.sealedCaption]}>{formatKoreanDate(today)} · {u.nickname}님에게 온 부적</Text>
          <PrimaryButton variant="text" small label="한 번에 보기" onPress={() => setRevealDay(today)} style={s.reveal} />
        </>
      ) : <>
        <ShareActions spec={spec} title="친구의 운도 PICK해 볼까요?" outlined />
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
  save: { width: 44, height: 44, alignItems: 'flex-end', justifyContent: 'center' },
  downloadIcon: { width: 24, height: 24 },
  paperWrap: { width: W, height: H, borderRadius: 12, backgroundColor: '#FFF3B8', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 6 },
  paper: { flex: 1, borderRadius: 12, alignItems: 'center', overflow: 'hidden' },
  paperImage: { position: 'absolute', top: 0, left: 0, width: W, height: H },
  top: { ...sansW('500'), position: 'absolute', top: 16, fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: '#5D0000' },
  charm: { position: 'absolute', top: 48, left: 57, width: 134, height: 158, alignItems: 'center', justifyContent: 'center' },
  hanja: { ...sansW('700'), fontSize: 86, lineHeight: 112, letterSpacing: -4.3, color: INK, textAlign: 'center' },
  multipleHanja: { fontSize: 52, letterSpacing: -2.6 },
  message: { position: 'absolute', top: 230, left: 12, right: 12, alignItems: 'center' },
  mantra: { ...sansW('700'), fontSize: 16, lineHeight: 18, color: '#000000', textAlign: 'center', letterSpacing: -0.8 },
  keyword: { marginTop: 12, maxWidth: W - 32, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 24, borderWidth: 0.5, borderColor: INK },
  keywordText: { ...sansW('600'), fontSize: 12, lineHeight: 14, letterSpacing: -0.6, color: INK, opacity: 0.8 },
  sealedCaption: { textAlign: 'center', marginTop: 16 },
  reveal: { marginTop: 4, alignSelf: 'center' },
  sectionHead: { marginTop: 32, marginBottom: 16, flexDirection: 'row', alignItems: 'center', columnGap: 12, rowGap: 4, flexWrap: 'wrap' },
  sectionTitle: { ...sansW('600'), fontSize: 18, lineHeight: 21, letterSpacing: -0.9, color: colors.ink },
  sectionCaption: { flexDirection: 'row', alignItems: 'center', gap: 12, maxWidth: '100%' },
  divider: { width: 1, height: 14, backgroundColor: '#999999' },
  captionText: { ...sansW('500'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.inkMute, flexShrink: 1 },
  luck: { borderRadius: 12, backgroundColor: colors.card, overflow: 'hidden' },
  luckRow: { minHeight: 54, paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowBorder: { borderTopWidth: 1, borderColor: colors.lineStrong },
  luckIcon: { width: 16, height: 16 },
  luckLabel: { ...sansW('600'), fontSize: 14, lineHeight: 18, letterSpacing: -0.7, color: colors.ink },
  luckValue: { ...sansW('600'), flex: 1, fontSize: 14, lineHeight: 18, letterSpacing: -0.7, textAlign: 'right', color: colors.ink },
  tip: { ...sansW('700'), marginTop: 20, fontSize: 12, lineHeight: 17, letterSpacing: -0.48, color: colors.inkMute, textAlign: 'center' },
});
