/** Compatibility history and invites on the server. */
import { ApiError, api, call } from '../../api/client';
import { BirthPlace, CompatibilityResult, PartnerInput, Relationship } from '../../types';

interface CompatibilityDto {
  id: number;
  source: 'manual' | 'invite';
  partnerNickname: string;
  relationship?: Relationship;
  partner: null | {
    calendarType: 'solar' | 'lunar'; birthDate: string; isLeapMonth: boolean; birthDateSolar: string;
    birthTime: string | null; birthPlace?: BirthPlace | null; gender: PartnerInput['gender']; mbti: PartnerInput['mbti'];
    bloodType: PartnerInput['bloodType'];
  };
  result: Omit<CompatibilityResult, 'userId' | 'target' | 'createdAt' | 'id' | 'source' | 'relationship' | 'inviteRole' | 'isNew'> & { relationship?: Relationship };
  inviteRole?: 'inviter' | 'friend' | null;
  isNew?: boolean;
  createdAt: string;
}

const toResult = (userId: string, dto: CompatibilityDto): CompatibilityResult => ({
  ...dto.result,
  id: dto.id,
  source: dto.source,
  inviteRole: dto.inviteRole ?? null,
  isNew: !!dto.isNew,
  // 관계가 없던 예전 기록은 연인 궁합
  relationship: dto.relationship ?? dto.result.relationship ?? 'lover',
  userId,
  // invite records accepted without sharing carry no partner details (only the nickname)
  target: dto.partner
    ? { nickname: dto.partnerNickname, birthDate: dto.partner.birthDateSolar, birthTime: dto.partner.birthTime, birthPlace: dto.partner.birthPlace ?? null, gender: dto.partner.gender, mbti: dto.partner.mbti ?? null, bloodType: dto.partner.bloodType ?? null }
    : { nickname: dto.partnerNickname, birthDate: '', birthTime: null, gender: 'female', mbti: null, bloodType: null },
  createdAt: dto.createdAt,
});

/** 공개 동의 없이 본 예전 초대 궁합: 상대 생일·MBTI·혈액형이 없다 */
export const isPrivateInvite = (r: CompatibilityResult) => r.source === 'invite' && !r.target.birthDate;

/** 저장된 상대(궁합 기록) 목록 캐시 */
export const compatKeys = { list: ['compat-list'] as const };

export const compatApi = {
  async create(userId: string, partner: PartnerInput & { relationship: Relationship; calendarType?: 'solar' | 'lunar'; isLeapMonth?: boolean }) {
    const dto = await call<CompatibilityDto>(api.POST('/v1/compatibilities', {
      body: {
        nickname: partner.nickname,
        relationship: partner.relationship,
        calendarType: partner.calendarType ?? 'solar',
        birthDate: partner.birthDate,
        isLeapMonth: partner.isLeapMonth ?? false,
        birthTime: partner.birthTime,
        birthPlaceId: partner.birthPlace?.id ?? null,
        gender: partner.gender,
        mbti: partner.mbti,
      } as never,
    }));
    return toResult(userId, dto);
  },

  async list(userId: string): Promise<CompatibilityResult[]> {
    const data = await call<{ list: CompatibilityDto[] }>(api.GET('/v1/compatibilities'));
    return data.list.map(dto => toResult(userId, dto));
  },

  /** 내 링크로 상대가 본 궁합을 열었다 (isNew → false) */
  async markSeen(id: number): Promise<void> {
    await call(api.POST('/v1/compatibilities/{id}/seen', { params: { path: { id } } }));
  },

  async remove(id: number): Promise<void> {
    await call(api.DELETE('/v1/compatibilities/{id}', { params: { path: { id } } }));
  },

  /** My live invite token, or null when I have none. */
  async myInviteToken(relationship?: Relationship): Promise<string | null> {
    try {
      return (await call<{ token: string }>(api.GET('/v1/compatibility-invites/me', { params: { query: { relationship } } }))).token;
    } catch (e) {
      if (e instanceof ApiError && e.code === 'INVITATION_NOT_FOUND') return null;
      throw e;
    }
  },

  /** Public: who invited (no login). */
  async previewInvite(token: string): Promise<{ inviterNickname: string; relationship: Relationship; sharesProfile: boolean; expiresAt: string }> {
    return call(api.GET('/v1/compatibility-invites/{token}', { params: { path: { token } } }));
  },

  /** My compatibility with the inviter, saved in both histories with each other's profile (I agreed to share it). */
  async acceptInvite(userId: string, token: string): Promise<CompatibilityResult> {
    const dto = await call<CompatibilityDto>(api.POST('/v1/compatibility-invites/{token}/compatibilities', {
      params: { path: { token } },
      body: { shareProfile: true },
    }));
    return toResult(userId, dto);
  },
};
