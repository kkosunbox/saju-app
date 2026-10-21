import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { NativeStackNavigationProp, useNavigation } from '@/navigation/compat';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Icon from '../../components/Icon';
import Mascot from '../../components/Mascot';
import GradientBorder from '../../components/GradientBorder';
import { PointPill } from '../../components/HeaderPoints';
import { LinearGradient } from 'expo-linear-gradient';
import TextField from '../../components/TextField';
import PrimaryButton from '../../components/PrimaryButton';
import PressableScale from '../../components/PressableScale';
import Disclaimer from '../../components/Disclaimer';
import BottomSheet from '../../components/BottomSheet';
import { Coin, SubHead } from '../../components/premium/Kit';
import { useApp } from '../../context/AppContext';
import { usePremium } from '../../context/PremiumContext';
import { RootStackParamList } from '../../navigation/types';
import { fmtP } from '../../services/premium/catalog';
import { CONSULT_CATS, CONSULT_CONFIG, ConsultCat, catOf, guessCat } from '../../services/content/consult';
import { ConsultView, HelpLine, consultApi, consultKeys, useConsultStatus } from '../../services/server/consultApi';
import { startAsk } from './pendingAsk';
import { colors, isDark } from '../../theme/colors';
import { fonts, radius, txt } from '../../theme/typography';
import { HelpLines, kstDate } from './parts';

const TODAY_BG = isDark ? (['#15202B', '#172636', '#1B3348'] as const) : (['#F7FCFF', '#EFF9FF', '#CBECFE'] as const);

const EXAMPLES = [
  '헤어진 지 3개월, 아직도 연락할지 말지 매일 고민돼요',
  '회사가 너무 힘든데 지금 퇴사해도 괜찮을까요?',
  '썸 타는 사람이 있는데 먼저 고백해도 될까요?',
  '친한 친구에게 서운한 게 쌓였는데 말해야 할까요?',
  '부모님과 자꾸 부딪히는데 어떻게 해야 할까요?',
  '모아 둔 돈으로 이사를 할지 더 모을지 고민이에요',
];

