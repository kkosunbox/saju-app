import { router, type Href } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { loginIntentReturnTo } from '../../services/loginIntent';

/**
 * After a social login: reload the session, then go on — to the profile form when the account has
 * no fortune profile yet, and through our terms first when it has not agreed to them.
 */
export function useAfterSocialLogin() {
  const { reloadSession, onboarded, completeOnboarding } = useApp();
  return async ({ returnTo, needsTerms }: { returnTo?: string; needsTerms: boolean }) => {
    const hasProfile = await reloadSession();
    if (!onboarded) await completeOnboarding();
    // 막혔던 곳(보내려던 질문 · 열려던 콘텐츠)이 있으면 그리로 돌아가 이어서 한다
    const back = returnTo && returnTo !== '/' ? returnTo : loginIntentReturnTo() || '/';
    const next = hasProfile ? back : '/profile-setup';
    router.replace((needsTerms ? `/signup-terms?next=${encodeURIComponent(next)}` : next) as Href);
  };
}
