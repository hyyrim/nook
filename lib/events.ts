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
