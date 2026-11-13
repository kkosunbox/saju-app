/**
 * 프로필 요청 링크 — 링크(/p/{token})를 받은 사람이 정보를 넣으면 내 프로필 목록에 추가된다.
 * 링크에는 서버가 발급한 무작위 토큰만 담는다. 한 번만 쓸 수 있고 30일 동안 열린다.
 */
import { api, call } from '../../api/client';
import { ProfileRelationship, RELATIONSHIP_LABEL, User } from '../../types';
import { appUrl, shareLink } from '../share/linkShare';
import { ProfileInput, toUser } from './profileApi';

export interface ProfileRequest {
  id: number;
  token: string;
  relationship: ProfileRelationship;
  nickname: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface ProfileRequestPreview {
  requesterNickname: string;
  relationship: ProfileRelationship;
  nickname: string | null;
  expiresAt: string;
}

export const requestUrl = (token: string) => `${appUrl()}/p/${token}`;
export const profileRequestKeys = { open: ['profile-requests'] as const };

export const profileRequestApi = {
  create: (relationship: ProfileRelationship, nickname?: string | null) =>
    call<ProfileRequest>(api.POST('/v1/profile-requests', { body: { relationship, nickname: nickname || undefined } })),

  /** 아직 답이 없는 내 링크 */
  async listOpen(): Promise<ProfileRequest[]> {
    return (await call<{ list: ProfileRequest[] }>(api.GET('/v1/profile-requests'))).list;
  },

  revoke: (id: number) => call(api.DELETE('/v1/profile-requests/{id}', { params: { path: { id } } })),

  /** 링크를 연 사람에게 보여 줄 요청 (로그인 불필요) */
  preview: (token: string) =>
    call<ProfileRequestPreview>(api.GET('/v1/profile-requests/by-token/{token}', { params: { path: { token } } })),

  /** 정보를 보낸다. 내 프로필이 없었으면 같은 정보로 내 프로필도 생긴다 */
  async answer(accountId: number, token: string, input: ProfileInput): Promise<{ requesterNickname: string; profile: User; createdOwn: boolean }> {
    const body = { ...input, isLeapMonth: input.isLeapMonth ?? false, useYajasi: input.useYajasi ?? false, interests: input.interests ?? [] };
    const r = await call<{ requesterNickname: string; profile: Parameters<typeof toUser>[1]; createdOwn: boolean }>(
      api.POST('/v1/profile-requests/by-token/{token}/answer', { params: { path: { token } }, body: body as never }),
    );
    return { requesterNickname: r.requesterNickname, profile: toUser(accountId, r.profile), createdOwn: r.createdOwn };
  },
};

/** 요청 링크를 만들어 보낸다 */
export async function shareProfileRequest(myName: string, relationship: ProfileRelationship, nickname?: string | null): Promise<'shared' | 'copied' | 'cancelled' | 'failed'> {
  const request = await profileRequestApi.create(relationship, nickname).catch(() => null);
  if (!request) return 'failed';
  const who = nickname ? `${nickname}님, ` : '';
  return shareLink(
    `${who}${myName}님이 ${RELATIONSHIP_LABEL[relationship] === '기타' ? '' : `(${RELATIONSHIP_LABEL[relationship]}) `}운세를 함께 보려고 생년월일을 물어봐요.\n링크에서 입력하면 바로 전해지고, 내 운세도 볼 수 있어요.`,
    requestUrl(request.token),
  );
}
