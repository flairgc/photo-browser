import { fetchExif } from '@/services/common.api.ts';
import { useEffect, useState } from 'react';
import { createModule, MODULE_TOOLBAR, type PluginProps, useLightboxState } from 'yet-another-react-lightbox';

const TOOLBAR_HEIGHT = 62;

function ExifInfo({showExif, hideUI}: any) {

  const show = showExif && !hideUI;

  const [isLoading, setIsLoading] = useState(false);
  const [exif, setExif] = useState('');

  const {currentSlide} = useLightboxState();

  const filePath = currentSlide?.filePath;

  useEffect(() => {
    if (!show || !filePath) return;
    setIsLoading(true);
    fetchExif(filePath).then((exif) => {
      setExif(exif);
    }).finally(() => {
      setIsLoading(false);
    });
  }, [filePath, show]);

  return show ? (
    <div style={{
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
        <span> Загрузка exif...</span>
      ) : (
        exif
          ? <span style={{whiteSpace: 'pre-line'}}>{exif}</span>
          : <span>Отсутствует или не удалось загрузить Exif</span>
      )}
    </div>
  ) : null;
}

const ExifModule = createModule("ExifModule", ExifInfo);

export function ExifPlugin({addSibling}: PluginProps) {
  addSibling(MODULE_TOOLBAR, ExifModule, false);
}
