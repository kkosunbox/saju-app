import { NavigationProp, ParamListBase } from '@/navigation/compat';
import { ITEMS, Item, ThemeKind } from '../services/premium/catalog';
import { parseISO } from '../utils/date';

/** 프리미엄 콘텐츠 키 → 화면 이동 (HTML 미리보기의 data-act="premium" 대응) */
export type PremiumKey = 'lounge' | 'sajuDeep' | 'life' | 'newyear' | 'monthly' | 'lucky' | `theme-${ThemeKind}`;

/** useNavigation() 결과 그대로 받을 수 있도록 느슨하게 */
type Nav = Pick<NavigationProp<ParamListBase>, 'navigate'>;

export function openPremium(nav: Nav, key: PremiumKey) {
  if (key === 'lounge') return nav.navigate('Tabs', { screen: 'Content' });
  if (key === 'sajuDeep') return nav.navigate('SajuDeep');
  if (key === 'life') return nav.navigate('Life');
  if (key === 'newyear') return nav.navigate('NewYear');
  if (key === 'monthly') return nav.navigate('Monthly');
  if (key === 'lucky') return nav.navigate('Lucky');
  return nav.navigate('Theme', { kind: key.slice(6) as ThemeKind });
}

/** 목록·카드에 가격을 보여줄 때 쓰는 기본 상품 (이번 해 · 이번 달 · 이사) */
export function defaultItem(key: Exclude<PremiumKey, 'lounge'>, today: string): Item {
  const t = parseISO(today);
  if (key === 'sajuDeep') return ITEMS.sajuDeep();
  if (key === 'life') return ITEMS.life();
  if (key === 'newyear') return ITEMS.newyear(t.y);
  if (key === 'monthly') return ITEMS.monthly(t.y, t.m);
  if (key === 'lucky') return ITEMS.lucky('move', today);
  return ITEMS.theme(key.slice(6) as ThemeKind);
}

/** 친구 결과 링크의 화면 이름 → 이동 */
export function openFriendRoute(nav: Nav, c: string) {
  if (c === 'Home' || c === 'Compatibility') return nav.navigate('Tabs', { screen: c });
  if (c === 'Theme') return nav.navigate('Theme', { kind: 'love' });
  if (c === 'ThemeMoney') return nav.navigate('Theme', { kind: 'money' });
  if (c === 'ThemeCareer') return nav.navigate('Theme', { kind: 'career' });
  return nav.navigate(c);
}
