import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp, RouteProp, useNavigation, useRoute } from '@/navigation/compat';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Icon from '../../components/Icon';
import PrimaryButton from '../../components/PrimaryButton';
import PressableScale from '../../components/PressableScale';
import Disclaimer from '../../components/Disclaimer';
import FriendCompare from '../../components/FriendCompare';
import { ShareIconButton } from '../../components/ShareCta';
import { ActRow, BodyState, Coin, DarkChip, Hero, LockCard, Para, SubHead, heroTxt } from '../../components/premium/Kit';
import BottomSheet from '../../components/BottomSheet';
import LoadingScreen from '../../components/LoadingScreen';
import { useApp } from '../../context/AppContext';
import { refreshPoints, usePremium } from '../../context/PremiumContext';
import { RootStackParamList } from '../../navigation/types';
import { catOf } from '../../services/content/consult';
import { ConsultAnswer, ConsultFacts, ConsultView, HelpLine, consultApi, consultKeys, isFullAnswer, useConsultStatus } from '../../services/server/consultApi';
import { consultSpec } from '../../services/share/shareSpecs';
import { queryClient } from '../../api/query';
import { ApiError } from '../../api/client';
import { colors } from '../../theme/colors';
import { fonts, radius, sansW, SCREEN_PX, txt } from '../../theme/typography';
import { CounselorTag, HelpLines, MyBubble, ReplyBubble, SuggestionChips, TOPIC_REC, kstDate, kstTime } from './parts';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SEND_ERROR: Record<string, string> = {
  CONSULT_UNAVAILABLE: '답변을 만들지 못했어요. 다시 물어봐 주세요',
  DUPLICATE_REQUEST: '아직 답을 쓰고 있어요. 잠시만 기다려 주세요',
  CONSULT_CLOSED: '이 상담의 이어 묻기가 끝났어요. 새 상담으로 물어봐 주세요',
};

