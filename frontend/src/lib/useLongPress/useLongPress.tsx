import { useRef } from 'react';


const longPressTimeout = 300;

export function useLongPress(onLongPress: () => void) {
  const timerRef = useRef<number | null>(null);
  const longPressTriggered = useRef(false);

  const onTouchStart = () => {
    longPressTriggered.current = false;
    timerRef.current = window.setTimeout(() => {
      longPressTriggered.current = true;
      onLongPress();
    }, longPressTimeout);
  };

  const clear = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const onTouchEnd = () => clear();
  const onTouchMove = () => clear();
  const onTouchCancel = () => clear();

  const shouldIgnoreClick = () => longPressTriggered.current;

  return {
    onTouchStart,
    onTouchEnd,
    onTouchMove,
    onTouchCancel,
    shouldIgnoreClick,
  };
}
