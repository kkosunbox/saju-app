/**
 * 화면을 넘기지 않고 그 자리에서 운알이와 이어 말하기 (오늘의 운세 화면 아래 입력창).
 * 첫 말이 운알톡 대화를 열고(이 운세를 기억), 그다음 말은 같은 대화로 이어진다. 대화는 운알톡 기록에도 남는다.
 * 운세(프로필)마다 대화가 따로이고, 이 앱을 켜 둔 동안에는 다시 와도 이어서 보인다.
 */
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Stream } from '../../components/Stream';
import { useApp } from '../../context/AppContext';
import { refreshPoints, usePremium } from '../../context/PremiumContext';
import { queryClient } from '../../api/query';
import { ApiError } from '../../api/client';
import { goLogin } from '../../services/loginIntent';
import { trackAction } from '../../services/screenViews';
import { CHAT_CONFIG } from '../../services/content/consult';
import { ChatSource, ConsultView, consultApi, consultKeys, nextChatCost, useConsultStatus } from '../../services/server/consultApi';
import { txt } from '../../theme/typography';
import { ReplyLines, SuggestBubble } from './ChatTalk';
import { MyBubble, ReplyBubble, STAGES } from './parts';

/** 운세 id → 그 운세에서 이어 말한 대화 id (앱을 켜 둔 동안) */
const chatOfFortune = new Map<number, number>();

const SEND_ERROR: Record<string, string> = {
  CONSULT_UNAVAILABLE: '답을 만들지 못했어요. 알은 쓰이지 않았어요. 다시 말해 주세요',
  DUPLICATE_REQUEST: '아직 답을 쓰고 있어요. 잠시만 기다려 주세요',
};

/** key: 이어 말할 대상 (오늘의 운세 id). 바뀌면 그 대상의 대화로 바뀐다 */
export function useInlineChat(key: number | undefined) {
  const { account } = useApp();
  const { toast, goWallet } = usePremium();
  const status = useConsultStatus(true);
  const target = key ?? 0;
  const [state, setState] = useState(() => ({ target, chatId: chatOfFortune.get(target) ?? null }));
  // 프로필을 바꿔 다른 운세가 되면 그 운세의 대화로
  if (state.target !== target) setState({ target, chatId: chatOfFortune.get(target) ?? null });
  const chatId = state.target === target ? state.chatId : chatOfFortune.get(target) ?? null;
  const q = useQuery({ queryKey: consultKeys.one(chatId ?? 0), queryFn: () => consultApi.get(chatId!), enabled: !!chatId });
  const chat = q.data?.status === 'chat' && q.data.id === chatId ? q.data : null;
  const open = chat && chat.followUpsLeft > 0 ? chat : null;
  const [sending, setSending] = useState<string | null>(null);
  const cost = account ? nextChatCost(status.data?.chat, open ?? undefined) : 0;

  /** 보냈거나 로그인으로 넘겼으면 true — false면 입력을 되돌려 둔다 */
  const send = async (message: string, source?: ChatSource): Promise<boolean> => {
    if (sending) return false;
    // 게스트는 알을 쓸 수 없다 — 무료를 다 썼으면 로그인하고 이어서
    if (!account) {
      if (open && (open.freeTurnsLeft ?? 0) <= 0) {
        goLogin({ kind: 'unlock', title: '운알톡', returnTo: `/consult/${open.id}` });
        return true;
      }
      if (!open && (status.data?.chat?.freeChatsLeft ?? 1) <= 0) {
        goLogin({ kind: 'consult', worry: message, source });
        return true;
      }
    }
    setSending(message);
    try {
      const v: ConsultView = open ? await consultApi.followUp(open.id, message) : await consultApi.startChat(message, source);
      queryClient.setQueryData(consultKeys.one(v.id), v);
      queryClient.invalidateQueries({ queryKey: consultKeys.list });
      if (!open) {
        chatOfFortune.set(target, v.id);
        setState({ target, chatId: v.id });
      }
      if (v.charged) refreshPoints();
      trackAction(open ? 'inline_chat_reply' : 'inline_chat_start');
      return true;
    } catch (err) {
      const code = err instanceof ApiError ? err.code : '';
      if (code === 'INSUFFICIENT_POINTS') { toast(`한 마디에 ${cost || CHAT_CONFIG.cost}알이 들어요. 충전 후 다시 보내 주세요`); goWallet?.(); }
      else if (code === 'MEMBER_ONLY') goLogin({ kind: 'consult', worry: message, source });
      else if (code === 'CONSULT_CLOSED') {
        // 이 대화는 끝났다 — 다음 말은 새 대화로
        chatOfFortune.delete(target);
        setState({ target, chatId: null });
        toast('이 대화는 여기까지예요. 다시 보내면 새 대화로 이어져요');
      } else toast(SEND_ERROR[code] ?? SEND_ERROR.CONSULT_UNAVAILABLE);
      return false;
    } finally {
      setSending(null);
    }
  };

  return { chat, sending, send, cost };
}

/** 이어 말한 대화 — 운세 아래에 그대로 쌓인다 (방금 받은 답만 써진다) */
export function InlineChatTurns({ chat, sending }: { chat: ConsultView | null; sending: string | null }) {
  // 이 화면을 연 뒤에 받은 답만 써지는 것처럼
  const [openedAt] = useState(() => new Date().toISOString());
  const turns = chat?.turns ?? [];
  if (!turns.length && !sending) return null;
  return (
    <View style={{ marginTop: 28 }}>
      <Text style={[txt.caption, { textAlign: 'center' }]}>여기서부터 운알이와 나눈 이야기예요 · 운알톡에도 남아요</Text>
      {turns.map(t => (
        <View key={t.createdAt}>
          <MyBubble at={t.createdAt}>{t.question}</MyBubble>
          <Stream active={t.createdAt > openedAt}>
            <ReplyLines turn={t} />
            {t.suggest && chat?.risk === 'none' ? <SuggestBubble report={t.suggest} /> : null}
          </Stream>
        </View>
      ))}
      {sending ? (
        <>
          <MyBubble>{sending}</MyBubble>
          <ReplyBubble typing={STAGES.chat} />
        </>
      ) : null}
    </View>
  );
}
