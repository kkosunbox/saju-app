import { NavigatorScreenParams } from '@/navigation/compat';
import { AnalysisResult, CompatibilityResult } from '../types';
import { CategoryKey } from '../theme/colors';
import { ThemeKind } from '../services/premium/catalog';
import type { ShareSpec } from '../services/share/shareSpecs';

export type TabParamList = {
  Home: undefined;
  Fortune: undefined;
  Content: undefined;
  Compatibility: { result?: CompatibilityResult } | undefined;
  MyPage: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  EmailLogin: undefined;
  SignUp: undefined;
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
  Consult: { id?: string } | undefined;
  PastLife: undefined;
  Legal: { doc: 'terms' | 'privacy' };
};
