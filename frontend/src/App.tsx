import { useEffect, useState, useSyncExternalStore } from 'react';
import Lightbox from "yet-another-react-lightbox";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Captions from "yet-another-react-lightbox/plugins/captions";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";

import { fetchDir } from './services/common.ts';
import type { DirItem, DirResponse } from './types/api.ts';
import styles from './App.module.css';


function getCurrentPath() {
  return decodeURIComponent(
    window.location.pathname.replace(/^\/+/, '')
  );
}

function subscribe(callback: () => void) {
  window.addEventListener('popstate', callback);
  return () => window.removeEventListener('popstate', callback);
}

export function usePathname() {
  return useSyncExternalStore(
    subscribe,
    getCurrentPath
  );
}

export function navigate(path: string) {
  window.history.pushState(null, '', '/' + encodeURIComponent(path));
  window.dispatchEvent(new PopStateEvent('popstate'));
}

type DirItemWithIndex = DirItem & {
  index?: number;
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
  // const [currentPath, setCurrentPath] = useState(() => {
  //   return getPathFromLocation();
  // });
  const [currentDir, setCurrentDir] = useState<DirResponse>();
  const [imageIndexToOpen, setImageIndexToOpen] = useState<number | undefined>();

  useEffect(() => {
    fetchDir(currentPath).then((data) => {
      setCurrentDir(data);
    })
  }, [currentPath]);

  useEffect(() => {
    const urlPath = '/' + encodeURIComponent(currentPath);

    window.history.pushState(
      { path: currentPath },
      '',
      urlPath
    );
  }, [currentPath]);

  // useEffect(() => {
  //   const onPopState = () => {
  //     setCurrentPath(getPathFromLocation());
  //   };
  //
  //   window.addEventListener('popstate', onPopState);
  //
  //   return () => {
  //     window.removeEventListener('popstate', onPopState);
  //   };
  // }, []);

  const { directories, rest } = splitAndSort(currentDir?.content || []);
  const sortedItems = [...directories, ...rest];

  console.log('sortedItems', sortedItems)

  const images = rest.filter(i => i.type === 'image');

  return (
    <>
      <header className={styles.header}>
        <button className={styles.homeBtn} title="Домой" onClick={() => navigate('')}>
          <svg viewBox="0 0 24 24">
            <path d="M12 3l9 8h-3v9h-5v-6H11v6H6v-9H3z"/>
          </svg>
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
      </header>

      <main className={styles.container}>
        <div className={styles.grid}>

          {sortedItems.map((item) => (
            <div
              key={item.name}
              className={`${styles.item} ${item.type === 'directory' ? styles.folder : item.type === 'image' ? styles.image : styles.file}`}
              onClick={() => {
                if (item.type === 'directory') navigate(item.path);
                if (item.type === 'image') setImageIndexToOpen(item.index);
              }}
            >
              {item.type === 'image' ? (
                <img
                  className={styles.preview}
                  src={`api/image/preview?path=${item.path}`}
                />
              ) : (
                <div className="icon">
                  {item.type === 'directory' ? (
                    <svg viewBox="0 0 24 24" fill="#fbbf24">
                      <path d="M10 4l2 2h8a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h6z"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="#60a5fa">
                      <path d="M6 2h9l5 5v15a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z"/>
                    </svg>
                  )}

                </div>
              )}
              <div className={styles.name}>{item.name}</div>
            </div>
          ))}

        </div>
      </main>

      <Lightbox
        open={imageIndexToOpen !== undefined}
        close={() => setImageIndexToOpen(undefined)}
        index={imageIndexToOpen}
        slides={images.map((item) => ({
          src: `api/image/view?path=${item.path}`,
          title: item.name,
        }))}
        carousel={{
          finite: true,
          preload: 1,
        }}
        controller={{ closeOnPullDown: true, closeOnBackdropClick: true }}
        animation={{ fade: 100, swipe: 150 }}
        plugins={[Fullscreen, Zoom, Captions]}
      />

    </>
  );
}
