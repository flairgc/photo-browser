
import { useEffect, useState } from 'react';
import { fetchDir } from './services/common.ts';
import type { DirItem, DirResponse } from './types/api.ts';
import styles from './App.module.css';



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

  const [currentDir, setCurrentDir] = useState<DirResponse>();

  useEffect(() => {
    fetchDir('').then((data) => {
      setCurrentDir(data);
    })
  }, []);

  const { directories, rest } = splitAndSort(currentDir?.content || []);
  const sortedItems = [...directories, ...rest];

  console.log('sortedItems', sortedItems)

    return (
      <>
        <header className={styles.header}>
          <button className={styles.homeBtn} title="Домой">
            <svg viewBox="0 0 24 24">
              <path d="M12 3l9 8h-3v9h-5v-6H11v6H6v-9H3z"/>
            </svg>
          </button>

          <nav className={styles.breadcrumbs}>
            <a href="#">Root</a>
            <span>/</span>
            <a href="#">Photos</a>
            <span>/</span>
            <a href="#">2025</a>
          </nav>
        </header>

        <main className={styles.container}>
          <div className={styles.grid}>

            {sortedItems.map((item) => (
              <div className={`${styles.item} ${item.type === 'directory' ? styles.folder : item.type === 'image' ? styles.image : styles.file }`}>
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
      </>
    );
}
