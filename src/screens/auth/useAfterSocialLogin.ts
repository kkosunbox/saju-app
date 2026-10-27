import { router, type Href } from 'expo-router';
import { useApp } from '../../context/AppContext';

/**
 * After a social login: reload the session, then go on — to the profile form when the account has
 * no fortune profile yet, and through our terms first when it has not agreed to them.
 */
export function useAfterSocialLogin() {
  const { reloadSession, onboarded, completeOnboarding } = useApp();
  return async ({ returnTo, needsTerms }: { returnTo?: string; needsTerms: boolean }) => {
    const hasProfile = await reloadSession();
    if (!onboarded) await completeOnboarding();
    const next = hasProfile ? returnTo || '/' : '/profile-setup';
    router.replace((needsTerms ? `/signup-terms?next=${encodeURIComponent(next)}` : next) as Href);
  };
}
