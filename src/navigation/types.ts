import { NavigatorScreenParams } from '@/navigation/compat';
import { AnalysisResult, CompatibilityResult, Period } from '../types';
import { CategoryKey } from '../theme/colors';
import { ThemeKind } from '../services/premium/catalog';
import type { ShareSpec } from '../services/share/shareSpecs';

export type TabParamList = {
  /** 첫 화면 = 홈 (오늘의 운세 요약) */
  Home: undefined;
  Consult: undefined;
  Talks: { tab?: 'fortune' } | undefined;
  Content: undefined;
  /** star: 천생연분 스타에서 '궁합 상대로 추가' — 그 스타의 이름·양력 생일·성별로 입력 칸을 채운다 */
  Compatibility: { result?: CompatibilityResult; resultId?: string; star?: { nickname: string; birthDate: string; gender: 'female' | 'male' } } | undefined;
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
  /** 운알톡 대화 (예전 고민 상담 기록은 읽기만) */
  /** id 'new': 상담 탭이 시작한 요청(ask 키)의 답을 기다리는 중 */
  /** fresh: 방금 받은 답 — 답이 써지는 것처럼 보여 준다 */
  ConsultChat: { id: string; ask?: string; fresh?: string };
  /** 지난 오늘의 운세 (뽑은 운세 id) */
  FortuneHistory: { id: string };
  /** 상담 기록 전체 (무한 스크롤) */
  ConsultHistory: { kind: 'open' | 'past' };
  PastLife: undefined;
  /** 천생연분 스타 (뽑기 · 결과 · 다른 스타 목록) */
  StarMatch: undefined;
  /** 천생연분 스타 한 명과의 궁합 */
  StarMatchDetail: { id: string };
  Pet: undefined;
  Child: undefined;
  Legal: { doc: 'terms' | 'privacy' };
  /** 1:1 문의 (카테고리 + 내용) */
  Inquiry: undefined;
};
