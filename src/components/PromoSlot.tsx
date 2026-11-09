import React, { useEffect } from 'react';
import PromoCard, { PROMO_TONE } from './PromoCard';
import { usePremium } from '../context/PremiumContext';
import { usePremiumPreview } from '../services/server/premiumApi';
import { Promo, PromoKey } from '../services/promo/promos';
import { trackPromo } from '../services/promo/track';

/** 따로 정한 그림이 없는 상품(운알톡 · 신년운세 등)이 쓰는 기본 배경 */
export const CONSULT_DESIGN = { base: require('../../assets/figma/content/promo-consult-base.webp'), tone: 'sage' } as const;
const LOVE_DESIGN = { base: require('../../assets/figma/content/promo-spouse-base.webp'), tone: 'pink' } as const;
/** 추천 카드(recommendation)의 상품별 배경 그림과 제목 색 — 웹 랜딩도 같이 쓴다 */
export const RECOMMENDATION_DESIGN: Partial<Record<PromoKey, { base: number; tone: keyof typeof PROMO_TONE }>> = {
  'theme-love': LOVE_DESIGN,
  crush: LOVE_DESIGN,
  spouse: LOVE_DESIGN,
  'theme-money': { base: require('../../assets/figma/content/promo-money-base.webp'), tone: 'amber' },
  'theme-career': { base: require('../../assets/figma/content/promo-career-base.webp'), tone: 'lime' },
};

/** 화면에 처음 보일 때 노출을 한 번 남기고, 누를 때 클릭을 남긴 뒤 go를 부른다 */
export function usePromoTrack(screen: string, item: string, go: () => void) {
  useEffect(() => { trackPromo('view', screen, item); }, [screen, item]);
  return () => { trackPromo('click', screen, item); go(); };
}

/** 화면마다 디자인이 정해진 카드(홈 · 콘텐츠 탭)에 기록만 붙인다 */
export function TrackedPromoCard({ screen, item, onPress, ...props }: React.ComponentProps<typeof PromoCard> & { screen: string; item: string }) {
  return <PromoCard {...props} onPress={usePromoTrack(screen, item, onPress)} />;
}

interface Props {
  /** 기록용 화면 이름 (fortune_daily, category_love …) */
  screen: string;
  promo: Promo;
  tone?: keyof typeof PROMO_TONE;
  /** 제목을 화면 맥락에 맞게 바꿀 때 */
  title?: string;
  /** 잠겨 있으면 미리보기의 내 결과 한 조각을 설명에 넣는다 */
  teaser?: boolean;
  variant?: React.ComponentProps<typeof PromoCard>['variant'];
  base?: React.ComponentProps<typeof PromoCard>['base'];
}

/** 유료 콘텐츠 추천 카드 — 보유 여부 · 가진 알로 바로 열기 · 미리보기 한 줄 · 노출/클릭 기록 */
export default function PromoSlot({ screen, promo, tone = 'gold', title, teaser, variant = 'recommendation', base }: Props) {
  const { owned, points } = usePremium();
  const have = owned(promo.item.key);
  const preview = usePremiumPreview<unknown>(promo.ref ?? { kind: 'saju' }, !!teaser && !!promo.ref && !have);
  const onPress = usePromoTrack(screen, promo.track, promo.go);
  const body = (teaser && !have && preview.data ? promo.teaser?.(preview.data) : null) ?? promo.desc;
  // 제목을 바꾸면 상품 이름은 설명 앞에 둔다
  const desc = title ? `${promo.title} · ${body}` : body;
  // 상담은 하루 무료 횟수가 있고 속마음은 상대를 먼저 골라야 해서 가진 알 안내를 하지 않는다
  const verb = promo.key !== 'consult' && promo.key !== 'crush' && points >= promo.item.cost ? '가진 알로 바로 열기' : promo.verb;
  const design = RECOMMENDATION_DESIGN[promo.key] ?? CONSULT_DESIGN;
  const recommendation = variant === 'recommendation';
  return (
    <PromoCard
      tone={recommendation ? design.tone : tone} variant={variant} base={base ?? (recommendation ? design.base : undefined)} title={title ?? promo.title} desc={desc}
      isNew={variant === 'home'} badgePlacement={variant === 'home' ? 'inline' : undefined}
      owned={have} coin={!have} cta={have ? '다시보기 →' : `${promo.item.cost}${variant === 'home' ? 'P' : recommendation ? '알' : ''} · ${verb} →`}
      onPress={onPress}
    />
  );
}