/** 상담 탭 — 고민을 털어놓고(하루 5번 무료 미리보기), 지난 상담으로 돌아가 이어서 묻는다 */
export default function ConsultHomeScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user: u, account, fortune } = useApp();
  const { points, toast } = usePremium();
  const [cat, setCat] = useState<ConsultCat | null>(null);
  const [picked, setPicked] = useState(false);
  const [text, setText] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [crisis, setCrisis] = useState<HelpLine[] | null>(null);
  const status = useConsultStatus(!!account);
  const history = useQuery({ queryKey: consultKeys.list, queryFn: consultApi.list, enabled: !!account });
  if (!u) return null;

  const cost = status.data?.cost ?? CONSULT_CONFIG.cost;
  const maxLen = status.data?.maxLength ?? CONSULT_CONFIG.maxLen;
  const limit = status.data?.followUpLimit ?? 10;
  const hours = status.data?.followUpHours ?? 24;
  // 로그인 전에도 '무료'로 보여 준다 (가입하면 바로 쓸 수 있다)
  const perDay = status.data?.freePerDay ?? 5;
  const freeLeft = account ? status.data?.freeLeft ?? perDay : perDay;
  const free = freeLeft > 0;

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
  // 포인트가 모자라도 서버에 보낸다: 위기 신호가 있으면 포인트와 상관없이 상담 전화를 안내받아야 한다.
  // 답은 대화 화면에서 기다린다 (내 고민이 먼저 보이고 상담가가 답을 쓰는 중)
  const ask = () => {
    setConfirm(false);
    const key = startAsk(text.trim(), cat ?? undefined);
    setText(''); setCat(null); setPicked(false); setCrisis(null);
    nav.push('ConsultChat', { id: 'new', ask: key });
  };

  const rows = history.data ?? [];
  const open = rows.filter(e => e.locked || e.followUpsLeft > 0);
  const past = rows.filter(e => !e.locked && e.followUpsLeft <= 0);
  const openChat = (e: ConsultView) => nav.push('ConsultChat', { id: String(e.id) });

  return (
    <Screen largeTitle="상담" right={<PointPill />}>
      {fortune ? (
        <LinearGradient colors={TODAY_BG} locations={[0, 0.63, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.today}>
          <Mascot size={46} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={s.todayK}>오늘 {u.nickname}님의 기운</Text>
            <Text style={s.todayV} numberOfLines={2}>{fortune.combined.summary}</Text>
          </View>
        </LinearGradient>
      ) : null}

      <GradientBorder outer={{ marginTop: 16 }}>
        <TextField
          value={text} onChangeText={onText} multiline maxLength={maxLen}
          placeholder="지금 마음에 걸리는 일을 편하게 적어주세요."
          containerStyle={s.inputBox}
          style={s.input}
          accessibilityLabel="고민 내용"
        />
      </GradientBorder>
      <View style={s.between}>
        <Text style={s.hint}>{cat ? `${catOf(cat).label} 고민${picked ? '' : '으로 골랐어요 · 다른 주제면 아래에서 골라 주세요'}` : '구체적일수록 답이 정확해져요'}</Text>
        <Text style={[s.hint, len >= maxLen && { color: colors.danger }]}>{len}/{maxLen}</Text>
      </View>
      <View style={s.chips}>
        {CONSULT_CATS.map(c => {
          const on = cat === c.key;
          return (
            <PressableScale key={c.key} onPress={() => { setCat(on ? null : c.key); setPicked(!on); }} style={[s.chip, on && s.chipOn]} scaleTo={0.95} accessibilityState={{ selected: on }} accessibilityLabel={`${c.label} 고민`}>
              {on ? <Icon name="check" size={14} color={colors.white} strokeWidth={2.6} /> : null}
              <Text style={[s.chipT, on && { color: colors.white, fontWeight: '700' }]}>{c.label}</Text>
            </PressableScale>
          );
        })}
      </View>

      {crisis ? <HelpLines lines={crisis} crisis /> : null}

      <PrimaryButton
        label={free ? '무료로 상담받기' : `${cost}알로 상담받기`}
        icon={free ? undefined : <Coin size={18} />}
        onPress={start} disabled={!ok} style={{ marginTop: 24 }}
      />
      <Text style={s.note}>
        {free
          ? `오늘 무료 ${freeLeft}번 남았어요 · 결론을 먼저 보고, ${cost}알로 열면\n${hours}시간 동안 ${limit}번 더 물어볼 수 있어요`
          : `${account ? `보유 ${fmtP(points)} · ` : ''}${hours}시간 동안 ${limit}번 이어서 물어볼 수 있어요`}
      </Text>

      {!text ? (
        <>
          <SubHead title="이런 고민도 괜찮아요" caption="눌러서 바로 확인해보세요" />
          <View style={{ gap: 12, alignItems: 'flex-start' }}>
            {EXAMPLES.map(ex => (
              <PressableScale key={ex} onPress={() => onText(ex)} style={s.example} scaleTo={0.98} accessibilityLabel={`예시 고민: ${ex}`}>
                <Text style={s.exampleT}>{ex}</Text>
              </PressableScale>
            ))}
          </View>
        </>
      ) : null}

      {open.length ? <History title="이어서 이야기하기" rows={open} onOpen={openChat} /> : null}
      {past.length ? <History title="지난 상담" rows={past} onOpen={openChat} /> : null}

      <Text style={[s.note, { marginTop: 24 }]}>나만 볼 수 있어요. 공유 카드에는 고민 내용이 절대 들어가지 않아요.{'\n'}1년 뒤 자동 삭제됩니다.</Text>
      <Disclaimer compact />

      <BottomSheet visible={confirm} onClose={() => setConfirm(false)}>
        <Text style={[txt.caption, { textAlign: 'center' }]}>고민 상담</Text>
        <Text style={[txt.h2, { textAlign: 'center', marginTop: 6 }]}>{cost}알로 상담받을까요?</Text>
        <Text style={[txt.small, { textAlign: 'center', marginTop: 8 }]}>오늘 무료 상담 {perDay}번을 다 썼어요.{'\n'}답을 받은 뒤 {hours}시간 동안 {limit}번 더 물어볼 수 있어요.{'\n'}답변이 만들어진 뒤에만 포인트가 쓰여요.</Text>
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
              <View style={s.histH}><Text style={s.histHT}>{C.hanja}</Text></View>
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
  today: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 72, paddingVertical: 12, paddingHorizontal: 16, borderRadius: radius.lg },
  todayK: { fontSize: 14, fontWeight: '700', color: colors.ink, letterSpacing: -0.5 },
  todayV: { fontSize: 13, lineHeight: 18, color: colors.ink, letterSpacing: -0.6 },
  inputBox: { borderWidth: 0, backgroundColor: 'transparent', paddingRight: 0 },
  input: { height: 125, paddingHorizontal: 16, paddingTop: 16, fontSize: 14, lineHeight: 20, fontWeight: '500' },
  between: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 8 },
  hint: { fontSize: 13, lineHeight: 18, color: colors.inkMute, letterSpacing: -0.6, flexShrink: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 32, paddingHorizontal: 16, borderRadius: radius.pill, backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.lineStrong },
  chipOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipT: { fontSize: 14, fontWeight: '500', color: colors.ink, letterSpacing: -0.5 },
  note: { fontSize: 12, lineHeight: 16, color: colors.inkMute, letterSpacing: -0.6, textAlign: 'center', marginTop: 12 },
  example: { height: 36, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 16, backgroundColor: colors.card },
  exampleT: { fontSize: 14, fontWeight: '500', color: colors.ink, letterSpacing: -0.5 },
  hist: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  histLine: { borderTopWidth: 1, borderTopColor: colors.line },
  histH: { width: 36, height: 36, borderRadius: 8, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  histHT: { fontFamily: fonts.serif, fontSize: 16, fontWeight: '700', color: colors.purpleSoft },
});
