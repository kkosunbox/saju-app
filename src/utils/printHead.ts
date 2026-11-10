/**
 * 웹 인쇄 · PDF: 섹션 제목이 쪽 맨 아래에 혼자 남지 않게 표시한다.
 * View에 펼쳐 넣으면 웹에서 data-print-head가 붙고, 공유 화면의 인쇄 CSS가 제목 뒤에서 쪽을 나누지 않게 한다.
 */
export const PRINT_HEAD = { dataSet: { printHead: '1' } } as object;
