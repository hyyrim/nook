type Listener = () => void;
const listeners: Record<string, Set<Listener>> = {};

export function on(event: string, listener: Listener) {
  if (!listeners[event]) listeners[event] = new Set();
  listeners[event].add(listener);
  return () => { listeners[event].delete(listener); };
}

export function emit(event: string) {
  listeners[event]?.forEach(fn => fn());
}

// 비동기 AI 분류가 진행 중인 콘텐츠 ID 추적.
// 화면에서 "분류 중" 뱃지를 표시하고 완료 시 자동 갱신하기 위해 사용.
const classifyingIds = new Set<string>();

export function markClassifying(id: string) {
  classifyingIds.add(id);
}

export function markClassified(id: string) {
  classifyingIds.delete(id);
}

export function isClassifying(id: string) {
  return classifyingIds.has(id);
}
