/** Compatibility history and invites on the server. */
import { api, call } from '../../api/client';
import { CompatibilityResult, PartnerInput } from '../../types';

interface CompatibilityDto {
  id: number;
  source: 'manual' | 'invite';
  partnerNickname: string;
  partner: null | {
    calendarType: 'solar' | 'lunar'; birthDate: string; isLeapMonth: boolean; birthDateSolar: string;
    birthTime: string | null; gender: PartnerInput['gender']; mbti: PartnerInput['mbti']; mbtiIsEstimated: boolean;
    bloodType: PartnerInput['bloodType'];
  };
  result: Omit<CompatibilityResult, 'userId' | 'target' | 'createdAt' | 'id' | 'source'>;
  createdAt: string;
}

const toResult = (userId: string, dto: CompatibilityDto): CompatibilityResult => ({
  ...dto.result,
  id: dto.id,
  source: dto.source,
  userId,
  // invite records carry no partner details (only the inviter's nickname)
  target: dto.partner
    ? { nickname: dto.partnerNickname, birthDate: dto.partner.birthDateSolar, birthTime: dto.partner.birthTime, gender: dto.partner.gender, mbti: dto.partner.mbti, bloodType: dto.partner.bloodType }
    : { nickname: dto.partnerNickname, birthDate: '', birthTime: null, gender: 'female', mbti: 'ENFP', bloodType: 'A' },
  createdAt: dto.createdAt,
});

/** 저장된 상대(궁합 기록) 목록 캐시 */
export const compatKeys = { list: ['compat-list'] as const };

export const compatApi = {
  async create(userId: string, partner: PartnerInput & { calendarType?: 'solar' | 'lunar'; isLeapMonth?: boolean; mbtiUnknown?: boolean }) {
    const dto = await call<CompatibilityDto>(api.POST('/v1/compatibilities', {
      body: {
        nickname: partner.nickname,
        calendarType: partner.calendarType ?? 'solar',
        birthDate: partner.birthDate,
        isLeapMonth: partner.isLeapMonth ?? false,
        birthTime: partner.birthTime,
        gender: partner.gender,
        mbti: partner.mbtiUnknown ? null : partner.mbti,
        bloodType: partner.bloodType,
      } as never,
    }));
    return toResult(userId, dto);
  },

  async list(userId: string): Promise<CompatibilityResult[]> {
    const data = await call<{ list: CompatibilityDto[] }>(api.GET('/v1/compatibilities'));
    return data.list.map(dto => toResult(userId, dto));
  },

  async remove(id: number): Promise<void> {
    await call(api.DELETE('/v1/compatibilities/{id}', { params: { path: { id } } }));
  },

  /** Public: who invited (no login). */
  async previewInvite(token: string): Promise<{ inviterNickname: string; expiresAt: string }> {
    return call(api.GET('/v1/compatibility-invites/{token}', { params: { path: { token } } }));
  },

  /** My compatibility with the inviter, saved in my history. */
  async acceptInvite(userId: string, token: string): Promise<CompatibilityResult> {
    const dto = await call<CompatibilityDto>(api.POST('/v1/compatibility-invites/{token}/compatibilities', { params: { path: { token } } }));
    return toResult(userId, dto);
  },
};
