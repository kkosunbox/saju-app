import { NavigatorScreenParams } from '@/navigation/compat';
import { AnalysisResult, CompatibilityResult, Period } from '../types';
import { CategoryKey } from '../theme/colors';
import { ThemeKind } from '../services/premium/catalog';
import type { ShareSpec } from '../services/share/shareSpecs';

export type TabParamList = {
  /** 첫 화면 = 운알톡 */
  Home: undefined;
  Consult: undefined;
  Talks: { tab?: 'fortune' } | undefined;
  Content: undefined;
  Compatibility: { result?: CompatibilityResult; resultId?: string } | undefined;
  MyPage: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  /** 가입 화면에서 이미 회원인 이메일을 넣었을 때 그 이메일을 채워 둔다 (메모리로만 넘김) */
  EmailLogin: { prefill?: { email: string } } | undefined;
  SignUp: undefined;
  SocialTerms: { next?: string } | undefined;
  FindPassword: undefined;
  SocialLogin: { provider: 'kakao' | 'naver' | 'apple' | 'google' };
  ProfileSetup: undefined;
  Tabs: NavigatorScreenParams<TabParamList>;
  CategoryDetail: { category: CategoryKey };
  AnalysisDetail: { source: AnalysisResult['source'] };
  CombinedAnalysis: undefined;
  Share: { spec?: ShareSpec } | undefined;
  Wallet: undefined;
  SajuDeep: undefined;
  Life: undefined;
  NewYear: { year?: number } | undefined;
  Monthly: { y: number; m: number } | undefined;
  Theme: { kind: ThemeKind };
  Lucky: undefined;
  MbtiMatch: undefined;
  Character: undefined;
  Talisman: undefined;
  Spouse: undefined;
  Fortune: { period?: Period } | undefined;
  /** 오늘의 운세 (마스코트를 꾹 눌러 뽑는 화면) */
  Today: undefined;
  Consult: undefined;
  /** 상담 대화 (첫 답변 + 이어 묻기) */
  /** id 'new': 상담 탭이 시작한 요청(ask 키)의 답을 기다리는 중 */
  /** fresh: 방금 받은 답 — 답이 써지는 것처럼 보여 준다 */
  ConsultChat: { id: string; ask?: string; fresh?: string };
  /** 지난 오늘의 운세 (뽑은 운세 id) */
  FortuneHistory: { id: string };
  /** 상담 기록 전체 (무한 스크롤) */
  ConsultHistory: { kind: 'open' | 'past' };
  PastLife: undefined;
  Pet: undefined;
  Child: undefined;
  Legal: { doc: 'terms' | 'privacy' };
  /** 1:1 문의 (카테고리 + 내용) */
  Inquiry: undefined;
};
