import { fetchExif } from '@/services/common.api.ts';
import { Loader } from '@/components/Loader/Loader';
import styles from './PhotoViewer.module.css';
import { useEffect, useState } from 'react';
import { createModule, MODULE_TOOLBAR, type PluginProps, useLightboxState } from 'yet-another-react-lightbox';

const TOOLBAR_HEIGHT = 62;

function ExifContent({ filePath }: { filePath: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [exif, setExif] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetchExif(filePath, controller.signal).then((exif) => {
      if (!controller.signal.aborted) setExif(exif);
    }).catch(() => {
      if (!controller.signal.aborted) setExif('');
    }).finally(() => {
      if (!controller.signal.aborted) setIsLoading(false);
    });
    return () => controller.abort();
  }, [filePath]);

  return (
    <div className={styles.exifPanel} style={{
      position: 'absolute',
      top: TOOLBAR_HEIGHT,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      color: 'white',
      padding: 16,
      textAlign: 'right',
      fontFamily: 'monospace',
    }}>
      {isLoading ? (
        <Loader label="Загрузка EXIF…" />
      ) : (
        exif
          ? <span style={{whiteSpace: 'pre-line'}}>{exif}</span>
          : <span>Отсутствует или не удалось загрузить Exif</span>
      )}
    </div>
  );
}

function ExifInfo({ showExif, hideUI }: { showExif?: boolean; hideUI?: boolean }) {
  const { currentSlide } = useLightboxState();
  const filePath = currentSlide?.filePath;
  return showExif && !hideUI && filePath ? <ExifContent key={filePath} filePath={filePath} /> : null;
}

const ExifModule = createModule("ExifModule", ExifInfo);

export function ExifPlugin({addSibling}: PluginProps) {
  addSibling(MODULE_TOOLBAR, ExifModule, false);
}
