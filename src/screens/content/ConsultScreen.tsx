import React, { useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { RouteProp, useNavigation, useRoute } from '@/navigation/compat';
import { NativeStackNavigationProp } from '@/navigation/compat';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import TextField from '../../components/TextField';
import PrimaryButton from '../../components/PrimaryButton';
import PressableScale from '../../components/PressableScale';
import Disclaimer from '../../components/Disclaimer';
import FriendCompare from '../../components/FriendCompare';
import ShareCta, { ShareIconButton } from '../../components/ShareCta';
import { ActRow, BodyState, Coin, DarkChip, Hero, Para, SubHead, heroTxt } from '../../components/premium/Kit';
import BottomSheet from '../../components/BottomSheet';
import LoadingScreen from '../../components/LoadingScreen';
import { useApp } from '../../context/AppContext';
import { usePremium } from '../../context/PremiumContext';
import { RootStackParamList } from '../../navigation/types';
import { fmtP } from '../../services/premium/catalog';
import { CONSULT_CATS, CONSULT_CONFIG, ConsultCat, catOf, guessCat } from '../../services/content/consult';
import { HelpLine, consultApi, consultKeys } from '../../services/server/consultApi';
import { refreshPoints } from '../../context/PremiumContext';
import { queryClient } from '../../api/query';
import { ApiError } from '../../api/client';
import { consultSpec } from '../../services/share/shareSpecs';
import { colors } from '../../theme/colors';
import { fonts, radius, txt, sansW } from '../../theme/typography';

const EXAMPLES = [
  '헤어진 지 3개월, 아직도 연락할지 말지 매일 고민돼요',
  '회사가 너무 힘든데 지금 퇴사해도 괜찮을까요?',
  '썸 타는 사람이 있는데 먼저 고백해도 될까요?',
  '친한 친구에게 서운한 게 쌓였는데 말해야 할까요?',
];

/** 유료: 말 못 할 고민 상담 — 쓰기(목록) 화면과 답변 화면을 id로 나눈다 */
export default function ConsultScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'Consult'>>();
  return params?.id ? <Answer id={params.id} /> : <Compose />;
}

/** 위기 · 마음 건강 신호일 때: 운세보다 사람의 도움을 먼저 (탭하면 바로 전화) */
function HelpLines({ lines, crisis }: { lines: HelpLine[]; crisis?: boolean }) {
  return (
    <Card style={s.crisis}>
      <Text style={[txt.h3, { color: colors.love }]}>{crisis ? '지금 많이 힘드시죠' : '마음이 많이 지칠 땐'}</Text>
      <Para>{crisis
        ? '이런 마음은 운세보다 사람의 도움이 먼저 필요해요. 혼자 견디지 말고 지금 바로 이야기해 주세요. 24시간 언제든 연결돼요.'
        : '혼자 견디기 어려울 땐 전문가와 이야기해 보세요. 24시간 언제든 연결돼요.'}</Para>
      <View style={{ gap: 8, marginTop: 12 }}>
        {lines.map(l => (
          <PressableScale key={l.phone} onPress={() => Linking.openURL(`tel:${l.phone.replace(/-/g, '')}`)} style={s.line} scaleTo={0.98} accessibilityLabel={`${l.name} ${l.phone}에 전화하기`}>
            <Text style={{ fontSize: 14, color: colors.ink }}>{l.name}</Text><Text style={{ fontSize: 17, fontWeight: '800', color: colors.love }}>{l.phone}</Text>
          </PressableScale>
        ))}
      </View>
    </Card>
  );
}

const ASK_ERROR: Record<string, string> = {
  CONSULT_UNAVAILABLE: '상담을 잠시 쉬고 있어요. 조금 뒤에 다시 시도해 주세요',
  DUPLICATE_REQUEST: '이미 답변을 쓰고 있어요. 잠시만 기다려 주세요',
};

