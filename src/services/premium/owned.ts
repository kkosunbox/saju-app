/**
 * 보유 콘텐츠 — 열람권을 "어느 프로필의 어떤 콘텐츠"로 묶는다 (마이페이지 개수 · 보유 콘텐츠 목록이 같은 기준을 쓴다).
 *
 * - 같은 프로필로 같은 콘텐츠를 여러 번 연 것(프로필을 고치고 다시 연 것)은 하나로 친다.
 *   지금 정보로 연 열람권이 있으면 그것, 없으면 가장 최근 것을 대표로 쓴다.
 * - 패키지(bundle:)는 담긴 콘텐츠가 따로 들어오니 세지 않는다. 열 화면이 없는 키도 뺀다.
 * - 심층 궁합 · 속마음은 궁합 기록에 묶여 있어서 프로필로 나누지 않는다 (profileId: null).
 */
import { Entitlement } from '../server/pointsApi';
import { hrefOfKey } from './catalog';

export interface OwnedContent {
  contentKey: string;
  /** 어느 프로필 것인지 (궁합 · 속마음은 null — 궁합 기록의 프로필을 따른다) */
  profileId: number | null;
  /** 대표 열람권 */
  entitlement: Entitlement;
  /** 같은 프로필 · 같은 콘텐츠로 연 열람권 수 (예전 정보로 본 기록 포함) */
  records: number;
}

export const byRecordKey = (key: string) => key.startsWith('compat:') || key.startsWith('crush:') || key.startsWith('child:');

export function ownedContents(entitlements: Entitlement[], primaryId: number | null): OwnedContent[] {
  const groups = new Map<string, OwnedContent>();
  for (const e of entitlements) {
    if (e.contentKey.startsWith('bundle:') || !hrefOfKey(e.contentKey)) continue;
    const profileId = byRecordKey(e.contentKey) ? null : e.profileId ?? primaryId;
    const id = `${e.contentKey}|${profileId ?? ''}`;
    const prev = groups.get(id);
    if (!prev) { groups.set(id, { contentKey: e.contentKey, profileId, entitlement: e, records: 1 }); continue; }
    prev.records += 1;
    const better = e.current !== prev.entitlement.current ? e.current : e.createdAt > prev.entitlement.createdAt;
    if (better) prev.entitlement = e;
  }
  return [...groups.values()];
}
