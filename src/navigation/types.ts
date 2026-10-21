import { NavigatorScreenParams } from '@/navigation/compat';
import { AnalysisResult, CompatibilityResult, Period } from '../types';
import { CategoryKey } from '../theme/colors';
import { ThemeKind } from '../services/premium/catalog';
import type { ShareSpec } from '../services/share/shareSpecs';

export type TabParamList = {
  Home: undefined;
  Consult: undefined;
  Content: undefined;
  Compatibility: { result?: CompatibilityResult } | undefined;
  MyPage: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  EmailLogin: undefined;
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
  Consult: undefined;
  /** 상담 대화 (첫 답변 + 이어 묻기) */
  /** id 'new': 상담 탭이 시작한 요청(ask 키)의 답을 기다리는 중 */
  ConsultChat: { id: string; ask?: string };
  /** 상담 기록 전체 (무한 스크롤) */
  ConsultHistory: { kind: 'open' | 'past' };
  PastLife: undefined;
  Legal: { doc: 'terms' | 'privacy' };
};
