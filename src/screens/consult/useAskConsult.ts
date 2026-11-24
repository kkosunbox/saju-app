/**
 * 운알톡 밖(오늘의 운세 화면 · 콘텐츠 끝의 운알이)에서 말을 거는 길 — 보내면 바로 운알톡 대화 화면으로 넘어가 답을 기다린다.
 * source를 주면 운알이가 그 화면 내용을 기억하고 이야기한다.
 * - 회원은 바로 보낸다. 무료를 다 썼으면 메시지마다 알이 들고, 모자라면 대화 화면이 충전으로 안내한다.
 * - 게스트가 무료 대화를 이미 썼으면 말을 기억해 두고 로그인으로 (로그인하면 운알톡 탭이 이어서 보낸다).
 */
import { NativeStackNavigationProp, useNavigation } from '@/navigation/compat';
import { useApp } from '../../context/AppContext';
import { RootStackParamList } from '../../navigation/types';
import { goLogin } from '../../services/loginIntent';
import { trackAction } from '../../services/screenViews';
import { ChatSource, nextChatCost, useConsultStatus } from '../../services/server/consultApi';
import { startAsk } from './pendingAsk';

/** from: 기록에 남길 출발 화면 (예: 'fortune' → fortune_ask · fortune_ask_login_required) */
export function useAskConsult(from: string) {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, account } = useApp();
  const status = useConsultStatus(!!user);
  const chat = status.data?.chat;
  const ask = (message: string, source?: ChatSource) => {
    // 게스트는 상태를 아직 못 받았으면 일단 보낸다 — 이미 썼으면 서버가 MEMBER_ONLY로 돌려주고 대화 화면이 로그인으로 보낸다
    if (!account && chat && chat.freeChatsLeft <= 0) {
      trackAction(`${from}_ask_login_required`);
      goLogin({ kind: 'consult', worry: message, source });
      return;
    }
    trackAction(`${from}_ask`);
    nav.push('ConsultChat', { id: 'new', ask: startAsk(message, source) });
  };
  /** cost: 다음 대화를 열면 드는 알 (0이면 무료 · 구독) — 입력창 위 안내용 */
  return { ask, cost: account ? nextChatCost(chat) : 0 };
}
