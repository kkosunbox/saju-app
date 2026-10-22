/** 1:1 문의 — 카테고리와 내용을 서버에 남긴다. */
import { api, call } from '../../api/client';
import type { components } from '../../api/schema';

export type InquiryCategory = components['schemas']['CreateInquiryRequest']['category'];

/** 문의하기 화면에 보이는 순서 */
export const INQUIRY_CATEGORIES: { key: InquiryCategory; label: string }[] = [
  { key: 'account', label: '계정·로그인' },
  { key: 'payment', label: '결제·알' },
  { key: 'content', label: '운세·콘텐츠' },
  { key: 'bug', label: '오류 신고' },
  { key: 'suggestion', label: '제안하기' },
  { key: 'etc', label: '기타' },
];

/** 서버가 받는 내용 최대 길이 */
export const INQUIRY_MAX = 1000;

export const inquiryApi = {
  create: (category: InquiryCategory, content: string) =>
    call(api.POST('/v1/inquiries', { body: { category, content } })),
};
