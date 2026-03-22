import { scrollbarWidth } from '@/helpers/ui-helper.ts';
import { VirtuosoGrid, type GridComponents, type VirtuosoGridHandle } from 'react-virtuoso';
import {
  forwardRef,
  type CSSProperties,
  type HTMLAttributes,
  type PropsWithChildren,
  type Ref, useRef, useLayoutEffect, useEffect, useState,
} from 'react';
import { useLocation } from 'wouter';
// import { useLongPress } from '@siberiacancode/reactuse';
import ChevronUp from '@/assets/chevron-up.svg?react';

import type { DirItem } from '@/types/fs.ts';
import { ParentSize } from '@/lib/parent-size/ParentSize.tsx';
import { CheckBoxIcon, CheckedIcon } from '@/components/PhotoViewer/svg-lib.tsx';
import styles from './DirStructureGrid.module.css';
import { useLongPress } from '@/lib/useLongPress/useLongPress.tsx';


type GridDivProps = PropsWithChildren<{
  style?: CSSProperties;
}> &
  HTMLAttributes<HTMLDivElement>;

const gridItemPadding = 5;


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

    const { context, ...otherProps } = props as any;
    const width = context.itemWidth;

    return (
      <div
        {...otherProps}
        style={{
          // padding: '0.5rem',
          width,
          padding: gridItemPadding,
          // display: 'flex',
          // flex: 'none',
          // alignContent: 'stretch',
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


type ItemContentProps = {
  index: number;
  items: DirItem[];
  setImageIndexToOpen: (index: number) => void;
  selectItem: (name: string, flag?: boolean) => void;
  isSelectMode: boolean;
  itemWidth: number;
}

const ItemContent = ({index, items, setImageIndexToOpen, selectItem, isSelectMode, itemWidth}: ItemContentProps) => {
  const [,navigate] = useLocation();

  const item = items[index];

  const longPress = useLongPress(() => {
    selectItem(item.name);
  });

  const isImage = item.type === 'image';

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        flex: 1,
        textAlign: 'center',
        // whiteSpace: 'nowrap',
        width: itemWidth - gridItemPadding * 2,
        // padding: 5,
        // height: 180,
      }}
    >
      <div
        key={item.name}
        className={styles.item}
        style={{width: itemWidth - gridItemPadding * 2}}
        onTouchStart={isImage ? longPress.onTouchStart : undefined}
        onTouchEnd={isImage ? longPress.onTouchEnd : undefined}
        onTouchMove={isImage ? longPress.onTouchMove : undefined}
        onTouchCancel={isImage ? longPress.onTouchCancel : undefined}
        onContextMenu={isImage ? (e) => e.preventDefault() : undefined}
        onClick={() => {
          if (longPress.shouldIgnoreClick()) return;

          if (item.type === 'directory') navigate('/' + item.path);
          if (isImage && item.index !== undefined) setImageIndexToOpen(item.index);
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
        {isImage ? (
          <Image
            path={item.path}
            name={item.name}
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
        {isImage && (
          <div className={`${styles.checkbox} ${item.isSelected || isSelectMode ? styles.checkActive : ''}`} onClick={(event) => {
            event.stopPropagation();
            selectItem(item.name)
          }}>
            {/*<div>*/}
            { item.isSelected ? <CheckedIcon /> : <CheckBoxIcon /> }
            {/*</div>*/}
          </div>)}
      </div>
    </div>
  )
};


type Props = {
  items: DirItem[];
  setImageIndexToOpen: (index: number) => void;
  selectItem: (name: string, flag?: boolean) => void;
  isSelectMode: boolean;
  imageIndexToOpen: number | undefined;
}

export const DirStructureGrid = ({
                                   items,
                                   setImageIndexToOpen,
                                   selectItem,
                                   isSelectMode,
                                   imageIndexToOpen,
}: Props) => {

  const [showScrollTop, setShowScrollTop] = useState(false);

  const virtuosoRef = useRef<VirtuosoGridHandle>(null);

  const scrollToItem = (index: number) => {
    virtuosoRef.current?.scrollToIndex({
      index,
      align: 'center', // 'start' | 'center' | 'end'
      behavior: 'smooth', // или 'auto'
    })
  }

  useEffect(() => {
    if (imageIndexToOpen) scrollToItem(imageIndexToOpen)
  }, [imageIndexToOpen])



  return (
    <div
      style={{
        height: '100%',
        width: '100%',
      }}
    >
    <ParentSize>
      {({ height, width }) => {

        // const itemWidth = width > 0 ? width / Math.floor(width / 160) : 0;

        const widthWithoutScroll = width > 0 ? width - scrollbarWidth : 1;

        const itemCountRow = Math.floor(widthWithoutScroll / 160);
        const itemWidthWithGap = widthWithoutScroll / itemCountRow

        return (
          <VirtuosoGrid
            ref={virtuosoRef}
            style={{ height }}
            totalCount={items.length}
            components={gridComponents}
            increaseViewportBy={1000}
            itemContent={(index: number) => {
              return (
                <ItemContent
                  index={index}
                  items={items}
                  setImageIndexToOpen={setImageIndexToOpen}
                  selectItem={selectItem}
                  isSelectMode={isSelectMode}
                  itemWidth={itemWidthWithGap}
                />
              )
            }}
            atTopStateChange={(isAtTop) => {
              setShowScrollTop(!isAtTop);
            }}
            context={{
              itemWidthWithGap
            }}
           />
      )}}
    </ParentSize>
      {(
        <button
          className={`${styles.fab} ${showScrollTop ? styles.visible : styles.hidden}`}
          onClick={() => {
            virtuosoRef.current?.scrollToIndex({
              index: 0,
              align: 'start',
              behavior: 'smooth',
            });
          }}
        >
          <ChevronUp width={30} height={30} />
        </button>
      )}
    </div>
  );
}

type ImageProps = {
  name: string
  path: string
};

const Image = ({name, path}: ImageProps) => {

  const imgRef = useRef<HTMLImageElement>(null);
  const src = `/api/image/preview?path=${path}&size=small`;

  useLayoutEffect(() => {
    imgRef.current!.src = src;
    return () => {
      imgRef.current!.src = '';
    };
  }, []);

  return (
    <img
      ref={imgRef}
      className={styles.previewImg}
      src={src}
      alt={name}
      loading="lazy"
    />
  );
};