function Compose() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user: u, account, today } = useApp();
  const { points, toast, goWallet } = usePremium();
  const [cat, setCat] = useState<ConsultCat | null>(null);
  const [picked, setPicked] = useState(false);
  const [text, setText] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [asking, setAsking] = useState(false);
  const [crisis, setCrisis] = useState<HelpLine[] | null>(null);
  const history = useQuery({ queryKey: consultKeys.list, queryFn: consultApi.list, enabled: !!account });
  if (!u) return null;
  if (asking) return <LoadingScreen />;

  // 직접 고르지 않았으면 글에서 주제를 추측해 미리 골라 둔다
  const onText = (t: string) => { setText(t); setCrisis(null); if (!picked) setCat(guessCat(t)); };
  const len = text.trim().length;
  // 주제는 고르지 않아도 된다 (서버가 글에서 판단)
  const ok = len >= CONSULT_CONFIG.minLen;

  const start = () => {
    if (!ok) return;
    if (!account) { toast('로그인하면 상담받을 수 있어요'); router.push('/login'); return; }
    setConfirm(true);
  };
  // 포인트가 모자라도 서버에 보낸다: 위기 신호가 있으면 포인트와 상관없이 상담 전화를 안내받아야 한다
  const ask = async () => {
    setConfirm(false); setAsking(true);
    try {
      const v = await consultApi.ask(text.trim(), cat ?? undefined);
      if (v.status === 'crisis' || v.id == null) { setCrisis(v.helpLines ?? []); return; }
      queryClient.setQueryData(consultKeys.one(v.id), v);
      queryClient.invalidateQueries({ queryKey: consultKeys.list });
      refreshPoints();
      setText('');
      nav.push('Consult', { id: String(v.id) });
    } catch (e) {
      if (e instanceof ApiError && e.code === 'INSUFFICIENT_POINTS') {
        toast(`상담에는 ${CONSULT_CONFIG.cost}P가 필요해요. 충전 후 다시 시도해 주세요`);
        goWallet?.();
      } else {
        toast((e instanceof ApiError && ASK_ERROR[e.code]) || '답변을 만들지 못했어요. 포인트는 쓰이지 않았어요');
      }
    } finally {
      setAsking(false);
    }
  };

  return (
    <Screen title="말 못 할 고민 상담" back>
      <Hero>
        <Text style={heroTxt.eyebrow}>나만 볼 수 있어요 · 1년 뒤 자동 삭제</Text>
        <Text style={[heroTxt.summ, { fontSize: 21, lineHeight: 30 }]}>누구에게도 못 한 고민,{'\n'}사주에게 털어놓으세요</Text>
        <Text style={{ fontSize: 13, lineHeight: 20, color: 'rgba(255,255,255,0.72)', marginTop: 8 }}>내 사주 · 이번 달 기운 · 앞으로 3개월 흐름 · MBTI로 지금 나에게 맞는 답을 드려요.</Text>
      </Hero>

      <SubHead title="어떤 고민인가요?" caption="고르지 않으면 글을 보고 알아서 정해요" />
      <View style={s.chips}>
        {CONSULT_CATS.map(c => {
          const on = cat === c.key;
          return (
            <PressableScale key={c.key} onPress={() => { setCat(c.key); setPicked(true); }} style={[s.chip, on && s.chipOn]} scaleTo={0.95} accessibilityState={{ selected: on }}>
              <Text style={[s.chipH, on && { color: colors.moon }]}>{c.hanja}</Text>
              <Text style={[s.chipT, on && { color: colors.white }]}>{c.label}</Text>
            </PressableScale>
          );
        })}
      </View>

      <SubHead title="고민을 적어 주세요" caption={`${CONSULT_CONFIG.minLen}~${CONSULT_CONFIG.maxLen}자 · 구체적일수록 답이 정확해져요`} />
      <TextField
        value={text} onChangeText={onText} multiline maxLength={CONSULT_CONFIG.maxLen}
        placeholder={`예) ${EXAMPLES[new Date(today).getDate() % EXAMPLES.length]}`}
        style={{ height: 140, fontSize: 15, lineHeight: 22 }}
        accessibilityLabel="고민 내용"
      />
      <View style={s.between}>
        <Text style={txt.caption}>{!picked && cat ? `'${catOf(cat).label}' 고민으로 골랐어요 · 위에서 바꿀 수 있어요` : ' '}</Text>
        <Text style={[txt.caption, len >= CONSULT_CONFIG.maxLen && { color: colors.danger }]}>{len}/{CONSULT_CONFIG.maxLen}</Text>
      </View>

      {crisis ? <HelpLines lines={crisis} crisis /> : null}

      <PrimaryButton label={`${CONSULT_CONFIG.cost}P로 상담받기`} icon={<Coin size={18} />} onPress={start} disabled={!ok} style={{ marginTop: 16 }} />
      <Text style={[txt.caption, { textAlign: 'center', marginTop: 8 }]}>{account ? `보유 ${fmtP(points)} · ` : ''}공유 카드에는 고민 내용이 절대 들어가지 않아요</Text>

      {history.data?.length ? (
        <>
          <SubHead title="지난 상담" />
          <Card style={{ paddingVertical: 2, paddingHorizontal: 16 }}>
            {history.data.map((e, i) => (
              <PressableScale key={e.id} onPress={() => nav.push('Consult', { id: String(e.id) })} style={[s.hist, i > 0 && s.histLine]} scaleTo={0.98}>
                <Text style={s.histH}>{catOf(e.topic).hanja}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.ink }} numberOfLines={1}>{e.answer?.headline ?? catOf(e.topic).label}</Text>
                  <Text style={txt.caption}>{catOf(e.topic).label} · {kstDate(e.createdAt)}</Text>
                </View>
              </PressableScale>
            ))}
          </Card>
        </>
      ) : null}
      <Disclaimer compact />

      <BottomSheet visible={confirm} onClose={() => setConfirm(false)}>
        <Text style={[txt.caption, { textAlign: 'center' }]}>고민 상담</Text>
        <Text style={[txt.h2, { textAlign: 'center', marginTop: 6 }]}>{CONSULT_CONFIG.cost}P로 상담받을까요?</Text>
        <Text style={[txt.small, { textAlign: 'center', marginTop: 8 }]}>답변을 만드는 데 10~20초 걸려요.{'\n'}답변이 만들어진 뒤에만 포인트가 쓰여요.</Text>
        <PrimaryButton label="상담받기" onPress={ask} style={{ marginTop: 20 }} />
        <PrimaryButton label="취소" variant="soft" onPress={() => setConfirm(false)} style={{ marginTop: 8 }} />
      </BottomSheet>
    </Screen>
  );
}

