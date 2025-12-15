import { useEffect, useState } from 'react';
import {
  Lightbox,
  IconButton,
  // createIcon,
  useLightboxState,
} from "yet-another-react-lightbox";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Download from "yet-another-react-lightbox/plugins/download";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";

import { fetchDir } from './services/common.api.ts';
import type { DirItem, DirResponse } from './types/api.ts';
import { DirStructureGrid } from './components/DirStructureGrid/DirStructureGrid.tsx';
import { navigate, usePathname } from './lib/navigation/navigation.ts';
import type { DirItemWithIndex } from './types/fs.ts';
import HomeIcon from './assets/home.svg?react';
import ImageIcon from './assets/image.svg?react';
import AlmazIcon from './assets/almaz.svg?react';
import EyeIcon from './assets/eye.svg?react';
import InfoIcon from './assets/info.svg?react';

import styles from './App.module.css';


declare module "yet-another-react-lightbox" {
  interface Labels {
    "Raw button"?: string;
    "Open file button"?: string;
    "Info button"?: string;
  }
  interface SlideImage {
    rawUrl: string | null;
    exifText: string | null;
    previewUrl: string | null;
  }
}

const DownloadRawButton = () => {
  const { currentSlide } = useLightboxState();

  const rawUrl = currentSlide?.rawUrl;

  // todo допилить если download это объект
  if (!rawUrl) return null;

  const handleClick = () => {
    const a = document.createElement('a');
    a.href = rawUrl;
    a.target = '_blank';      // 👈 ключевой момент
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <IconButton
      label="Raw button"
      icon={AlmazIcon}
      disabled={!currentSlide}
      onClick={handleClick}
    />
  );
};

const OpenPreviwButton = () => {
  const { currentSlide } = useLightboxState();


  const previewUrl = currentSlide?.previewUrl;

  // todo допилить если download это объект
  if (!previewUrl) return null;

  const handleClick = () => {
    window.open(previewUrl, '_blank');

    // const a = document.createElement('a');
    // a.href = previewUrl;
    // a.target = '_blank';      // 👈 ключевой момент
    // a.rel = 'noopener';
    // document.body.appendChild(a);
    // a.click();
    // document.body.removeChild(a);
  }

  return (
    <IconButton
      label="Open file button"
      icon={EyeIcon}
      disabled={!currentSlide}
      onClick={handleClick}
    />
  );
};

const InfoButton = () => {
  const { currentSlide } = useLightboxState();

  const exifText = currentSlide?.exifText;

  if (!exifText) return null;

  const handleClick = () => {
    alert(exifText);
  }

  return (
    <IconButton
      label="Info button"
      icon={InfoIcon}
      disabled={!currentSlide}
      onClick={handleClick}
    />
  );
};


function splitAndSort(items: DirItem[]): {
  directories: DirItemWithIndex[];
  rest: DirItemWithIndex[];
} {
  // 1. Разделяем
  const directories = items.filter(i => i.type === 'directory');
  const rest = items.filter(i => i.type !== 'directory');

  // 2. Сортируем по имени (немутирующе)
  const sortByName = (a: DirItem, b: DirItem) =>
    a.name.localeCompare(b.name, 'ru', { sensitivity: 'base' });

  const sortedDirs = [...directories].sort(sortByName);
  const sortedRest = [...rest].sort(sortByName);

  // 3. Добавляем index только изображениям
  let imageIndex = 0;

  const restWithIndex: DirItemWithIndex[] = sortedRest.map(item => {
    if (item.type === 'image') {
      return {
        ...item,
        index: imageIndex++,
      };
    }

    return {
      ...item,
      index: undefined,
    };
  });

  return {
    directories: sortedDirs.map(d => ({ ...d, index: undefined })),
    rest: restWithIndex,
  };
}


export function App() {

  const currentPath = usePathname();
  const [currentDir, setCurrentDir] = useState<DirResponse>();
  const [imageIndexToOpen, setImageIndexToOpen] = useState<number | undefined>();

  const [errorMessage, setErrorMessage] = useState('');

  // filter
  const [isOnlyImages, setIsOnlyImages] = useState(true);

  useEffect(() => {
    fetchDir(currentPath, isOnlyImages).then((data) => {
      setCurrentDir(data);
    }).catch(error => {
      setErrorMessage(error?.response?.data?.message || `Error fetchDir ${currentPath}`);
    })
  }, [currentPath, isOnlyImages]);

  useEffect(() => {
    const urlPath = '/' + encodeURIComponent(currentPath);

    window.history.pushState(
      { path: currentPath },
      '',
      urlPath
    );
  }, [currentPath]);

  const { directories, rest } = splitAndSort(currentDir?.content || []);
  const sortedItems = [...directories, ...rest];

  const images = rest.filter(i => i.type === 'image');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header className={styles.header}>
        <button className={styles.btn} title="Домой" onClick={() => navigate('')}>
          <HomeIcon />
        </button>

        <nav className={styles.breadcrumbs}>
          <span className={styles.anchor} onClick={() => navigate('')}>Главная</span>
          {currentDir?.breadcrumbs.map((item) => {
            return (
              <>
                <span className={styles.breadcrumbsSlash}>/</span>
                <span className={styles.anchor} onClick={() => navigate(item.path)}>{item.name}</span>
              </>
          )
          })}
        </nav>

        <div>
          <button className={styles.btn} style={{backgroundColor: isOnlyImages ? '#E5E7EB' : undefined}} title="Только изображения" onClick={() => setIsOnlyImages((f) => !f)}>
            <ImageIcon />
          </button>
        </div>
      </header>

      <main className={styles.container}>
        {errorMessage && <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>{errorMessage}</div>}

         <DirStructureGrid items={sortedItems} setImageIndexToOpen={setImageIndexToOpen}/>


      </main>

      <Lightbox
        open={imageIndexToOpen !== undefined}
        close={() => setImageIndexToOpen(undefined)}
        index={imageIndexToOpen}
        slides={images.map((item) => ({
          src: `api/image/preview?path=${item.path}&size=big`,
          title: item.name,
          download: `api/image/file?path=${item.path}`,
          rawUrl: item.rawPath ? `/api/image/file?path=${encodeURIComponent(item.rawPath)}` : null,
          exifText: item.exifText,
          previewUrl: `api/image/file?path=${item.path}&preview`,
        }))}
        carousel={{
          finite: true,
          preload: 2,
        }}
        controller={{ closeOnPullDown: true, closeOnBackdropClick: true }}
        animation={{ fade: 100, swipe: 150 }}
        toolbar={{
          buttons: [ <InfoButton key="open-preview-button" />, <OpenPreviwButton key="open-preview-button" />, <DownloadRawButton key="raw-button" />, "close"],
        }}
        plugins={[Fullscreen, Zoom, Captions, Download]}
      />

    </div>
  );
}
