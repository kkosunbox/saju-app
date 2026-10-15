/** Social login providers shown on the login screens. */
export type SocialProvider = 'kakao' | 'naver' | 'apple' | 'google';
export const SOCIAL_LABEL: Record<SocialProvider, string> = { kakao: '카카오', naver: '네이버', apple: 'Apple', google: 'Google' };
