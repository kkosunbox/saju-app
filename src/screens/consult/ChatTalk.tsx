import React, { useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, View, type ScrollViewInstance, type TextInputInstance } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp, useNavigation } from '@/navigation/compat';
import Screen, { useKeyboardShown } from '../../components/Screen';
import PrimaryButton from '../../components/PrimaryButton';
import PressableScale from '../../components/PressableScale';
import Icon from '../../components/Icon';
import BottomSheet from '../../components/BottomSheet';
import { LockCard } from '../../components/premium/Kit';
import { PointPill } from '../../components/HeaderPoints';
import { Stream, StreamBlock, StreamText } from '../../components/Stream';
import { useApp } from '../../context/AppContext';
import { refreshPoints, usePremium } from '../../context/PremiumContext';
import { RootStackParamList } from '../../navigation/types';
import { CHAT_CONFIG } from '../../services/content/consult';
import { goLogin } from '../../services/loginIntent';
import { trackAction } from '../../services/screenViews';
import { ConsultTurn, ConsultView, consultApi, consultKeys, nextChatCost, useConsultStatus } from '../../services/server/consultApi';
import { queryClient } from '../../api/query';
import { ApiError } from '../../api/client';
import { colors, isDark } from '../../theme/colors';
import { radius, sansW, SCREEN_PX, shadow, txt } from '../../theme/typography';
import { ChatHeaderLeft } from './ChatMenu';
import { useChatCostConfirm } from './ChatCostSheet';
import { Counselor, MyBubble, REPORT_REC, ReplyBubble, STAGES, WEB_ONE_ROW, kstDate, useWebAutoGrow, webEnterToSend } from './parts';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const INPUT_MAX = 110;
const SEND_ARROW = require('../../../assets/figma/consult/send-arrow.svg');

const SEND_ERROR: Record<string, string> = {
  CONSULT_UNAVAILABLE: '답을 만들지 못했어요. 알은 쓰이지 않았어요. 다시 말해 주세요',
  DUPLICATE_REQUEST: '아직 답을 쓰고 있어요. 잠시만 기다려 주세요',
  CONSULT_CLOSED: '이 대화는 여기까지예요. 새 대화로 이야기해 주세요',
};

/** 운알이의 답 — 빈 줄로 나눈 말은 말풍선을 나눠 차례로 보여 준다 */
export function ReplyLines({ turn }: { turn: ConsultTurn }) {
  const lines = turn.reply.split(/\n\s*\n/).map(t => t.trim()).filter(Boolean);
  return (
    <Counselor at={turn.createdAt}>
      {lines.map((line, i) => <StreamText key={i} style={s.replyText}>{line}</StreamText>)}
    </Counselor>
  );
}

/** 대화를 시작한 화면 → 그 화면으로 (모르는 콘텐츠면 null) */
function sourceRoute(source: NonNullable<ConsultView['source']>): [string, object?] | null {
  if (source.type === 'daily_fortune') return ['Today'];
  // 타로는 그 주제의 결과로 (key = love:3r → love)
  if (source.type === 'tarot') return ['AnalysisDetail', { source: 'tarot', ...(source.key ? { topic: source.key.split(':')[0] } : {}) }];
  const key = source.key ?? '';
  const [kind, arg] = key.split(':');
  if (key === 'life') return ['Life'];
  if (key === 'saju') return ['SajuDeep'];
  if (key === 'spouse') return ['Spouse'];
  if (kind === 'theme' && arg) return ['Theme', { kind: arg }];
  if (kind === 'monthly' && arg) {
    const [y, m] = arg.split('-').map(Number);
    return y && m ? ['Monthly', { y, m }] : ['Monthly'];
  }
  if (kind === 'newyear') return ['NewYear', arg ? { year: Number(arg) } : undefined];
  if (kind === 'lucky') return ['Lucky'];
  if (kind === 'child') return ['Child'];
  if (kind === 'pet') return ['Pet'];
  return null;
}

/** 대화 맨 위 — 어느 화면에서 이어진 대화인지. 누르면 그 화면으로 */
export function SourceBanner({ source }: { source: NonNullable<ConsultView['source']> }) {
  const nav = useNavigation<Nav>();
  const route = sourceRoute(source);
  const body = (
    <>
      <View style={s.sourceIcon}><Icon name={source.type === 'daily_fortune' ? 'calendar' : source.type === 'tarot' ? 'sparkle' : 'grid'} size={16} color={colors.accent} strokeWidth={2} /></View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={s.sourceK}>이 화면에서 이어진 대화예요</Text>
        <Text style={s.sourceT} numberOfLines={1}>{source.title}</Text>
      </View>
      {route ? <Text style={s.sourceGo}>보러 가기 →</Text> : null}
    </>
  );
  if (!route) return <View style={s.source}>{body}</View>;
  return (
    <PressableScale onPress={() => { trackAction('chat_source_open'); nav.navigate(route[0] as never, route[1] as never); }} style={s.source} scaleTo={0.98} accessibilityLabel={`${source.title} 보러 가기`}>
      {body}
    </PressableScale>
  );
}

