import { useRef, type PointerEvent } from 'react';
import type { RenderSlideContainerProps } from 'yet-another-react-lightbox';

const CLICK_DELAY = 300; // тут, возможно, стоит увеличить до 500, т.к. в библитеке задаржка дабл тача 300 а клика 500
const MOVE_THRESHOLD = 5; // px

export const SlideContainer = ({ children, toggleUI }: RenderSlideContainerProps & {toggleUI: () => void}) => {
  let startX = 0;
  let startY = 0;
  let isDragging = false;

  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePointerDown = (e: PointerEvent) => {
    startX = e.clientX;
    startY = e.clientY;
    isDragging = false;
  };

  const handlePointerMove = (e: PointerEvent) => {
    const dx = Math.abs(e.clientX - startX);
    const dy = Math.abs(e.clientY - startY);

    if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
      isDragging = true;
    }
  };

  const handlePointerUp = () => {
    if (isDragging) return;

    // если уже есть таймер → это double click
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      return;
    }

    clickTimeoutRef.current = window.setTimeout(() => {
      // setIsControlUIHidden(f => !f);
      toggleUI()
      clickTimeoutRef.current = null;
    }, CLICK_DELAY);
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {children}
    </div>
  );
}
