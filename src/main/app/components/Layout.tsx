import React, { type ReactNode, useRef } from 'react';
import { layoutRatioExecutor } from '../executors';
import css from './Layout.module.css';

const SAFE_ZONE_PERCENTAGE = 0.1;

const layoutRatio = layoutRatioExecutor.get();

interface LayoutProps {
  leftBlock?: ReactNode;
  rightBlock?: ReactNode;
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
        layoutRatio.horizontal =
          (((Math.min(Math.max(event.clientX - offset, safeZone), width - safeZone) / width) * 10000) | 0) / 100 + '%';

        layoutElement.style.setProperty('--horizontal-layout-ratio', layoutRatio.horizontal);
      };
    } else {
      const offset = event.clientY - rect.top - rect.height / 2;
      const height = window.innerHeight;
      const safeZone = height * SAFE_ZONE_PERCENTAGE;

      moveListener = event => {
        layoutRatio.vertical =
          (((Math.min(Math.max(event.clientY - offset, safeZone), height - safeZone) / height) * 10000) | 0) / 100 +
          '%';

        layoutElement.style.setProperty('--vertical-layout-ratio', layoutRatio.vertical);
      };
    }

    const unsubscribe = () => {
      window.removeEventListener('mousedown', moveListener);
      window.removeEventListener('mousemove', moveListener);
      window.removeEventListener('mouseleave', unsubscribe);
      window.removeEventListener('mouseup', unsubscribe);
      window.removeEventListener('blur', unsubscribe);

      layoutElement.classList.remove(css.Resizing);
      layoutRatioExecutor.resolve(layoutRatio);
    };

    window.addEventListener('mousedown', moveListener);
    window.addEventListener('mousemove', moveListener);
    window.addEventListener('mouseleave', unsubscribe);
    window.addEventListener('mouseup', unsubscribe);
    window.addEventListener('blur', unsubscribe);

    layoutElement.classList.add(css.Resizing);
  };

  return (
    <div
      ref={layoutRef}
      className={css.Layout}
      style={{
        '--horizontal-layout-ratio': layoutRatio.horizontal,
        '--vertical-layout-ratio': layoutRatio.vertical,
      }}
    >
      <div className={css.LeftBlock}>{props.leftBlock}</div>
      <div
        className={css.ResizeBarWrapper}
        onMouseDown={handleStartDrag}
      >
        <div className={css.ResizeBar} />
      </div>
      <div className={css.RightBlock}>{props.rightBlock}</div>
    </div>
  );
};
