import { useLayoutEffect, useRef, useState } from 'react';

type Size = {
  width: number;
  height: number;
};

type ParentSizeProps = {
  children: (size: Size) => React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export function ParentSize({
                             children,
                             className,
                             style,
                           }: ParentSizeProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const updateSize = () => {
      const { width, height } = element.getBoundingClientRect();
      setSize({ width, height });
    };

    updateSize();

    const observer = new ResizeObserver(() => {
      updateSize();
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);


  return (
    <div
      ref={ref}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        ...style,
      }}
    >
      {children(size)}
    </div>
  );
}
