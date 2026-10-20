import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { NativeStackNavigationProp, useNavigation } from '@/navigation/compat';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import TextField from '../../components/TextField';
import PrimaryButton from '../../components/PrimaryButton';
import PressableScale from '../../components/PressableScale';
import Disclaimer from '../../components/Disclaimer';
import BottomSheet from '../../components/BottomSheet';
import LoadingScreen from '../../components/LoadingScreen';
import { Coin, SubHead } from '../../components/premium/Kit';
import { useApp } from '../../context/AppContext';
import { refreshPoints, usePremium } from '../../context/PremiumContext';
import { RootStackParamList } from '../../navigation/types';
import { fmtP } from '../../services/premium/catalog';
import { CONSULT_CATS, CONSULT_CONFIG, ConsultCat, catOf, guessCat } from '../../services/content/consult';
import { ConsultView, HelpLine, consultApi, consultKeys, useConsultStatus } from '../../services/server/consultApi';
import { queryClient } from '../../api/query';
import { ApiError } from '../../api/client';
import { colors } from '../../theme/colors';
import { fonts, radius, txt } from '../../theme/typography';
import { HelpLines, kstDate } from './parts';

const EXAMPLES = [
  '헤어진 지 3개월, 아직도 연락할지 말지 매일 고민돼요',
  '회사가 너무 힘든데 지금 퇴사해도 괜찮을까요?',
  '썸 타는 사람이 있는데 먼저 고백해도 될까요?',
  '친한 친구에게 서운한 게 쌓였는데 말해야 할까요?',
  '부모님과 자꾸 부딪히는데 어떻게 해야 할까요?',
  '모아 둔 돈으로 이사를 할지 더 모을지 고민이에요',
];

const ASK_ERROR: Record<string, string> = {
  CONSULT_UNAVAILABLE: '상담을 잠시 쉬고 있어요. 조금 뒤에 다시 시도해 주세요',
  DUPLICATE_REQUEST: '이미 답변을 쓰고 있어요. 잠시만 기다려 주세요',
};

