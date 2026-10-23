/** My fortune profile on the server (GET/PUT /fortune-profile). */
import { api, ApiError, call } from '../../api/client';
import { Interest, MBTI, User } from '../../types';
import { Natal } from '../../types/content';

interface ProfileDto {
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
  bloodType: User['bloodType'];
  interests: Interest[];
  concern: string | null;
  occupation: string | null;
  version: number;
  updatedAt: string;
  natal: Natal;
}

const toUser = (accountId: number, p: ProfileDto): User => ({
  id: String(accountId),
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
  bloodType: p.bloodType,
  interests: p.interests,
  concern: p.concern ?? undefined,
  occupation: p.occupation ?? undefined,
  version: p.version,
  createdAt: p.updatedAt,
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
  gender: User['gender'];
  /** null = 모름 → the server estimates it from the chart. */
  mbti: MBTI | null;
  bloodType: User['bloodType'];
  interests?: Interest[];
  concern?: string | null;
  occupation?: string | null;
}

/** A User back to the form input (for edits that keep the birth details). */
export const inputOf = (u: User): ProfileInput => ({
  nickname: u.nickname,
  calendarType: u.calendarType ?? 'solar',
  birthDate: u.birthDateInput ?? u.birthDate,
  isLeapMonth: u.isLeapMonth ?? false,
  birthTime: u.birthTime,
  useYajasi: u.useYajasi ?? false,
  gender: u.gender,
  mbti: u.mbtiUnknown ? null : u.mbti,
  bloodType: u.bloodType,
  interests: u.interests ?? [],
  concern: u.concern ?? null,
  occupation: u.occupation ?? null,
});

export const profileApi = {
  /** null when the profile has not been created yet. */
  async get(accountId: number): Promise<User | null> {
    try {
      return toUser(accountId, await call<ProfileDto>(api.GET('/v1/fortune-profile')));
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    }
  },

  /** Creates or updates (no edit limit; what was already drawn keeps the old details). */
  async save(accountId: number, input: ProfileInput): Promise<User> {
    const body = {
      ...input,
      isLeapMonth: input.isLeapMonth ?? false,
      useYajasi: input.useYajasi ?? false,
      interests: input.interests ?? [],
    };
    return toUser(accountId, await call<ProfileDto>(api.PUT('/v1/fortune-profile', { body: body as never })));
  },
};