/** 상담 대화 — 첫 답변(무료 미리보기면 결론까지) 아래로 이어 묻기가 쌓인다 */
export default function ConsultChatScreen() {
  const nav = useNavigation<Nav>();
  const { params } = useRoute<RouteProp<RootStackParamList, 'ConsultChat'>>();
  const id = Number(params?.id);
  const { user: u, account } = useApp();
  const { toast, goWallet } = usePremium();
  const insets = useSafeAreaInsets();
  const scroll = useRef<ScrollView>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState<string | null>(null);
  const [crisis, setCrisis] = useState<HelpLine[] | null>(null);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [del, setDel] = useState(false);
  const q = useQuery({ queryKey: consultKeys.one(id), queryFn: () => consultApi.get(id), enabled: Number.isFinite(id) });
  const status = useConsultStatus(!!account);
  const turnCount = q.data?.turns?.length ?? 0;
  // 새 말이 붙으면 아래로 (첫 화면은 답변 위에서 시작)
  useEffect(() => { if (turnCount || sending) setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 80); }, [turnCount, sending, crisis]);

  if (!u) return null;
  if (q.isPending || unlocking) return <LoadingScreen />;
  const e = q.data;
  if (!e?.answer) {
    return <Screen title="고민 상담" back><BodyState error onRetry={q.isError ? () => q.refetch() : undefined} /></Screen>;
  }
  const C = catOf(e.topic);
  const cost = status.data?.cost ?? 100;
  const limit = status.data?.followUpLimit ?? 10;
  const hours = status.data?.followUpHours ?? 24;
  const full = isFullAnswer(e.answer) && e.facts ? { answer: e.answer, facts: e.facts } : null;
  const spec = full ? consultSpec(u, { ...e, ...full }) : null;
  const turns = e.turns ?? [];
  const suggestions = (turns.length ? turns[turns.length - 1].followUps : e.answer.followUps) ?? [];
  const canAsk = !e.locked && e.followUpsLeft > 0;

  const put = (v: ConsultView) => {
    queryClient.setQueryData(consultKeys.one(id), v);
    queryClient.invalidateQueries({ queryKey: consultKeys.list });
  };

  const send = async (raw: string) => {
    const question = raw.trim();
    if (!question || sending) return;
    if (e.locked) { setUnlockOpen(true); return; }
    if (!canAsk) { toast(SEND_ERROR.CONSULT_CLOSED); return; }
    setSending(question); setInput(''); setCrisis(null);
    try {
      const v = await consultApi.followUp(id, question);
      if (v.status === 'crisis') setCrisis(v.helpLines ?? []);
      else put(v);
    } catch (err) {
      const code = err instanceof ApiError ? err.code : '';
      if (code === 'CONTENT_LOCKED') setUnlockOpen(true);
      if (code === 'CONSULT_CLOSED') q.refetch();
      else setInput(question); // 다시 보낼 수 있게 되돌려 둔다
      toast(SEND_ERROR[code] ?? '답변을 만들지 못했어요. 다시 물어봐 주세요');
    } finally {
      setSending(null);
    }
  };

  const unlock = async () => {
    setUnlockOpen(false); setUnlocking(true);
    try {
      const v = await consultApi.unlock(id);
      put(v);
      refreshPoints();
      toast(`전체 답변을 열었어요. ${hours}시간 동안 ${limit}번 더 물어볼 수 있어요`);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'INSUFFICIENT_POINTS') {
        toast(`${cost}P가 필요해요. 충전 후 다시 시도해 주세요`);
        goWallet?.();
      } else {
        toast('열지 못했어요. 포인트는 쓰이지 않았어요');
      }
    } finally {
      setUnlocking(false);
    }
  };

  const remove = async () => {
    setDel(false);
    try {
      await consultApi.remove(id);
      queryClient.removeQueries({ queryKey: consultKeys.one(id) });
      queryClient.invalidateQueries({ queryKey: consultKeys.list });
      toast('상담 기록을 지웠어요');
      nav.goBack();
    } catch {
      toast('지우지 못했어요. 잠시 후 다시 시도해 주세요');
    }
  };

  const rec = TOPIC_REC[e.topic];
  const footer = e.locked ? (
    <PrimaryButton label={`${cost}P로 전부 보고 이어서 물어보기`} icon={<Coin size={18} />} onPress={() => setUnlockOpen(true)} />
  ) : canAsk ? (
    <>
      <View style={s.inputRow}>
        <TextInput
          value={input} onChangeText={setInput} multiline maxLength={300}
          placeholder="이어서 물어보세요" placeholderTextColor={colors.inkMute}
          style={s.input} editable={!sending} accessibilityLabel="이어서 묻는 말"
        />
        <PressableScale onPress={() => send(input)} disabled={!input.trim() || !!sending} style={[s.sendBtn, (!input.trim() || sending) && { backgroundColor: colors.lavender }]} scaleTo={0.9} accessibilityLabel="보내기">
          <Icon name="send" size={20} color={colors.white} strokeWidth={2.2} />
        </PressableScale>
      </View>
      <Text style={[txt.caption, { textAlign: 'center', marginTop: 6 }]}>{e.followUpsLeft}번 더 물어볼 수 있어요{e.followUpUntil ? ` · ${kstTime(e.followUpUntil)}까지` : ''}</Text>
    </>
  ) : (
    <>
      <Text style={[txt.caption, { textAlign: 'center', marginBottom: 8 }]}>이 상담의 이어 묻기는 끝났어요</Text>
      <PrimaryButton label="새 고민 상담하기" variant="soft" onPress={() => nav.navigate('Tabs', { screen: 'Consult' })} />
    </>
  );

  return (
    <Screen title="고민 상담" back right={spec ? <ShareIconButton spec={spec} /> : undefined} scroll={false}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {spec ? <FriendCompare route="Consult" spec={spec} /> : null}
          <Text style={[txt.caption, { textAlign: 'center' }]}>{C.label} 고민 · {kstDate(e.createdAt)} · 나만 볼 수 있어요</Text>
          {e.question ? <MyBubble>{e.question}</MyBubble> : null}

          <CounselorTag />
          <Hero>
            <Text style={heroTxt.eyebrow}>{C.hanja} {C.label} 고민에 대한 답</Text>
            <Text style={[heroTxt.summ, { fontSize: 20, lineHeight: 29 }]}>{e.answer.headline}</Text>
            {full ? (
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 14 }}>
                <DarkChip gold>{full.facts.modeLabel}</DarkChip>
                <DarkChip>풀리는 달 {full.facts.bestMonth}</DarkChip>
              </View>
            ) : null}
          </Hero>
          <Card style={s.direct}>
            <Text style={s.directK}>결론부터</Text>
            <Text style={s.directV}>{e.answer.direct}</Text>
          </Card>
          <SubHead title="마음 읽기" />
          <Card><Para mt={0}>{e.answer.empathy}</Para></Card>

          {full ? <FullAnswer answer={full.answer} facts={full.facts} label={C.label} /> : <LockedRest cost={cost} hours={hours} limit={limit} onUnlock={() => setUnlockOpen(true)} />}

          {e.helpLines?.length ? <HelpLines lines={e.helpLines} /> : null}

          {turns.map(t => (
            <View key={t.createdAt}>
              <MyBubble>{t.question}</MyBubble>
              <CounselorTag />
              <ReplyBubble>{t.reply}</ReplyBubble>
            </View>
          ))}
          {sending ? (
            <>
              <MyBubble>{sending}</MyBubble>
              <CounselorTag />
              <ReplyBubble typing />
            </>
          ) : null}
          {crisis ? <HelpLines lines={crisis} crisis /> : null}

          {!sending && (e.locked || canAsk) ? (
            <SuggestionChips
              items={suggestions}
              caption={e.locked ? `${cost}P로 열면 이렇게 이어서 물어볼 수 있어요` : '이어서 물어보기'}
              onPick={send}
            />
          ) : null}

          {full ? <LockCard title={rec.title} desc={rec.desc} item={rec.item} onPress={() => nav.navigate(rec.to[0] as never, rec.to[1] as never)} /> : null}

          <PressableScale onPress={() => setDel(true)} hitSlop={8} style={{ alignSelf: 'center', marginTop: 24 }}>
            <Text style={s.delete}>이 상담 기록 지우기</Text>
          </PressableScale>
          <Text style={[txt.caption, { textAlign: 'center', marginTop: 12 }]}>재미와 참고를 위한 상담이에요. {e.expiresAt ? `${kstDate(e.expiresAt)}에 자동으로 지워져요.` : ''}</Text>
          <Disclaimer compact />
        </ScrollView>
        <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>{footer}</View>
      </KeyboardAvoidingView>

      <BottomSheet visible={unlockOpen} onClose={() => setUnlockOpen(false)}>
        <Text style={[txt.caption, { textAlign: 'center' }]}>고민 상담</Text>
        <Text style={[txt.h2, { textAlign: 'center', marginTop: 6 }]}>{cost}P로 전부 열까요?</Text>
        <Text style={[txt.small, { textAlign: 'center', marginTop: 8 }]}>사주로 본 나 · 3개월 흐름 · 해 볼 것과 피할 것 · 행동하기 좋은 날{'\n'}그리고 {hours}시간 동안 {limit}번 이어서 물어볼 수 있어요.</Text>
        <PrimaryButton label={`${cost}P로 열기`} icon={<Coin size={18} />} onPress={unlock} style={{ marginTop: 20 }} />
        <PrimaryButton label="취소" variant="soft" onPress={() => setUnlockOpen(false)} style={{ marginTop: 8 }} />
      </BottomSheet>
      <BottomSheet visible={del} onClose={() => setDel(false)}>
        <Text style={[txt.h2, { textAlign: 'center' }]}>상담 기록을 지울까요?</Text>
        <Text style={[txt.small, { textAlign: 'center', marginTop: 8 }]}>고민 글과 답변, 이어서 나눈 대화가 바로 지워지고 되돌릴 수 없어요.</Text>
        <PrimaryButton label="지우기" onPress={remove} style={{ marginTop: 20 }} />
        <PrimaryButton label="취소" variant="soft" onPress={() => setDel(false)} style={{ marginTop: 8 }} />
      </BottomSheet>
    </Screen>
  );
}

