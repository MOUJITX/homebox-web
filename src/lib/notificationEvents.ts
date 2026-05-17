const listeners = new Set<() => void>();

export const onNotificationsChanged = (fn: () => void) => {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
};

export const notifyChanged = () => {
  listeners.forEach((fn) => fn());
};
