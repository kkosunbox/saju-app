/** My fortune profiles on the server (GET/PUT /fortune-profile = the primary one, /fortune-profiles = all). */
import { api, ApiError, call } from '../../api/client';
import { BirthPlace, Interest, MBTI, ProfileRelationship, User } from '../../types';
import { Natal } from '../../types/content';

interface ProfileDto {
  id: number;
  relationship: ProfileRelationship;
  isPrimary: boolean;
  nickname: string;
  calendarType: 'solar' | 'lunar';
  birthDate: string;
  isLeapMonth: boolean;
  birthDateSolar: string;
  birthTime: string | null;
  useYajasi: boolean;
  birthPlace: BirthPlace | null;
  gender: User['gender'];
  mbti: MBTI;
  mbtiIsEstimated: boolean;
  bloodType: User['bloodType'];
  interests: Interest[];
  concern: string | null;
  occupation: string | null;
  version: number;
  updatedAt: string;
  natal: Natal;
}

export const toUser = (accountId: number | string, p: ProfileDto): User => ({
  id: String(accountId),
  profileId: p.id,
  relationship: p.relationship,
  isPrimary: p.isPrimary,
  nickname: p.nickname,
  birthDate: p.birthDateSolar,
  birthDateInput: p.birthDate,
  calendarType: p.calendarType,
  isLeapMonth: p.isLeapMonth,
  birthTime: p.birthTime,
  useYajasi: p.useYajasi,
  birthPlace: p.birthPlace,
  gender: p.gender,
  mbti: p.mbti,
  mbtiUnknown: p.mbtiIsEstimated,
  bloodType: p.bloodType ?? null,
  interests: p.interests,
  concern: p.concern ?? undefined,
  occupation: p.occupation ?? undefined,
  version: p.version,
  createdAt: p.updatedAt,
  natal: p.natal,
});

/** Who a content was made for, as it was then (server ContentPersonDto). */
export interface ContentPerson {
  profileId: number | null;
  relationship: ProfileRelationship | null;
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

/** The person a content was made for, as a User the screens draw from (the account stays the same). */
export const personToUser = (accountId: string, p: ContentPerson): User => ({
  id: accountId,
  profileId: p.profileId ?? undefined,
  relationship: p.relationship ?? undefined,
  nickname: p.nickname,
  birthDate: p.birthDateSolar,
  birthDateInput: p.birthDate,
  calendarType: p.calendarType,
  isLeapMonth: p.isLeapMonth,
  birthTime: p.birthTime,
  useYajasi: p.useYajasi,
  gender: p.gender,
  mbti: p.mbti,
  mbtiUnknown: p.mbtiIsEstimated,
  bloodType: null,
  createdAt: '',
  natal: p.natal,
});

/** What the profile form submits. */
export interface ProfileInput {
  nickname: string;
  calendarType: 'solar' | 'lunar';
  /** In the chosen calendar. */
  birthDate: string;
  isLeapMonth?: boolean;
  birthTime: string | null;
  useYajasi?: boolean;
  /** null = 모름 → 서울로 계산 */
  birthPlaceId?: number | null;
  gender: User['gender'];
  /** null = 모름 → the server estimates it from the chart. */
  mbti: MBTI | null;
  bloodType?: User['bloodType'];
  interests?: Interest[];
  concern?: string | null;
  occupation?: string | null;
  /** 나와의 관계 (새 프로필 · 관계를 바꿀 때) */
  relationship?: ProfileRelationship;
}

/** A User back to the form input (for edits that keep the birth details). */
export const inputOf = (u: User): ProfileInput => ({
  nickname: u.nickname,
  calendarType: u.calendarType ?? 'solar',
  birthDate: u.birthDateInput ?? u.birthDate,
  isLeapMonth: u.isLeapMonth ?? false,
  birthTime: u.birthTime,
  useYajasi: u.useYajasi ?? false,
  birthPlaceId: u.birthPlace?.id ?? null,
  gender: u.gender,
  mbti: u.mbtiUnknown ? null : u.mbti,
  interests: u.interests ?? [],
  concern: u.concern ?? null,
  occupation: u.occupation ?? null,
});

const bodyOf = (input: ProfileInput) => ({
  ...input,
  isLeapMonth: input.isLeapMonth ?? false,
  useYajasi: input.useYajasi ?? false,
  interests: input.interests ?? [],
});

export const profileKeys = { list: ['profiles'] as const };

export const profileApi = {
  /** The primary profile. null when no profile has been created yet. */
  async get(accountId: number): Promise<User | null> {
    try {
      return toUser(accountId, await call<ProfileDto>(api.GET('/v1/fortune-profile')));
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    }
  },

  /** Creates the first profile or updates the primary one (no edit limit; what was already drawn keeps the old details). */
  async save(accountId: number, input: ProfileInput): Promise<User> {
    return toUser(accountId, await call<ProfileDto>(api.PUT('/v1/fortune-profile', { body: bodyOf(input) as never })));
  },

  /** All my profiles, the primary one first. */
  async list(accountId: number | string): Promise<User[]> {
    const { list } = await call<{ list: ProfileDto[] }>(api.GET('/v1/fortune-profiles'));
    return list.map(p => toUser(accountId, p));
  },

  async create(accountId: number | string, input: ProfileInput): Promise<User> {
    return toUser(accountId, await call<ProfileDto>(api.POST('/v1/fortune-profiles', { body: bodyOf(input) as never })));
  },

  async update(accountId: number | string, profileId: number, input: ProfileInput): Promise<User> {
    return toUser(accountId, await call<ProfileDto>(api.PUT('/v1/fortune-profiles/{id}', { params: { path: { id: profileId } }, body: bodyOf(input) as never })));
  },

  async setPrimary(accountId: number | string, profileId: number): Promise<User> {
    return toUser(accountId, await call<ProfileDto>(api.POST('/v1/fortune-profiles/{id}/primary', { params: { path: { id: profileId } } })));
  },

  async remove(profileId: number): Promise<void> {
    await call(api.DELETE('/v1/fortune-profiles/{id}', { params: { path: { id: profileId } } }));
  },
};
