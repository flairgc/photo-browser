import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import { createIcon, IconButton, useLightboxState, type FullscreenRef } from 'yet-another-react-lightbox';
import InfoIcon from '@/assets/info.svg?react';
import AlmazIcon from '@/assets/almaz.svg?react';
import { FullSizeIcon } from './svg-lib';
import styles from './PhotoViewer.module.css';

const MoreIcon = createIcon('More', <>
  <circle cx="12" cy="5" r="2" />
  <circle cx="12" cy="12" r="2" />
  <circle cx="12" cy="19" r="2" />
</>);

const DownloadIcon = createIcon('Download',
  <path d="M18 15v3H6v-3H4v3c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-3h-2zm-1-4-1.41-1.41L13 12.17V4h-2v8.17L8.41 9.59 7 11l5 5 5-5z" />
);

const FullscreenIcon = createIcon('Fullscreen',
  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
);

export function PhotoActionsMenu({ onToggleInfo, makeFullSize, fullscreenRef }: {
  onToggleInfo: () => void;
  makeFullSize: (name: string) => void;
  fullscreenRef: RefObject<FullscreenRef | null>;
}) {
  const { currentSlide } = useLightboxState();
  const [isOpen, setIsOpen] = useState(false);
  const [fullscreenStatus, setFullscreenStatus] = useState({ fullscreen: false, disabled: true });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    wrapperRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [isOpen]);

  const closeMenu = () => {
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isOpen) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeMenu();
    } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();
      const items = Array.from(wrapperRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)') ?? []);
      const index = items.indexOf(document.activeElement as HTMLElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
        : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items[next]?.focus();
    }
  };

  const download = currentSlide?.download;
  const downloadUrl = typeof download === 'string' ? download
    : typeof download === 'object' ? download.url : undefined;

  return (
    <div ref={wrapperRef} className={styles.actionsMenuWrapper} onKeyDown={onKeyDown}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false);
      }}>
      <IconButton ref={triggerRef} label="Ещё" icon={MoreIcon}
        aria-haspopup="menu" aria-expanded={isOpen} onClick={() => {
          const fullscreen = fullscreenRef.current;
          setFullscreenStatus({ fullscreen: fullscreen?.fullscreen ?? false, disabled: fullscreen?.disabled ?? true });
          setIsOpen(open => !open);
        }} />
      {isOpen && (
        <div role="menu" aria-label="Действия с фотографией" className={styles.actionsMenu}>
          <button role="menuitem" disabled={fullscreenStatus.disabled}
            onClick={() => {
              const fullscreen = fullscreenRef.current;
              if (fullscreen) (fullscreen.fullscreen ? fullscreen.exit : fullscreen.enter)();
              closeMenu();
            }}>
            <FullscreenIcon /> {fullscreenStatus.fullscreen ? 'Выйти из полного экрана' : 'На весь экран'}
          </button>
          {downloadUrl && <a role="menuitem" href={downloadUrl} download={currentSlide?.name} onClick={closeMenu}>
            <DownloadIcon /> Скачать фото
          </a>}
          {currentSlide?.rawUrl && <a role="menuitem" href={currentSlide.rawUrl} download onClick={closeMenu}>
            <AlmazIcon /> Скачать RAW
          </a>}
          {currentSlide?.filePath && <button role="menuitem" onClick={() => { onToggleInfo(); closeMenu(); }}>
            <InfoIcon /> Информация EXIF
          </button>}
          <button role="menuitem" disabled={!currentSlide?.name || currentSlide.fullSize}
            onClick={() => { if (currentSlide?.name) makeFullSize(currentSlide.name); closeMenu(); }}>
            <FullSizeIcon /> Полное разрешение
          </button>
        </div>
      )}
    </div>
  );
}
