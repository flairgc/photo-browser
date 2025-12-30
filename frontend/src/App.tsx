import { Fragment, useEffect, useState } from 'react';

import { PhotoViewer } from '@/components/PhotoViewer/PhotoViewer.tsx';
import { /*downloadTestZip,*/ fetchDir } from '@/services/common.api.ts';
import type { DirItem, DirResponse } from '@/types/api.ts';
import { DirStructureGrid } from '@/components/DirStructureGrid/DirStructureGrid.tsx';
// import { navigate, usePathname } from '@/lib/navigation/navigation.ts';
import type { DirItemWithIndex } from '@/types/fs.ts';
import HomeIcon from '@/assets/home.svg?react';
import ImageIcon from '@/assets/image.svg?react';
import styles from './App.module.css';
import { useLocation, useSearchParams } from 'wouter';


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

const previewIndexName = 'previewIndex';

export function App() {

  const [currentPath, navigate] = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const previewIndex = searchParams.get(previewIndexName);
  const imageIndexToOpen: number | undefined = previewIndex ? Number(previewIndex) : undefined;
  const setImageIndexToOpen = (newIndex: number | undefined ) => {

    const currentPreviewIndex = searchParams.get(previewIndexName);

    if (currentPreviewIndex === null && newIndex === undefined) return;
    if (currentPreviewIndex === String(newIndex)) return;

    setSearchParams((prev) => {

      if (newIndex === undefined) {
        prev.delete(previewIndexName);
      } else {
        prev.set(previewIndexName, String(newIndex));
      }
      return prev;
    });
  }

  const [currentDir, setCurrentDir] = useState<DirResponse>();
  // const [imageIndexToOpen, setImageIndexToOpen] = useState<number | undefined>();

  const [errorMessage, setErrorMessage] = useState('');

  // filter
  const [isOnlyImages, setIsOnlyImages] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    fetchDir(
      currentPath.replace(/^\//, ''),
      isOnlyImages,
      controller.signal,
    )
      .then((data) => {
        setCurrentDir(data);
      })
      .catch((error) => {
        // axios при abort кидает специальную ошибку — её игнорируем
        if (error.name === 'CanceledError') return;

        setErrorMessage(
          error?.response?.data?.message ||
          `Error fetchDir ${currentPath}`,
        );
      });

    return () => {
      controller.abort();
    };
  }, [currentPath, isOnlyImages]);


  const { directories, rest } = splitAndSort(currentDir?.content || []);
  const sortedItems = [...directories, ...rest];

  const images = rest.filter(i => i.type === 'image');

  const switchPhotoFullSize = (name: string) => {
    setCurrentDir((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        content: prev.content.map((item) =>
          item.name === name
            ? { ...item, fullSize: true }
            : item
        ),
      };
    });
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header className={styles.header}>
        <button className={styles.btn} title="Домой" onClick={() => navigate('/')}>
          <HomeIcon />
        </button>

        <nav className={styles.breadcrumbs}>
          <span className={styles.anchor} onClick={() => navigate('/')}>Главная</span>
          {currentDir?.breadcrumbs.map((item) => {
            return (
              <Fragment key={item.path}>
                <span className={styles.breadcrumbsSlash}>/</span>
                <span className={styles.anchor} onClick={() => navigate(item.path)}>{item.name}</span>
              </Fragment>
          )
          })}
        </nav>

        <div>
          {/*<button onClick={downloadTestZip}>*/}
          {/*  Скачать ZIP*/}
          {/*</button>*/}
          <button className={styles.btn} style={{backgroundColor: isOnlyImages ? '#E5E7EB' : undefined}} title="Только изображения" onClick={() => setIsOnlyImages((f) => !f)}>
            <ImageIcon />
          </button>
        </div>
      </header>

      <main className={styles.container}>
        {errorMessage && <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>{errorMessage}</div>}

         <DirStructureGrid items={sortedItems} setImageIndexToOpen={setImageIndexToOpen}/>


      </main>

      <PhotoViewer
        images={images}
        imageIndexToOpen={imageIndexToOpen}
        setImageIndexToOpen={setImageIndexToOpen}
        switchPhotoFullSize={switchPhotoFullSize}
      />

    </div>
  );
}
