import { Fragment, useEffect, useState } from 'react';

import { PhotoViewer } from '@/components/PhotoViewer/PhotoViewer.tsx';
import { downloadZip, fetchDir } from '@/services/common.api.ts';
import type { BreadcrumbDto, DirItemDto } from '@/types/api.ts';
import { DirStructureGrid } from '@/components/DirStructureGrid/DirStructureGrid.tsx';
// import { navigate, usePathname } from '@/lib/navigation/navigation.ts';
import type { DirItem } from '@/types/fs.ts';
import HomeIcon from '@/assets/home.svg?react';
import ImageIcon from '@/assets/image.svg?react';
import styles from './App.module.css';
import { useLocation, useSearchParams } from 'wouter';


function splitAndSort(items: DirItem[]): {
  directories: DirItem[];
  rest: DirItem[];
} {
  // 1. Разделяем
  const directories = items.filter(i => i.type === 'directory');
  const rest = items.filter(i => i.type !== 'directory');

  // 2. Сортируем по имени (немутирующе)
  const sortByName = (a: DirItemDto, b: DirItemDto) =>
    a.name.localeCompare(b.name, 'ru', { sensitivity: 'base' });

  const sortedDirs = [...directories].sort(sortByName);
  const sortedRest = [...rest].sort(sortByName);

  return {
    directories: sortedDirs.map(d => ({ ...d, index: undefined })),
    rest: sortedRest,
  };
}

const previewIndexName = 'previewIndex';

export function App() {

  const [currentPath, navigate] = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const previewIndex = searchParams.get(previewIndexName);
  const imageIndexToOpen: number | undefined = previewIndex ? Number(previewIndex) : undefined;
  const setImageIndexToOpen = (newIndex: number) => {

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

  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbDto[]>([]);
  const [dirItems, setDirItems] = useState<DirItem[]>([]);
  const selectedDirItem = dirItems.filter(({isSelected}) => isSelected);
  const isSelectMode = selectedDirItem.length > 0;

  const [errorMessage, setErrorMessage] = useState('');

  // filter
  const [isOnlyImages, setIsOnlyImages] = useState(true);

  const [isDonwloadingZip, setIsDonwloadingZip] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetchDir(
      currentPath.replace(/^\//, ''),
      isOnlyImages,
      controller.signal,
    )
      .then((data) => {

        setBreadcrumbs(data.breadcrumbs)

        let imageIndex = 0;

        const itemsIndexed: DirItem[] = data.content.map(item => {
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
        setDirItems(itemsIndexed)

        // setCurrentDir(data);
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


  const { directories, rest } = splitAndSort(dirItems);
  const sortedItems = [...directories, ...rest];

  const images = rest.filter(i => i.type === 'image');

  const switchPhotoFullSize = (name: string) => {
    setDirItems((prev) => {
      if (!prev) return prev;

      return prev.map((item) =>
          item.name === name
            ? { ...item, fullSize: true }
            : item
        )
    });
  };

  const selectItem = (name: string, flag?: boolean) => {
    setDirItems((prev) => {
      if (!prev) return prev;

      return prev.map((item) =>
        item.name === name
          ? { ...item, isSelected: flag === undefined ? !item.isSelected : flag }
          : item
      )
    });
  };

  const changeSelectAllItems = (flag: boolean) => {
    setDirItems((prev) => {
      if (!prev) return prev;

      return prev.map((item) => ({ ...item, isSelected: flag })
      )
    });
  };

  const selectAllItems = () => changeSelectAllItems(true);
  const deselectItems = () => changeSelectAllItems(false);

  const handleDownloadZip = (raw?: boolean) => {
    setIsDonwloadingZip(true);
    downloadZip(selectedDirItem.map((item) => item.path), {raw});
    setTimeout(() => setIsDonwloadingZip(false), 1000);
  }


  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header className={styles.header}>
        <div className={styles.wrapper}>
          <button className={styles.btn} title="Домой" onClick={() => navigate('/')}>
            <HomeIcon />
          </button>

          <nav className={styles.breadcrumbs}>
            <span className={styles.anchor} onClick={() => navigate('/')}>Главная</span>
            {breadcrumbs.map((item) => {
              return (
                <Fragment key={item.path}>
                  <span className={styles.breadcrumbsSlash}>/</span>
                  <span className={styles.anchor} onClick={() => navigate('/' + item.path)}>{item.name}</span>
                </Fragment>
            )
            })}
          </nav>

          <div>
            <button className={styles.btn} style={{backgroundColor: isOnlyImages ? '#E5E7EB' : undefined}} title="Только изображения" onClick={() => setIsOnlyImages((f) => !f)}>
              <ImageIcon />
            </button>
          </div>
        </div>
        {selectedDirItem.length > 0 ?
          <div className={styles.selectPanelWrapper}>
            <div className={styles.selectPanel}>
              <div className={styles.selectPanelTitle}>Выбрано фото: {selectedDirItem.length}</div>
              <div className={styles.selectPanelButtons}>
                <button onClick={selectAllItems}>Выделить всё</button>
                <button onClick={deselectItems}>X Снять выделение</button>
                <button onClick={() => handleDownloadZip()} disabled={isDonwloadingZip}>Скачать</button>
                <button onClick={() => handleDownloadZip(true)} disabled={isDonwloadingZip}>Скачать RAW</button>
              </div>
            </div>
          </div>
          : null
        }
      </header>

      <main className={styles.container}>
        {errorMessage && <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>{errorMessage}</div>}

         <DirStructureGrid
           items={sortedItems}
           setImageIndexToOpen={setImageIndexToOpen}
           selectItem={selectItem}
           isSelectMode={isSelectMode}
         />

      </main>

      <PhotoViewer
        images={images}
        imageIndexToOpen={imageIndexToOpen}
        setImageIndexToOpen={setImageIndexToOpen}
        switchPhotoFullSize={switchPhotoFullSize}
        selectItem={selectItem}
      />

    </div>
  );
}
