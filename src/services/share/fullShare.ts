/**
 * 유료 풀이 전체 공유 — 서버가 공유 시점의 내용을 복사해 두고 무작위 토큰 링크(/r/{token})를 준다. 취소할 때까지 열린다.
 * 받은 사람은 로그인 없이 전체 내용을 본다. 심층 궁합 · 속마음 · 반려동물은 그 기록(상대 · 아이 정보)도 함께 온다.
 */
import { api, call } from '../../api/client';
import { appUrl } from './linkShare';
import { BirthPlace, CompatibilityResult, MBTI, User } from '../../types';
import { Natal, Pet } from '../../types/content';
import { CompatibilityDto, toResult } from '../server/compatApi';
import { ReadingView } from '../../types/reading';
import { SajuProfile } from '../../types/premium';

const FULL_SHARE_KEY = /^(saju|life|spouse|newyear:\d{4}|monthly:\d{4}-\d{2}|theme:[a-z]+|lucky:[a-z]+|compat:\d+|crush:\d+|pet:\d+)$/;

/** 전체 공유 링크를 만들 수 있는 콘텐츠인지 */
export const canShareFull = (contentKey?: string | null) => !!contentKey && FULL_SHARE_KEY.test(contentKey);

/** 내가 만든 공유 링크 (공유를 취소할 때까지 열린다) */
export interface MyShare { url: string; createdAt: string }

type ShareDto = { token: string; createdAt: string };
const myShareOf = (r: ShareDto): MyShare => ({ url: `${appUrl()}/r/${r.token}`, createdAt: r.createdAt });

/** 공유 링크를 만든다. 같은 내용의 살아 있는 링크가 있으면 서버가 그것을 준다. */
export async function createFullShare(contentKey: string): Promise<MyShare> {
  return myShareOf(await call<ShareDto>(api.POST('/v1/premium/shares', { body: { contentKey } })));
}

/** 이 콘텐츠를 공유 중이면 그 링크(가장 최근), 아니면 null */
export async function getMyShare(contentKey: string): Promise<MyShare | null> {
  const r = await call<ShareDto | null>(api.GET('/v1/premium/shares/mine', { params: { query: { contentKey } } }));
  return r ? myShareOf(r) : null;
}

/** 공유 취소 — 이 콘텐츠로 만든 링크가 모두 더 이상 열리지 않는다 */
export async function revokeMyShare(contentKey: string): Promise<void> {
  await call(api.DELETE('/v1/premium/shares/mine', { params: { query: { contentKey } } }));
}

interface OwnerDto {
  nickname: string;
  calendarType: 'solar' | 'lunar';
  birthDate: string;
  isLeapMonth: boolean;
  birthDateSolar: string;
  birthTime: string | null;
  useYajasi: boolean;
  gender: User['gender'];
  mbti: MBTI;
  mbtiIsEstimated: boolean;
  natal: Natal;
}

export interface SharedContent {
  contentKey: string;
  content: { data: unknown; profile?: SajuProfile; reading?: ReadingView | null };
  owner: User;
  sharedOn: string;
  compat: CompatibilityResult | null;
  pet: Pet | null;
}

/** 공유 링크의 내용 (로그인 불필요). 없거나 만료 · 꺼진 링크는 ApiError(404). */
export async function getSharedContent(token: string): Promise<SharedContent> {
  const r = await call<{ contentKey: string; content: SharedContent['content']; owner: OwnerDto; sharedOn: string; compat?: CompatibilityDto | null; pet?: Pet | null }>(
    api.GET('/v1/premium/shares/{token}', { params: { path: { token } } }),
  );
  const o = r.owner;
  const owner: User = {
    id: 'shared',
    nickname: o.nickname,
    birthDate: o.birthDateSolar,
    birthDateInput: o.birthDate,
    calendarType: o.calendarType,
    isLeapMonth: o.isLeapMonth,
    birthTime: o.birthTime,
    useYajasi: o.useYajasi,
    birthPlace: null as BirthPlace | null,
    gender: o.gender,
    mbti: o.mbti,
    mbtiUnknown: o.mbtiIsEstimated,
    bloodType: null,
    createdAt: r.sharedOn,
    natal: o.natal,
  };
  return { contentKey: r.contentKey, content: r.content, owner, sharedOn: r.sharedOn, compat: r.compat ? toResult(owner.id, r.compat) : null, pet: r.pet ?? null };
}
