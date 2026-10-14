import { useApp } from '../../context/AppContext';
import { usePremium } from '../../context/PremiumContext';
import { ShareSpec } from './shareSpecs';
import { resultUrl, shareLink } from './linkShare';

/**
 * 공유 동작 모음 — 링크에는 내 결과 한 줄을 담아 친구가 열면 나란히 비교되게 하고,
 * 공유가 끝나면 공유 보상(+10P)을 준다.
 */
export function useShare() {
  const { user } = useApp();
  const { rewardShare, toast } = usePremium();
  const urlOf = (spec: ShareSpec) => resultUrl({ c: spec.route, k: spec.kind, n: user?.nickname ?? '친구', h: spec.short });
  const sendLink = async (spec: ShareSpec) => {
    const r = await shareLink(spec.text, urlOf(spec));
    if (r === 'cancelled') return r;
    if (r === 'copied') toast('링크를 복사했어요. 친구에게 붙여 넣어 보내세요');
    rewardShare(spec.file);
    return r;
  };
  return { sendLink, urlOf, reward: (spec: ShareSpec) => rewardShare(spec.file) };
}
