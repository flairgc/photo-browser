export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export const getDeviceType = (): DeviceType => {
  if (typeof window === 'undefined') return 'desktop';

  const width = window.innerWidth;

  const isTouch =
    window.matchMedia('(pointer: coarse)').matches ||
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0;

  if (isTouch) {
    if (width <= 768) return 'mobile';
    if (width <= 1024) return 'tablet';
    return 'desktop'; // например iPad Pro в landscape
  }

  return 'desktop';
};

export const deviceType = getDeviceType();

console.log('deviceType', deviceType);
