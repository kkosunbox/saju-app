/**
 * 운알톡 밖(오늘의 운세 화면 등)에서 고민을 보내는 길 — 보내면 바로 운알톡 대화 화면으로 넘어가 답을 기다린다.
 * - 무료(회원 하루 5번 · 게스트는 처음 1번) · 구독 횟수가 남았으면 바로 보낸다.
 * - 게스트가 무료 한 번을 이미 썼으면 질문을 기억해 두고 로그인으로 (로그인하면 상담 탭이 이어서 보낸다).
 * - 회원인데 알이 들면 상담 탭으로 넘겨 거기서 확인을 받고 보낸다.
 */
import { NativeStackNavigationProp, useNavigation } from '@/navigation/compat';
import { useApp } from '../../context/AppContext';
import { RootStackParamList } from '../../navigation/types';
import { ConsultCat, guessCat } from '../../services/content/consult';
import { goLogin, setLoginIntent } from '../../services/loginIntent';
import { trackAction } from '../../services/screenViews';
import { useConsultStatus } from '../../services/server/consultApi';
import { startAsk } from './pendingAsk';

/** from: 기록에 남길 출발 화면 (예: 'fortune' → fortune_ask · fortune_ask_login_required) */
export function useAskConsult(from: string) {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, account } = useApp();
  const status = useConsultStatus(!!user);
  return (worry: string, topic: ConsultCat | undefined = guessCat(worry) ?? undefined) => {
    const d = status.data;
    const free = (d?.freeLeft ?? 0) > 0 || (!!account && (d?.subscription?.left ?? 0) > 0);
    // 게스트는 상태를 아직 못 받았으면 일단 보낸다 — 이미 썼으면 서버가 MEMBER_ONLY로 돌려주고 대화 화면이 로그인으로 보낸다
    const send = account ? !!d && free : !d || free;
    if (send) {
      trackAction(`${from}_ask`);
      nav.push('ConsultChat', { id: 'new', ask: startAsk(worry, topic) });
      return;
    }
    if (!account) {
      trackAction(`${from}_ask_login_required`);
      goLogin({ kind: 'consult', worry, topic });
      return;
    }
    setLoginIntent({ kind: 'consult', worry, topic });
    nav.navigate('Consult');
  };
}