/** 대화 중 어울리는 리포트가 있을 때 운알이가 건네는 추가 말풍선 (문구 고정) */
export function SuggestBubble({ report }: { report: string }) {
  const nav = useNavigation<Nav>();
  const rec = REPORT_REC[report];
  if (!rec) return null;
  return (
    <Counselor>
      <StreamText style={s.replyText}>이 얘기라면 이것도 같이 보면 좋아요.</StreamText>
      <StreamBlock>
        <LockCard
          mt={0} title={rec.title} desc={rec.desc} item={rec.item}
          onPress={() => { trackAction(`chat_suggest_${rec.key}`); nav.navigate(rec.to[0] as never, rec.to[1] as never); }}
        />
      </StreamBlock>
    </Counselor>
  );
}

/**
 * 운알톡 대화 — 운알이와 가볍게 주고받는다. 무료 메시지를 다 쓰면 입력창 위 한 줄로 한 마디 값을 알려 주고,
 * 그다음부터 보내는 메시지마다 알이 쓰인다 (답이 만들어진 뒤에만). 게스트는 무료 메시지까지만 이어서 보낸다.
 */
export default function ChatTalk({ chat, fresh }: { chat: ConsultView; fresh: boolean }) {
  const nav = useNavigation<Nav>();
  const id = chat.id;
  const { account } = useApp();
  const { toast, goWallet } = usePremium();
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboardShown();
  const scroll = useRef<ScrollViewInstance>(null);
  const inputRef = useRef<TextInputInstance>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState<string | null>(null);
  const [del, setDel] = useState(false);
  const status = useConsultStatus(true);
  const { confirm: confirmCost, sheet: costSheet } = useChatCostConfirm();
  const turns = chat.turns ?? [];
  // 이 화면에서 새로 받은 답만 써지는 것처럼 — 방금 시작한 대화면 첫 답부터
  const [seen] = useState(() => (fresh ? Math.max(0, turns.length - 1) : turns.length));
  useWebAutoGrow(inputRef, input, INPUT_MAX);
  useEffect(() => { if (turns.length || sending) setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 80); }, [turns.length, sending]);

  const cost = account ? nextChatCost(status.data?.chat, chat) : 0;
  const open = chat.followUpsLeft > 0;
  // 게스트는 알을 쓸 수 없다 — 무료 메시지를 다 쓰면 로그인하고 이어서
  const guestOut = !account && (chat.freeTurnsLeft ?? 0) <= 0;

  const put = (v: ConsultView) => {
    queryClient.setQueryData(consultKeys.one(id), v);
    queryClient.invalidateQueries({ queryKey: consultKeys.list });
  };
  const login = () => {
    trackAction('chat_login_required');
    goLogin({ kind: 'unlock', title: '운알톡', returnTo: `/consult/${id}` });
  };

  const send = (raw: string) => {
    const message = raw.trim();
    if (!message || sending) return;
    if (guestOut) { login(); return; }
    // 알이 드는 말이면 보내기 전에 한 번 묻는다 (다시 보지 않기를 고르면 바로)
    confirmCost(cost, () => { void post(message); });
  };

  const post = async (message: string) => {
    setSending(message); setInput('');
    try {
      const v = await consultApi.followUp(id, message);
      put(v);
      if (v.charged) refreshPoints();
    } catch (err) {
      const code = err instanceof ApiError ? err.code : '';
      setInput(message); // 다시 보낼 수 있게 되돌려 둔다
      if (code === 'INSUFFICIENT_POINTS') { toast(`한 마디에 ${cost || CHAT_CONFIG.cost}알이 들어요. 충전 후 다시 보내 주세요`); goWallet?.(); }
      else if (code === 'MEMBER_ONLY') login();
      else {
        if (code === 'CONSULT_CLOSED') queryClient.invalidateQueries({ queryKey: consultKeys.one(id) });
        toast(SEND_ERROR[code] ?? SEND_ERROR.CONSULT_UNAVAILABLE);
      }
    } finally {
      setSending(null);
    }
  };

  const remove = async () => {
    setDel(false);
    try {
      await consultApi.remove(id);
      queryClient.removeQueries({ queryKey: consultKeys.one(id) });
      queryClient.invalidateQueries({ queryKey: consultKeys.list });
      toast('대화 기록을 지웠어요');
      nav.goBack();
    } catch {
      toast('지우지 못했어요. 잠시 후 다시 시도해 주세요');
    }
  };

  // 알이 드는지는 보낼 때 시트로 묻는다 — 여기서는 게스트가 이어 갈 수 없을 때만 알려 준다
  const hint = guestOut ? '로그인하면 이어서 이야기할 수 있어요' : '';
  const footer = open ? (
    <>
      {hint ? <Text style={s.footCap}>{hint}</Text> : null}
      <View style={s.inputRow}>
        <TextInput
          ref={inputRef} value={input} onChangeText={setInput} multiline maxLength={status.data?.chat?.maxLength ?? CHAT_CONFIG.maxLen} {...WEB_ONE_ROW} {...webEnterToSend(() => send(input))}
          placeholder="운알이에게 말해 보세요" placeholderTextColor={isDark ? colors.inkMute : '#999999'}
          style={[s.input, Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)]} editable={!sending} accessibilityLabel="운알이에게 보낼 말"
        />
        <PressableScale onPress={() => send(input)} disabled={!input.trim() || !!sending} style={[s.sendBtn, !!sending && { opacity: 0.4 }]} scaleTo={0.9} accessibilityLabel={cost > 0 ? `${cost}알로 보내기` : '보내기'}>
          <Image source={SEND_ARROW} style={s.sendArrow} contentFit="contain" />
        </PressableScale>
      </View>
    </>
  ) : (
    <>
      <Text style={[txt.caption, { textAlign: 'center', marginBottom: 8 }]}>이 대화는 여기까지예요</Text>
      <PrimaryButton label="새 대화 시작하기" variant="soft" onPress={() => nav.navigate('Consult')} />
    </>
  );

  return (
    <Screen left={<ChatHeaderLeft current={id} />} sky scroll={false} right={<PointPill attendHint quiet />}>
      <ScrollView ref={scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={[txt.caption, { textAlign: 'center' }]}>{kstDate(chat.createdAt)} · 나만 볼 수 있어요</Text>
        {chat.source?.title ? <SourceBanner source={chat.source} /> : null}

        {turns.map((t, i) => (
          <View key={t.createdAt}>
            <MyBubble at={t.createdAt}>{t.question}</MyBubble>
            {/* 방금 받은 답만 써진다 */}
            <Stream active={i >= seen}>
              <ReplyLines turn={t} />
              {t.suggest && chat.risk === 'none' ? <SuggestBubble report={t.suggest} /> : null}
            </Stream>
          </View>
        ))}
        {sending ? (
          <>
            <MyBubble>{sending}</MyBubble>
            <ReplyBubble typing={STAGES.chat} />
          </>
        ) : null}

        {/* 게스트는 지울 수 없다 (서버가 회원만 허용) — 오래 안 쓰면 게스트 정리 때 함께 지워진다 */}
        {account ? (
          <PressableScale onPress={() => setDel(true)} hitSlop={8} style={{ alignSelf: 'center', marginTop: 24 }}>
            <Text style={s.delete}>이 대화 기록 지우기</Text>
          </PressableScale>
        ) : null}
        <Text style={[txt.caption, { textAlign: 'center', marginTop: 12 }]}>참고를 위한 대화예요.</Text>
      </ScrollView>
      {/* 키보드가 떠 있으면 홈 인디케이터 여백 없이 키보드 바로 위에 붙인다 */}
      <View style={[s.footer, { paddingBottom: keyboard ? 10 : Math.max(insets.bottom, 10) }]}>{footer}</View>

      <BottomSheet visible={del} onClose={() => setDel(false)}>
        <Text style={[txt.h2, { textAlign: 'center' }]}>대화 기록을 지울까요?</Text>
        <Text style={[txt.small, { textAlign: 'center', marginTop: 8 }]}>나눈 대화가 바로 지워지고 되돌릴 수 없어요.</Text>
        <PrimaryButton label="지우기" onPress={remove} style={{ marginTop: 20 }} />
        <PrimaryButton label="취소" variant="soft" onPress={() => setDel(false)} style={{ marginTop: 8 }} />
      </BottomSheet>
      {costSheet}
    </Screen>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: SCREEN_PX, paddingBottom: 24 },
  source: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, paddingHorizontal: 14, paddingVertical: 12, borderRadius: radius.lg, backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent },
  sourceIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  sourceK: { fontSize: 11, color: colors.inkSub, letterSpacing: -0.3 },
  sourceT: { fontSize: 14, fontWeight: '700', color: colors.ink, letterSpacing: -0.5 },
  sourceGo: { fontSize: 13, fontWeight: '700', color: colors.accent, letterSpacing: -0.4 },
  replyText: { ...sansW('400'), fontSize: 14, lineHeight: 24, color: colors.ink, letterSpacing: -0.7, marginRight: 5 },
  footer: { paddingHorizontal: SCREEN_PX, paddingTop: 11, backgroundColor: colors.cream, ...shadow.float, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderColor: isDark ? colors.line : '#EDEDED' },
  footCap: { ...sansW('600'), fontSize: 11, lineHeight: 17, letterSpacing: -0.44, color: colors.inkMute, textAlign: 'center', marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingVertical: 4, paddingRight: 12, paddingLeft: 14, borderRadius: radius.sm, backgroundColor: colors.card },
  input: { flex: 1, maxHeight: INPUT_MAX, paddingTop: 7, paddingBottom: 7, ...sansW('500'), fontSize: 13, lineHeight: 18, color: colors.ink, letterSpacing: -0.65 },
  sendBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
  sendArrow: { width: 24, height: 24, transform: [{ rotate: '-90deg' }] },
  delete: { fontSize: 13, fontWeight: '600', color: colors.inkMute, textDecorationLine: 'underline' },
});
