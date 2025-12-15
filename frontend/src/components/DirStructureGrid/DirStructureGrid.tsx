import { VirtuosoGrid, type GridComponents } from 'react-virtuoso';
import {
  forwardRef,
  type CSSProperties,
  type HTMLAttributes,
  type PropsWithChildren,
  type Ref, type Dispatch,
} from 'react';
import type { DirItemWithIndex } from '../../types/fs.ts';
import { navigate } from '../../lib/navigation/navigation.ts';

import styles from './DirStructureGrid.module.css';
import { ParentSize } from '../../lib/parent-size/ParentSize.tsx';


type GridDivProps = PropsWithChildren<{
  style?: CSSProperties;
}> &
  HTMLAttributes<HTMLDivElement>;


const gridComponents: GridComponents = {
  List: forwardRef(function GridList(
    { style, children, ...props }: GridDivProps,
    ref: Ref<HTMLDivElement>
  ) {
    return (
      <div
        ref={ref}
        {...props}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'flex-start',
          ...style,
        }}
      >
        {children}
      </div>
    );
  }),

  Item: function GridItem({ children, ...props }: GridDivProps) {
    return (
      <div
        {...props}
        style={{
          // padding: '0.5rem',
          width: '160px',
          padding: 5,
          display: 'flex',
          flex: 'none',
          alignContent: 'stretch',
          boxSizing: 'border-box',
        }}
      >
        {children}
      </div>
    );
  },
};

/**
 * Обёртка элемента
 */
// type ItemWrapperProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>>;
//
// const ItemWrapper = ({ children, ...props }: ItemWrapperProps) => {
//   return (
//     <div
//       {...props}
//       style={{
//         display: 'flex',
//         flex: 1,
//         textAlign: 'center',
//         padding: '1rem',
//         border: '1px solid gray',
//         whiteSpace: 'nowrap',
//       }}
//     >
//       {children}
//     </div>
//   );
// };


type Props = {
  items: DirItemWithIndex[];
  setImageIndexToOpen: Dispatch<React.SetStateAction<number | undefined>>;
}

export const DirStructureGrid = ({items, setImageIndexToOpen}: Props) => {

  //
  return (
    <ParentSize>
      {({ height }) => (
      <VirtuosoGrid
        style={{ height }}
        totalCount={items.length}
        components={gridComponents}
        increaseViewportBy={1000}
        itemContent={(index: number) => {
          // return <ItemWrapper>Item {index}</ItemWrapper>;

          const item = items[index];

          return (
            <div
              style={{
                display: 'flex',
                flex: 1,
                textAlign: 'center',
                // whiteSpace: 'nowrap',
                width: 150,
                // padding: 5,
                // height: 180,
              }}
            >
              <div
                key={item.name}
                className={styles.item}
                onClick={() => {
                  if (item.type === 'directory') navigate(item.path);
                  if (item.type === 'image') setImageIndexToOpen(item.index);
                  if (item.type === 'file') {
                    const a = document.createElement('a');
                    a.href = `/api/image/file?path=${encodeURIComponent(item.path)}`;
                    a.download = '';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }
                }}
              >
                {item.type === 'image' ? (
                  <img
                    className={styles.preview}
                    src={`api/image/preview?path=${item.path}&size=small`}
                    alt={item.name}
                  />
                ) : (
                  <div className="icon" onClick={() => {

                  }}>
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
            </div>
          )
        }}
      />
      )}
    </ParentSize>
  );
}