/** 무료 미리보기에서 잠긴 부분 — 무엇이 열리는지 보여 준다 */
function LockedRest({ cost, hours, limit, onUnlock }: { cost: number; hours: number; limit: number; onUnlock(): void }) {
  const rows = ['사주로 본 나', '지금의 흐름 · 앞으로 3개월', '이렇게 해 보세요 3가지', '이것만은 피하세요', '행동하기 좋은 날', `${hours}시간 동안 ${limit}번 이어 묻기`];
  return (
    <Card style={s.locked} onPress={onUnlock} accessibilityLabel={`${cost}P로 전체 답변 열기`}>
      <Text style={txt.h3}>나머지 답이 기다리고 있어요</Text>
      <View style={{ gap: 8, marginTop: 12 }}>
        {rows.map(r => (
          <View key={r} style={s.lockRow}>
            <View style={s.lockDot} />
            <Text style={{ fontSize: 14, color: colors.inkSub, flex: 1 }}>{r}</Text>
            <View style={s.lockBar} />
          </View>
        ))}
      </View>
      <View style={s.lockCta}><Coin size={16} /><Text style={{ fontSize: 14, fontWeight: '800', color: colors.purple }}>{cost}P로 전부 열기</Text></View>
    </Card>
  );
}

function FullAnswer({ answer: A, facts: F, label }: { answer: ConsultAnswer; facts: ConsultFacts; label: string }) {
  const mx = Math.max(...F.flow.map(f => f.score));
  return (
    <>
      <SubHead title="사주로 본 나" />
      <Card>
        <Para mt={0}>{A.me}</Para>
        <Para mt={10}>{A.star}</Para>
      </Card>

      <SubHead title="지금의 흐름" caption={`앞으로 3개월 · ${label} 운`} />
      <Card>
        <Para mt={0}>{A.now}</Para>
        <View style={s.bars}>
          {F.flow.map(f => (
            <View key={f.label} style={s.barCol}>
              <Text style={[s.barV, f.score === mx && { color: colors.love }]}>{f.score}</Text>
              <View style={[s.bar, { height: Math.max(10, (f.score - 50) * 1.8), backgroundColor: f.score === mx ? colors.love : colors.loveBg }]} />
              <Text style={txt.caption}>{f.label}</Text>
            </View>
          ))}
        </View>
      </Card>

      <SubHead title="이렇게 해 보세요" />
      <Card style={{ gap: 10 }}>{A.dos.map(t => <ActRow key={t}>{t}</ActRow>)}</Card>

      <SubHead title="이것만은 피하세요" />
      <Card style={{ gap: 10 }}>{A.avoid.map(t => <ActRow key={t} ok={false}>{t}</ActRow>)}</Card>

      <SubHead title="행동하기 좋은 날" caption="앞으로 30일 중 이 고민에 힘이 실리는 날" />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {F.goodDays.map(d => <View key={d.iso} style={s.day}><Text style={{ fontSize: 14, fontWeight: '700', color: colors.love }}>{d.label}</Text></View>)}
      </View>

      <Card style={s.closing}>
        <Text style={s.idiom}>{F.idiom[1]}</Text>
        <Text style={[txt.caption, { textAlign: 'center' }]}>{F.idiom[0]} · {F.idiom[2]}</Text>
        <Text style={s.closeText}>{A.closing}</Text>
      </Card>
    </>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: SCREEN_PX, paddingBottom: 24 },
  footer: { paddingHorizontal: SCREEN_PX, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong, backgroundColor: colors.cream },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 6, paddingLeft: 14, borderRadius: 24, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  input: { flex: 1, maxHeight: 110, paddingTop: 8, paddingBottom: 8, fontSize: 15, lineHeight: 21, color: colors.ink },
  sendBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.navy },
  direct: { marginTop: 12, borderLeftWidth: 3, borderLeftColor: colors.seal },
  directK: { fontSize: 12, fontWeight: '800', color: colors.seal, letterSpacing: 1 },
  directV: { ...sansW('600'), fontSize: 16.5, lineHeight: 25, color: colors.ink, marginTop: 6 },
  locked: { marginTop: 16, borderWidth: 1.5, borderColor: colors.purpleSoft, borderStyle: 'dashed' },
  lockRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  lockDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.purpleSoft },
  lockBar: { width: 64, height: 10, borderRadius: 5, backgroundColor: colors.lavenderSoft },
  lockCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16, paddingVertical: 12, borderRadius: radius.md, backgroundColor: colors.lavenderSoft },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 14, height: 120, marginTop: 16 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  barV: { fontFamily: fonts.serif, fontSize: 13, fontWeight: '600', color: colors.inkMute },
  bar: { width: '50%', borderRadius: 6 },
  day: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: radius.lg, backgroundColor: colors.loveBg },
  closing: { marginTop: 24, alignItems: 'center', paddingVertical: 24 },
  idiom: { fontFamily: fonts.serif, fontSize: 28, fontWeight: '700', color: colors.seal, letterSpacing: 4 },
  delete: { fontSize: 13, fontWeight: '600', color: colors.inkMute, textDecorationLine: 'underline' },
  closeText: { ...sansW('600'), fontSize: 16, lineHeight: 25, color: colors.ink, textAlign: 'center', marginTop: 14 },
});
