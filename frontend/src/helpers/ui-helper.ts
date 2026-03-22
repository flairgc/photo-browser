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

function getScrollbarWidth() {
  const div = document.createElement('div');
  div.style.overflow = 'scroll';
  div.style.width = '100px';
  div.style.height = '100px';
  div.style.position = 'absolute';
  div.style.top = '-9999px';

  document.body.appendChild(div);

  const scrollbarWidth = div.offsetWidth - div.clientWidth;

  document.body.removeChild(div);

  return scrollbarWidth;
}

export const deviceType = getDeviceType();
export const scrollbarWidth = getScrollbarWidth();