/** 상담 탭 — 고민을 털어놓고(하루 1번 무료 미리보기), 지난 상담으로 돌아가 이어서 묻는다 */
export default function ConsultHomeScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user: u, account, fortune } = useApp();
  const { points, toast, goWallet } = usePremium();
  const [cat, setCat] = useState<ConsultCat | null>(null);
  const [picked, setPicked] = useState(false);
  const [text, setText] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [asking, setAsking] = useState(false);
  const [crisis, setCrisis] = useState<HelpLine[] | null>(null);
  const status = useConsultStatus(!!account);
  const history = useQuery({ queryKey: consultKeys.list, queryFn: consultApi.list, enabled: !!account });
  if (!u) return null;
  if (asking) return <LoadingScreen />;

  const cost = status.data?.cost ?? CONSULT_CONFIG.cost;
  const maxLen = status.data?.maxLength ?? CONSULT_CONFIG.maxLen;
  const limit = status.data?.followUpLimit ?? 10;
  const hours = status.data?.followUpHours ?? 24;
  // 로그인 전에도 '무료'로 보여 준다 (가입하면 바로 쓸 수 있다)
  const free = !account || status.data?.freeToday !== false;

  // 직접 고르지 않았으면 글에서 주제를 추측해 미리 골라 둔다
  const onText = (t: string) => { setText(t); setCrisis(null); if (!picked) setCat(guessCat(t)); };
  const len = text.trim().length;
  const ok = len >= CONSULT_CONFIG.minLen;

  const start = () => {
    if (!ok) return;
    if (!account) { toast('로그인하면 상담받을 수 있어요'); router.push('/login'); return; }
    if (free) ask();
    else setConfirm(true);
  };
  // 포인트가 모자라도 서버에 보낸다: 위기 신호가 있으면 포인트와 상관없이 상담 전화를 안내받아야 한다
  const ask = async () => {
    setConfirm(false); setAsking(true);
    try {
      const v = await consultApi.ask(text.trim(), cat ?? undefined);
      if (v.status === 'crisis' || v.id == null) { setCrisis(v.helpLines ?? []); return; }
      queryClient.setQueryData(consultKeys.one(v.id), v);
      queryClient.invalidateQueries({ queryKey: consultKeys.list });
      queryClient.invalidateQueries({ queryKey: consultKeys.status });
      if (v.charged) refreshPoints();
      setText(''); setCat(null); setPicked(false);
      nav.push('ConsultChat', { id: String(v.id) });
    } catch (e) {
      if (e instanceof ApiError && e.code === 'INSUFFICIENT_POINTS') {
        toast(`상담에는 ${cost}P가 필요해요. 충전 후 다시 시도해 주세요`);
        goWallet?.();
      } else {
        toast((e instanceof ApiError && ASK_ERROR[e.code]) || '답변을 만들지 못했어요. 포인트는 쓰이지 않았어요');
      }
    } finally {
      setAsking(false);
    }
  };

  const rows = history.data ?? [];
  const open = rows.filter(e => e.locked || e.followUpsLeft > 0);
  const past = rows.filter(e => !e.locked && e.followUpsLeft <= 0);
  const openChat = (e: ConsultView) => nav.push('ConsultChat', { id: String(e.id) });

  return (
    <Screen largeTitle="상담" subtitle="누구에게도 못 한 고민, 사주에게 털어놓으세요">
      {fortune ? (
        <View style={s.today}>
          <Text style={s.todayK}>오늘 {u.nickname}님의 기운</Text>
          <Text style={[txt.small, { color: colors.ink }]} numberOfLines={2}>{fortune.combined.summary}</Text>
        </View>
      ) : null}

      <Card style={{ marginTop: 12 }}>
        <TextField
          value={text} onChangeText={onText} multiline maxLength={maxLen}
          placeholder="지금 마음에 걸리는 일을 편하게 적어 주세요"
          style={{ height: 132, fontSize: 15, lineHeight: 22 }}
          accessibilityLabel="고민 내용"
        />
        <View style={s.between}>
          <Text style={txt.caption}>{cat ? `${catOf(cat).label} 고민${picked ? '' : '으로 골랐어요'}` : '구체적일수록 답이 정확해져요'}</Text>
          <Text style={[txt.caption, len >= maxLen && { color: colors.danger }]}>{len}/{maxLen}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10, marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}>
          {CONSULT_CATS.map(c => {
            const on = cat === c.key;
            return (
              <PressableScale key={c.key} onPress={() => { setCat(on ? null : c.key); setPicked(!on); }} style={[s.chip, on && s.chipOn]} scaleTo={0.95} accessibilityState={{ selected: on }} accessibilityLabel={`${c.label} 고민`}>
                <Text style={[s.chipH, on && { color: colors.moon }]}>{c.hanja}</Text>
                <Text style={[s.chipT, on && { color: colors.white }]}>{c.label}</Text>
              </PressableScale>
            );
          })}
        </ScrollView>
      </Card>

      {crisis ? <HelpLines lines={crisis} crisis /> : null}

      <PrimaryButton
        label={free ? '무료로 상담받기' : `${cost}P로 상담받기`}
        icon={free ? undefined : <Coin size={18} />}
        onPress={start} disabled={!ok} style={{ marginTop: 16 }}
      />
      <Text style={[txt.caption, { textAlign: 'center', marginTop: 8, lineHeight: 18 }]}>
        {free
          ? `오늘 1번 무료 · 결론을 먼저 보고, ${cost}P로 열면 ${hours}시간 동안 ${limit}번 더 물어볼 수 있어요`
          : `${account ? `보유 ${fmtP(points)} · ` : ''}${hours}시간 동안 ${limit}번 이어서 물어볼 수 있어요`}
      </Text>

      {!text ? (
        <>
          <SubHead title="이런 고민도 괜찮아요" caption="눌러서 바로 적어 보세요" />
          <View style={{ gap: 8 }}>
            {EXAMPLES.map(ex => (
              <PressableScale key={ex} onPress={() => onText(ex)} style={s.example} scaleTo={0.98} accessibilityLabel={`예시 고민: ${ex}`}>
                <Text style={{ fontSize: 14, color: colors.inkSub }}>{ex}</Text>
              </PressableScale>
            ))}
          </View>
        </>
      ) : null}

      {open.length ? <History title="이어서 이야기하기" rows={open} onOpen={openChat} /> : null}
      {past.length ? <History title="지난 상담" rows={past} onOpen={openChat} /> : null}

      <Text style={[txt.caption, { textAlign: 'center', marginTop: 24 }]}>나만 볼 수 있어요 · 공유 카드에는 고민 내용이 절대 들어가지 않아요 · 1년 뒤 자동 삭제</Text>
      <Disclaimer compact />

      <BottomSheet visible={confirm} onClose={() => setConfirm(false)}>
        <Text style={[txt.caption, { textAlign: 'center' }]}>고민 상담</Text>
        <Text style={[txt.h2, { textAlign: 'center', marginTop: 6 }]}>{cost}P로 상담받을까요?</Text>
        <Text style={[txt.small, { textAlign: 'center', marginTop: 8 }]}>오늘 무료 상담은 이미 썼어요.{'\n'}답을 받은 뒤 {hours}시간 동안 {limit}번 더 물어볼 수 있어요.{'\n'}답변이 만들어진 뒤에만 포인트가 쓰여요.</Text>
        <PrimaryButton label="상담받기" onPress={ask} style={{ marginTop: 20 }} />
        <PrimaryButton label="취소" variant="soft" onPress={() => setConfirm(false)} style={{ marginTop: 8 }} />
      </BottomSheet>
    </Screen>
  );
}

function History({ title, rows, onOpen }: { title: string; rows: ConsultView[]; onOpen(e: ConsultView): void }) {
  return (
    <>
      <SubHead title={title} />
      <Card style={{ paddingVertical: 2, paddingHorizontal: 16 }}>
        {rows.map((e, i) => {
          const C = catOf(e.topic);
          const badge = e.locked ? '미리보기' : e.followUpsLeft > 0 ? `${e.followUpsLeft}번 더 물어볼 수 있어요` : '';
          return (
            <PressableScale key={e.id} onPress={() => onOpen(e)} style={[s.hist, i > 0 && s.histLine]} scaleTo={0.98} accessibilityLabel={e.answer?.headline ?? C.label}>
              <Text style={s.histH}>{C.hanja}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.ink }} numberOfLines={1}>{e.answer?.headline ?? C.label}</Text>
                <Text style={txt.caption}>{C.label} · {kstDate(e.createdAt)}{badge ? ` · ${badge}` : ''}</Text>
              </View>
            </PressableScale>
          );
        })}
      </Card>
    </>
  );
}

const s = StyleSheet.create({
  today: { padding: 14, borderRadius: radius.lg, backgroundColor: colors.lavenderSoft, gap: 4 },
  todayK: { fontSize: 12, fontWeight: '800', color: colors.purple },
  between: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.line },
  chipOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipH: { fontFamily: fonts.serif, fontSize: 15, fontWeight: '700', color: colors.purple },
  chipT: { fontSize: 13, fontWeight: '600', color: colors.inkSub },
  example: { paddingHorizontal: 16, paddingVertical: 13, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  hist: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  histLine: { borderTopWidth: 1, borderTopColor: colors.line },
  histH: { fontFamily: fonts.serif, fontSize: 22, fontWeight: '700', color: colors.seal, width: 28, textAlign: 'center' },
});
