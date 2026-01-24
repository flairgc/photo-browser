import { Fragment, useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'wouter';

import { PhotoViewer } from '@/components/PhotoViewer/PhotoViewer.tsx';
import { downloadZip, fetchDir } from '@/services/common.api.ts';
import type { BreadcrumbDto } from '@/types/api.ts';
import { DirStructureGrid } from '@/components/DirStructureGrid/DirStructureGrid.tsx';
import type { DirItem } from '@/types/fs.ts';
import HomeIcon from '@/assets/home.svg?react';
import ImageIcon from '@/assets/image.svg?react';
import SortUpIcon from '@/assets/sort-up.svg?react';
import SortDownIcon from '@/assets/sort-down.svg?react';
import styles from './App.module.css';


function splitAndSort(
  items: DirItem[],
  sort: 'ASC' | 'DESC' = 'ASC'
): {
  directories: DirItem[];
  rest: DirItem[];
} {
  // 1. Разделяем
  const directories = items.filter(i => i.type === 'directory');
  const rest = items.filter(i => i.type !== 'directory');

  // 2. Универсальный компаратор
  const sortByName = (a: DirItem, b: DirItem) => {
    const result = a.name.localeCompare(b.name, 'ru', {
      sensitivity: 'base',
    });

    return sort === 'ASC' ? result : -result;
  };

  const sortedDirs = [...directories].sort(sortByName);
  const sortedRest = [...rest].sort(sortByName);

  let imageIndex = 0;

  const restWithIndexes = sortedRest.map(item => {
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
    rest: restWithIndexes,
  };
}


const previewIndexName = 'previewIndex';

export function App() {

  const [currentPath, navigate] = useLocation();
  const [searchParams] = useSearchParams();

  const previewIndex = searchParams.get(previewIndexName);
  const imageIndexToOpen: number | undefined = previewIndex ? Number(previewIndex) : undefined;

  const setImageIndexToOpen = (newIndex?: number) => {
    const url = new URL(window.location.href);
    const hasPreviewNow = url.searchParams.has(previewIndexName);

    // ─────── ОТКРЫТИЕ ───────
    if (newIndex !== undefined && !hasPreviewNow) {
      url.searchParams.set(previewIndexName, String(newIndex));

      navigate(url.pathname + url.search); // PUSH
      return;
    }

    // ─────── ЛИСТАНИЕ / ЗАКРЫТИЕ ───────
    if (newIndex === undefined) {
      url.searchParams.delete(previewIndexName);
    } else {
      url.searchParams.set(previewIndexName, String(newIndex));
    }

    navigate(url.pathname + url.search, { replace: true });
  };

  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbDto[]>([]);
  const [dirItems, setDirItems] = useState<DirItem[]>([]);
  const selectedDirItem = dirItems.filter(({isSelected}) => isSelected);
  const isSelectMode = selectedDirItem.length > 0;

  const [errorMessage, setErrorMessage] = useState('');

  // filter
  const [isOnlyImages, setIsOnlyImages] = useState(true);

  const [sort, setSort] = useState<'ASC' | 'DESC'>('DESC');

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

        setDirItems(data.content)

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


  const { directories, rest } = splitAndSort(dirItems, sort);
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

          <div className={styles.btn_group}>
            <button className={styles.btn} title="Сортировка" onClick={() => setSort(sort => sort === 'ASC' ? 'DESC' : 'ASC')}>
              {sort === 'ASC' ? <SortDownIcon /> : <SortUpIcon />}
            </button>
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
