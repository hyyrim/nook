import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

// 웹: 가로 스크롤 리스트(FlatList horizontal)는 마우스 휠(세로)로 안 움직인다.
// 세로 휠을 가로 스크롤로 변환. 리스트 끝(경계)에서는 기본 동작(페이지 세로 스크롤)을 막지 않는다.
// 네이티브에선 no-op. FlatList의 ref에 붙여 getScrollableNode()로 DOM 노드를 얻는다.
export function useHorizontalWheelScroll() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = ref.current?.getScrollableNode?.();
    if (!node || typeof node.addEventListener !== 'function') return;

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return;
      if (node.scrollWidth <= node.clientWidth) return; // 가로 오버플로 없음 → 그대로 페이지 스크롤
      const atStart = node.scrollLeft <= 0;
      const atEnd = node.scrollLeft + node.clientWidth >= node.scrollWidth - 1;
      // 경계에서 그 방향이면 페이지 세로 스크롤 허용(트랩 방지)
      if ((e.deltaY < 0 && atStart) || (e.deltaY > 0 && atEnd)) return;
      e.preventDefault();
      node.scrollLeft += e.deltaY;
    };

    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, []);

  return ref;
}
