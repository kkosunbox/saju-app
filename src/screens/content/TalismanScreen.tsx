import React, { RefObject, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View, type ViewInstance } from 'react-native';
import { Image as AssetImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import Screen from '../../components/Screen';
import ShareActions from '../../components/ShareActions';
import { useApp } from '../../context/AppContext';
import { usePremium } from '../../context/PremiumContext';
import { useFreeContent } from '../../services/server/contentApi';
import LoadingScreen from '../../components/LoadingScreen';
import { formatKoreanDate } from '../../utils/date';
import { sansW, txt } from '../../theme/typography';
import { colors } from '../../theme/colors';
import { talismanSpec } from '../../services/share/shareSpecs';
import { shareLink, appUrl } from '../../services/share/linkShare';
import { WebCard, renderCardWeb, shareCardImage } from '../../services/shareService';
import TalismanPaper, { GiftTalismanPaper, PAPER_H as H, PAPER_W as W } from '../../components/TalismanPaper';
import FriendCompare from '../../components/FriendCompare';
import ScratchCover from '../../components/ScratchCover';
import PrimaryButton from '../../components/PrimaryButton';
import PressableScale from '../../components/PressableScale';
import Segmented from '../../components/Segmented';
import TextField from '../../components/TextField';
import { GIFT_TALISMANS } from '../../content/giftTalismans';
import { useOpened } from '../../services/content/opened';

const LUCK_ICONS = {
  color: require('../../../assets/figma/talisman/color.svg'),
  number: require('../../../assets/figma/talisman/number.svg'),
  time: require('../../../assets/figma/talisman/time.svg'),
};

type Tab = 'mine' | 'gift';
const TABS: { key: Tab; label: string }[] = [{ key: 'mine', label: '오늘 나의 부적' }, { key: 'gift', label: '부적 선물하기' }];
const GIFT_FILE = 'woonpick-talisman-gift';
const EFFECT = '효력은 오늘 자정까지 지속되어요.';

/** 웹은 부적을 미리 그려 둔다 — 누른 뒤에 그리면 iOS 사파리가 공유(사진첩 저장)를 막는다 */
function usePreparedCard(ref: RefObject<ViewInstance | null>, ready: boolean, file: string, key: string) {
  const prepared = useRef<WebCard | null>(null);
  useEffect(() => {
    if (Platform.OS !== 'web' || !ready) return;
    let alive = true;
    const t = setTimeout(() => {
      renderCardWeb(ref, file).then(c => { if (alive) prepared.current = c; }).catch(() => {});
    }, 300);
    return () => { alive = false; clearTimeout(t); prepared.current = null; };
  }, [ready, key, ref, file]);
  return prepared;
}

/** 무료: 매일 바뀌는 오늘의 부적 + 친구에게 보내는 선물 부적 */
export default function TalismanScreen() {
  const { user: u, today } = useApp();
  const { toast, rewardShare } = usePremium();
  const card = useRef<ViewInstance>(null);
  const giftCard = useRef<ViewInstance>(null);
  const q = useFreeContent('talisman');
  const draw = useOpened('talisman');
  const [tab, setTab] = useState<Tab>('mine');
  const [revealDay, setRevealDay] = useState<string | null>(null);
  const [scratching, setScratching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [paperReady, setPaperReady] = useState(false);
  const [giftKey, setGiftKey] = useState(GIFT_TALISMANS[0].key);
  const [giftReady, setGiftReady] = useState(false);
  const [to, setTo] = useState('');
  const opened = draw.ready && draw.opened;
  const gift = GIFT_TALISMANS.find(g => g.key === giftKey) ?? GIFT_TALISMANS[0];
  const receiver = to.trim();
  const preparedMine = usePreparedCard(card, tab === 'mine' && opened && paperReady, 'woonpick-talisman', `${q.data?.hanja}|${q.data?.mantra}|${today}`);
  const preparedGift = usePreparedCard(giftCard, tab === 'gift' && giftReady, GIFT_FILE, `${giftKey}|${receiver}|${today}|${u?.nickname}`);
  if (!u) return null;
  if (!q.data) return <LoadingScreen title="오늘의 부적" error={q.error} onRetry={q.refetch} />;
  const t = q.data;
  const sealed = !opened;
  const spec = talismanSpec(u, t);
  const mine = tab === 'mine';
  const canSave = mine ? !sealed && paperReady : giftReady;

  const switchTab = (next: Tab) => {
    // 탭을 바꾸면 그 탭의 종이를 새로 그리므로 그림이 다시 뜰 때까지 기다린다
    setPaperReady(false);
    setGiftReady(false);
    setTab(next);
  };
  const pickGift = (key: string) => {
    if (key === giftKey) return;
    setGiftReady(false);
    setGiftKey(key);
  };
  const save = async () => {
    if (!canSave || busy) return;
    setBusy(true);
    try {
      const result = await shareCardImage(mine ? card : giftCard, {
        file: mine ? spec.file : GIFT_FILE, mode: 'save', aspectRatio: W / H, prepared: (mine ? preparedMine : preparedGift).current,
      });
      if (result === 'saved') toast('부적 이미지를 저장했어요');
    } finally {
      setBusy(false);
    }
  };
  // 부적 이미지와 함께 운픽으로 들어오는 링크를 보낸다 — 이미지 공유가 안 되는 브라우저는 링크만
  const sendGift = async () => {
    if (!giftReady || busy) return;
    setBusy(true);
    try {
      const text = `${u.nickname}님이 ${receiver ? `${receiver}님에게 ` : ''}${gift.label}의 부적을 보냈어요.\n"${gift.wish}"\n나의 오늘 부적도 받아 보세요.`;
      const result = await shareCardImage(giftCard, { file: GIFT_FILE, text, url: appUrl(), mode: 'share', fallback: 'none', aspectRatio: W / H, prepared: preparedGift.current });
      if (result === 'shared' || result === 'saved') void rewardShare(GIFT_FILE);
      if (result === 'unsupported') {
        const r = await shareLink(text);
        if (r === 'copied') toast('링크를 복사했어요. 친구에게 붙여 넣어 보내세요');
        if (r !== 'cancelled') void rewardShare(GIFT_FILE);
      }
    } finally {
      setBusy(false);
    }
  };
  const luck = [
    ['color', '행운의 색', t.color],
    ['number', '행운의 숫자', String(t.number)],
    ['time', '행운의 시간', t.time.replace('~', ' – ')],
  ] as const;

  return (
    <Screen
      title="오늘의 부적" titleStyle={s.screenTitle} back scrollEnabled={!scratching}
      contentStyle={s.content}
      right={canSave || busy ? (
        <PressableScale onPress={save} disabled={busy} style={s.save} accessibilityLabel="부적 이미지 저장" accessibilityState={{ disabled: busy, busy }}>
          {busy ? <ActivityIndicator size="small" color={colors.ink} /> : <AssetImage source={require('../../../assets/figma/talisman/download.svg')} style={s.downloadIcon} contentFit="contain" tintColor={colors.ink} />}
        </PressableScale>
      ) : undefined}
      footer={mine ? undefined : (
        <View style={s.footer}>
          <PressableScale onPress={save} disabled={!giftReady || busy} style={[s.footBtn, s.footSave]} scaleTo={0.96} accessibilityLabel="선물 부적 이미지 저장">
            <Text style={[s.footText, { color: colors.ink }]}>이미지 저장</Text>
          </PressableScale>
          <PressableScale onPress={sendGift} disabled={!giftReady || busy} style={[s.footBtn, s.footSend]} scaleTo={0.96} haptic accessibilityLabel="친구에게 부적 보내기">
            <Text style={[s.footText, { color: colors.white }]}>친구에게 부적 보내기</Text>
          </PressableScale>
        </View>
      )}
    >
      <Segmented<Tab> variant="figma" options={TABS} value={tab} onChange={switchTab} />
      {mine ? <>
        {sealed ? null : <View style={s.compare}><FriendCompare route="Talisman" spec={spec} /></View>}
        <View style={[s.frame, { opacity: draw.ready ? 1 : 0 }]}>
          <LinearGradient colors={['#FFD277', '#FDFCF5', '#FFE399']} locations={[0.21, 0.56, 0.96]} start={{ x: 0.85, y: 0 }} end={{ x: 0.15, y: 1 }} style={s.frameBg} />
          <AssetImage source={require('../../../assets/figma/talisman/mascot.webp')} style={s.mascot} contentFit="contain" accessible={false} />
          <Svg width={12} height={30} style={s.tail} pointerEvents="none">
            <Path d="M10 17.4C7.5 15.1 2.2 14.5 0 14.5C2 12.2 6.2 11.3 10 11.1L12 11V18Z" fill="#FFFFFF" />
          </Svg>
          <View style={s.bubble}>
            <Text style={s.bubbleText} numberOfLines={2} adjustsFontSizeToFit>
              {u.nickname}님,{'\n'}
              {sealed ? '오늘의 부적을 긁어 열어 보세요!' : <>오늘은 <Text style={s.bubbleStrong}>{t.keyword} ({t.hanja})</Text> 부적이 딱이에요!</>}
            </Text>
          </View>
          <View style={s.paperWrap}>
            <TalismanPaper ref={card} data={{ hanja: t.hanja, mantra: t.mantra, keyword: t.keyword, nickname: u.nickname }} today={today} onLoad={() => setPaperReady(true)} />
            {sealed ? <ScratchCover key={today} width={W} height={H} radius={32} title="오늘의 부적" hint="손가락으로 금박을 긁어 보세요" reveal={revealDay === today} onDone={draw.open} onScratching={setScratching} /> : null}
          </View>
        </View>
        {sealed ? (
          <>
            <Text style={[txt.caption, s.sealedCaption]}>{formatKoreanDate(today)} · {u.nickname}님에게 온 부적</Text>
            <PrimaryButton variant="text" small label="한 번에 보기" onPress={() => setRevealDay(today)} style={s.reveal} />
          </>
        ) : <>
          <Text style={s.effect}>{EFFECT}</Text>
          <ShareActions spec={spec} title="친구의 운도 PICK해 볼까요?" outlined image={{ ref: card, aspectRatio: W / H, prepared: () => preparedMine.current }} />
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
      </> : <>
        <View style={s.form}>
          <Text style={s.formLabel}>어떤 마음을 담을까요?</Text>
          <View style={s.kinds}>
            {[GIFT_TALISMANS.slice(0, 4), GIFT_TALISMANS.slice(4)].map((row, i) => (
              <View key={i} style={s.kindRow}>
                {row.map(g => {
                  const on = g.key === giftKey;
                  return (
                    <PressableScale key={g.key} onPress={() => pickGift(g.key)} style={[s.kind, on && s.kindOn]} scaleTo={0.94} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={`${g.label} 부적`}>
                      <Text style={[s.kindHanja, { color: g.mark }]}>{g.hanja}</Text>
                      <Text style={[s.kindLabel, on && { color: colors.white }]}>{g.label}</Text>
                    </PressableScale>
                  );
                })}
              </View>
            ))}
          </View>
          <Text style={[s.formLabel, s.toLabel]}>누구에게 보낼까요?</Text>
          <TextField compact value={to} onChangeText={setTo} placeholder="이름 또는 닉네임" maxLength={10} returnKeyType="done" accessibilityLabel="받는 사람 이름 또는 닉네임" />
        </View>
        <View style={s.giftPaper}>
          <View style={s.paperShadow}>
            <GiftTalismanPaper ref={giftCard} gift={gift} to={receiver} from={u.nickname} today={today} onLoad={() => setGiftReady(true)} />
          </View>
          <Text style={s.effect}>{EFFECT}</Text>
        </View>
      </>}
    </Screen>
  );
}

const FRAME_W = 311, FRAME_H = 548;
const SHADOW = { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 6 };
const s = StyleSheet.create({
  content: { paddingTop: 3 },
  screenTitle: { ...sansW('600'), fontSize: 18, lineHeight: 21, letterSpacing: 0 },
  save: { width: 44, height: 44, alignItems: 'flex-end', justifyContent: 'center' },
  downloadIcon: { width: 24, height: 24 },
  compare: { marginTop: 16, marginBottom: -16 },
  // 금빛 카드 (Figma 운픽_14_2) — 다크 모드에서도 그림처럼 밝게 둔다
  frame: { alignSelf: 'center', width: FRAME_W, height: FRAME_H, marginTop: 24, borderRadius: 20, backgroundColor: '#FDFCF5', ...SHADOW },
  frameBg: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: 20 },
  mascot: { position: 'absolute', left: 29, top: 21, width: 53, height: 53 },
  tail: { position: 'absolute', left: 89, top: 18 },
  bubble: { position: 'absolute', left: 98, top: 18, width: 187, height: 58, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 12, backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  bubbleText: { ...sansW('600'), fontSize: 13, lineHeight: 16, letterSpacing: -0.52, color: '#222222' },
  bubbleStrong: { ...sansW('800'), color: '#BC3827' },
  paperWrap: { position: 'absolute', left: 24, top: 108, width: W, height: H, borderRadius: 32, ...SHADOW },
  sealedCaption: { textAlign: 'center', marginTop: 16 },
  reveal: { marginTop: 4, alignSelf: 'center' },
  effect: { ...sansW('400'), marginTop: 16, fontSize: 12, lineHeight: 17, letterSpacing: -0.48, color: '#838383', textAlign: 'center' },
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
  // 선물하기 (Figma 운픽_14_3)
  form: { marginTop: 16, paddingHorizontal: 16, paddingTop: 19, paddingBottom: 16, borderRadius: 12, backgroundColor: colors.card },
  formLabel: { ...sansW('600'), fontSize: 14, lineHeight: 17, letterSpacing: -0.56, color: colors.ink },
  toLabel: { marginTop: 16, marginBottom: 8 },
  kinds: { marginTop: 8, gap: 8 },
  kindRow: { flexDirection: 'row', gap: 12 },
  kind: { flex: 1, height: 56, alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: 5, borderWidth: 1, borderColor: colors.lineStrong, backgroundColor: colors.surface },
  kindOn: { borderColor: colors.navy, backgroundColor: colors.navy },
  kindHanja: { ...sansW('600'), fontSize: 20, lineHeight: 24, letterSpacing: -0.4 },
  kindLabel: { ...sansW('600'), fontSize: 13, lineHeight: 16, letterSpacing: -0.26, color: colors.inkMute },
  giftPaper: { marginTop: 28, alignItems: 'center' },
  paperShadow: { width: W, height: H, borderRadius: 32, ...SHADOW },
  footer: { flexDirection: 'row', gap: 12 },
  footBtn: { height: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  footSave: { width: 111, backgroundColor: colors.card },
  footSend: { flex: 1, backgroundColor: colors.navy },
  footText: { ...sansW('500'), fontSize: 14, letterSpacing: -0.28 },
});
