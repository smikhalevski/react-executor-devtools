import React, { type ReactNode, useRef } from 'react';
import css from './Layout.module.css';

const SAFE_ZONE_PERCENTAGE = 0.2;
const RESIZE_PERCENTAGE_KEY = 'resize-percentage';

const resizePercentageJson = localStorage.getItem(RESIZE_PERCENTAGE_KEY);

const resizePercentage: { horizontal: string; vertical: string } =
  resizePercentageJson !== null ? JSON.parse(resizePercentageJson) : { horizontal: '50%', vertical: '50%' };

interface LayoutProps {
  executorsChildren?: ReactNode;
  inspectedExecutorChildren?: ReactNode;
}

export const Layout = (props: LayoutProps) => {
  const layoutRef = useRef<HTMLDivElement>(null);

  const handleStartDrag = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    const rect = target.getBoundingClientRect();
    const layoutElement = layoutRef.current!;

    let moveListener: (event: MouseEvent) => void;

    if (window.getComputedStyle(target).getPropertyValue('--resize-direction') === 'horizontal') {
      const offset = event.clientX - rect.left - rect.width / 2;
      const width = window.innerWidth;
      const safeZone = width * SAFE_ZONE_PERCENTAGE;

      moveListener = event => {
        resizePercentage.horizontal =
          (Math.min(Math.max(event.clientX - offset, safeZone), width - safeZone) / width) * 100 + '%';

        layoutElement.style.setProperty('--horizontal-resize-percentage', resizePercentage.horizontal);
      };
    } else {
      const offset = event.clientY - rect.top - rect.height / 2;
      const height = window.innerHeight;
      const safeZone = height * SAFE_ZONE_PERCENTAGE;

      moveListener = event => {
        resizePercentage.vertical =
          (Math.min(Math.max(event.clientY - offset, safeZone), height - safeZone) / height) * 100 + '%';

        layoutElement.style.setProperty('--vertical-resize-percentage', resizePercentage.vertical);
      };
    }

    const unsubscribe = () => {
      window.removeEventListener('mousedown', moveListener);
      window.removeEventListener('mousemove', moveListener);
      window.removeEventListener('mouseleave', unsubscribe);
      window.removeEventListener('mouseup', unsubscribe);
      window.removeEventListener('blur', unsubscribe);

      layoutElement.classList.remove(css.LayoutDragging);
      localStorage.setItem(RESIZE_PERCENTAGE_KEY, JSON.stringify(resizePercentage));
    };

    window.addEventListener('mousedown', moveListener);
    window.addEventListener('mousemove', moveListener);
    window.addEventListener('mouseleave', unsubscribe);
    window.addEventListener('mouseup', unsubscribe);
    window.addEventListener('blur', unsubscribe);

    layoutElement.classList.add(css.LayoutDragging);
  };

  return (
    <div
      ref={layoutRef}
      className={css.Layout}
      style={{
        '--horizontal-resize-percentage': resizePercentage.horizontal,
        '--vertical-resize-percentage': resizePercentage.vertical,
      }}
    >
      <div className={css.ExecutorsWrapper}>{props.executorsChildren}</div>
      <div
        className={css.ResizeBarWrapper}
        onMouseDown={handleStartDrag}
      >
        <div className={css.ResizeBar} />
      </div>
      <div className={css.InspectedExecutorWrapper}>{props.inspectedExecutorChildren}</div>
    </div>
  );
};