const kstDate = (iso: string | null) => (iso ? new Date(Date.parse(iso) + 9 * 3600_000).toISOString().slice(0, 10).replace(/-/g, '.') : '');

function Answer({ id }: { id: string }) {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user: u } = useApp();
  const { toast } = usePremium();
  const [showQ, setShowQ] = useState(false);
  const [del, setDel] = useState(false);
  const q = useQuery({ queryKey: consultKeys.one(Number(id)), queryFn: () => consultApi.get(Number(id)) });
  if (!u) return null;
  if (q.isPending) return <LoadingScreen />;
  const e = q.data;
  if (!e?.answer || !e.facts) {
    return <Screen title="고민 상담" back><BodyState error onRetry={q.isError ? () => q.refetch() : undefined} /></Screen>;
  }
  const A = e.answer, F = e.facts; const C = catOf(e.topic);
  const spec = consultSpec(u, { ...e, answer: A, facts: F });
  const mx = Math.max(...F.flow.map(f => f.score));
  const remove = async () => {
    setDel(false);
    try {
      await consultApi.remove(e.id!);
      queryClient.removeQueries({ queryKey: consultKeys.one(e.id!) });
      queryClient.invalidateQueries({ queryKey: consultKeys.list });
      toast('상담 기록을 지웠어요');
      nav.goBack();
    } catch {
      toast('지우지 못했어요. 잠시 후 다시 시도해 주세요');
    }
  };

  return (
    <Screen title="고민 상담" back right={<ShareIconButton spec={spec} />}>
      <FriendCompare route="Consult" spec={spec} />
      {e.question ? (
        <PressableScale onPress={() => setShowQ(!showQ)} style={s.q} scaleTo={0.99}>
          <Text style={txt.caption}>나의 고민 · {C.label} · 나만 볼 수 있어요</Text>
          <Text style={[txt.body, { fontSize: 14, marginTop: 4 }]} numberOfLines={showQ ? undefined : 2}>{e.question}</Text>
        </PressableScale>
      ) : null}

      <Hero>
        <Text style={heroTxt.eyebrow}>{C.hanja} {C.label} 고민에 대한 답</Text>
        <Text style={[heroTxt.summ, { fontSize: 20, lineHeight: 29 }]}>{A.headline}</Text>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 14 }}>
          <DarkChip gold>{F.modeLabel}</DarkChip>
          <DarkChip>풀리는 달 {F.bestMonth}</DarkChip>
        </View>
      </Hero>

      <Card style={s.direct}>
        <Text style={s.directK}>결론부터</Text>
        <Text style={s.directV}>{A.direct}</Text>
      </Card>

      <SubHead title="01 · 마음 읽기" />
      <Card><Para mt={0}>{A.empathy}</Para></Card>

      <SubHead title="02 · 사주로 본 나" />
      <Card>
        <Para mt={0}>{A.me}</Para>
        <Para mt={10}>{A.star}</Para>
      </Card>

      <SubHead title="03 · 지금의 흐름" caption={`앞으로 3개월 · ${C.label} 운`} />
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

      <SubHead title="04 · 이렇게 해 보세요" />
      <Card style={{ gap: 10 }}>{A.dos.map(t => <ActRow key={t}>{t}</ActRow>)}</Card>

      <SubHead title="05 · 이것만은 피하세요" />
      <Card style={{ gap: 10 }}>{A.avoid.map(t => <ActRow key={t} ok={false}>{t}</ActRow>)}</Card>

      <SubHead title="06 · 행동하기 좋은 날" caption="앞으로 30일 중 이 고민에 힘이 실리는 날" />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {F.goodDays.map(d => <View key={d.iso} style={s.day}><Text style={{ fontSize: 14, fontWeight: '700', color: colors.love }}>{d.label}</Text></View>)}
      </View>

      <Card style={s.closing}>
        <Text style={s.idiom}>{F.idiom[1]}</Text>
        <Text style={[txt.caption, { textAlign: 'center' }]}>{F.idiom[0]} · {F.idiom[2]}</Text>
        <Text style={s.closeText}>{A.closing}</Text>
      </Card>

      {e.helpLines?.length ? <HelpLines lines={e.helpLines} /> : null}

      <ShareCta spec={spec} />
      <PrimaryButton label="다른 고민 상담하기" variant="soft" onPress={() => nav.navigate('Consult')} style={{ marginTop: 12 }} />
      <PressableScale onPress={() => setDel(true)} hitSlop={8} style={{ alignSelf: 'center', marginTop: 16 }}>
        <Text style={s.delete}>이 상담 기록 지우기</Text>
      </PressableScale>
      <Text style={[txt.caption, { textAlign: 'center', marginTop: 12 }]}>재미와 참고를 위한 상담이에요. {e.expiresAt ? `${kstDate(e.expiresAt)}에 자동으로 지워져요.` : ''}</Text>

      <BottomSheet visible={del} onClose={() => setDel(false)}>
        <Text style={[txt.h2, { textAlign: 'center' }]}>상담 기록을 지울까요?</Text>
        <Text style={[txt.small, { textAlign: 'center', marginTop: 8 }]}>고민 글과 답변이 바로 지워지고 되돌릴 수 없어요.</Text>
        <PrimaryButton label="지우기" onPress={remove} style={{ marginTop: 20 }} />
        <PrimaryButton label="취소" variant="soft" onPress={() => setDel(false)} style={{ marginTop: 8 }} />
      </BottomSheet>
    </Screen>
  );
}

const s = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { width: '23%', flexGrow: 1, alignItems: 'center', paddingVertical: 12, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  chipOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipH: { fontFamily: fonts.serif, fontSize: 20, fontWeight: '700', color: colors.purple },
  chipT: { fontSize: 12, fontWeight: '600', color: colors.inkSub, marginTop: 2 },
  between: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  crisis: { marginTop: 16, borderWidth: 1.5, borderColor: colors.love },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: radius.md, backgroundColor: colors.loveBg },
  hist: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  histLine: { borderTopWidth: 1, borderTopColor: colors.line },
  histH: { fontFamily: fonts.serif, fontSize: 22, fontWeight: '700', color: colors.seal, width: 28, textAlign: 'center' },
  direct: { marginTop: 12, borderLeftWidth: 3, borderLeftColor: colors.seal },
  directK: { fontSize: 12, fontWeight: '800', color: colors.seal, letterSpacing: 1 },
  directV: { ...sansW('600'), fontSize: 16.5, lineHeight: 25, color: colors.ink, marginTop: 6 },
  q: { padding: 14, borderRadius: radius.lg, backgroundColor: colors.lavenderSoft, marginBottom: 12 },
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
