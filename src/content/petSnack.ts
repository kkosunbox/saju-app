/**
 * 반려동물 궁합 화면(입력 · 미리보기 · 결과) 아래에 붙는 간식 서비스 광고 배너 (Figma 362:1286).
 * null이면 배너를 그리지 않는다. 노출·클릭은 promo_event에 screen 'pet', item 'snack'으로 남는다.
 */
export interface PetSnackBanner {
  title: string;
  desc: string;
  /** 밑줄 링크 문구 (끝의 ↗ 는 그대로 둔다) */
  cta: string;
  /** 누르면 여는 주소 (https) */
  url: string;
}

export const PET_SNACK: PetSnackBanner | null = {
  title: '매달 15% 할인받는 간식 구독',
  desc: '우리 아이를 위한 프리미엄 수제 간식',
  cta: '꼬순박스 구경하기 ↗',
  url: 'https://kkosunbox.com/?utm_source=woonpick&utm_medium=pet',
};
