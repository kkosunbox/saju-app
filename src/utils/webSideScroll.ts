import { RefObject, useEffect } from 'react';
import { Platform, type ViewInstance } from 'react-native';

const LINE_PX = 16;

/** el부터 위로 올라가며 이 방향으로 더 움직일 수 있는 세로 스크롤 영역을 찾는다 */
function scrollerFor(el: Element | null, dy: number): HTMLElement | null {
  for (let n = el as HTMLElement | null; n && n !== document.body; n = n.parentElement) {
    const { overflowY } = getComputedStyle(n);
    if (overflowY !== 'auto' && overflowY !== 'scroll') continue;
    if (n.scrollHeight <= n.clientHeight) continue;
    const room = dy > 0 ? n.scrollHeight - n.clientHeight - n.scrollTop : n.scrollTop;
    if (room > 0) return n;
  }
  return null;
}

/**
 * 웹(데스크톱): 앱은 가운데 폰 폭 기둥이라 양옆 여백에서 휠을 굴리면 아무것도 안 움직인다.
 * 여백에서 굴린 휠을 같은 높이의 가운데 화면(맨 위에 떠 있는 시트 포함)의 스크롤 영역으로 넘긴다.
 */
export function useWebSideScroll(bg: RefObject<ViewInstance | null>, frame: RefObject<ViewInstance | null>) {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const bgEl = bg.current as unknown as HTMLElement | null;
    const frameEl = frame.current as unknown as HTMLElement | null;
    if (!bgEl || !frameEl) return;
    const onWheel = (e: WheelEvent) => {
      if (frameEl.contains(e.target as Node) || e.ctrlKey) return;
      const box = frameEl.getBoundingClientRect();
      const dy = e.deltaMode === 1 ? e.deltaY * LINE_PX : e.deltaMode === 2 ? e.deltaY * box.height : e.deltaY;
      if (!dy) return;
      const target = scrollerFor(document.elementFromPoint(box.left + box.width / 2, e.clientY), dy);
      if (!target) return;
      e.preventDefault();
      target.scrollBy({ top: dy });
    };
    bgEl.addEventListener('wheel', onWheel, { passive: false });
    return () => bgEl.removeEventListener('wheel', onWheel);
  }, [bg, frame]);
}
