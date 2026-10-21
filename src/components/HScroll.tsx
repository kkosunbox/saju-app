import React, { useEffect, useRef } from 'react';
import { Platform, ScrollView, StyleProp, ViewStyle } from 'react-native';

/**
 * 가로로 넘기는 줄. 휴대폰은 손가락으로 넘기면 되지만 데스크톱 웹은 마우스로 넘길 방법이 없어서
 * 웹에서는 마우스로 잡아 끌면 넘어가게 한다. 끌다가 놓을 때는 카드가 눌리지 않는다.
 */
export default function HScroll({ children, contentContainerStyle, style }: { children: React.ReactNode; contentContainerStyle?: StyleProp<ViewStyle>; style?: StyleProp<ViewStyle> }) {
  const ref = useRef<ScrollView>(null);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const el = (ref.current as unknown as { getScrollableNode?(): HTMLElement } | null)?.getScrollableNode?.();
    if (!el) return;
    let down = false, moved = false, startX = 0, startLeft = 0;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = false; startX = e.clientX; startLeft = el.scrollLeft;
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 5) { moved = true; el.style.cursor = 'grabbing'; }
      if (moved) el.scrollLeft = startLeft - dx;
    };
    const onUp = () => { down = false; el.style.cursor = 'grab'; };
    // 끌었으면 이어지는 클릭(카드 누름)을 막는다
    const onClick = (e: MouseEvent) => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } };
    const noDrag = (e: DragEvent) => e.preventDefault();
    el.style.cursor = 'grab';
    el.style.userSelect = 'none';
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    el.addEventListener('click', onClick, true);
    el.addEventListener('dragstart', noDrag);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      el.removeEventListener('click', onClick, true);
      el.removeEventListener('dragstart', noDrag);
    };
  }, []);
  return (
    <ScrollView ref={ref} horizontal showsHorizontalScrollIndicator={false} style={style} contentContainerStyle={contentContainerStyle}>
      {children}
    </ScrollView>
  );
}
