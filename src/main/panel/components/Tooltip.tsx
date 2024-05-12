import React, { type ReactNode } from 'react';
import { TooltipTrigger, Tooltip, OverlayArrow } from 'react-aria-components';
import css from './Tooltip.module.css';

interface TooltipProps {
  children: ReactNode;
  title: ReactNode;
}

export const _Tooltip = (props: TooltipProps) => (
  <TooltipTrigger>
    {props.children}
    <Tooltip className={css.Tooltip}>
      {props.title}
      <OverlayArrow className={css.OverlayArrow}>
        <svg
          width={8}
          height={8}
          viewBox="0 0 8 8"
        >
          <path d="M0 0 L4 4 L8 0" />
        </svg>
      </OverlayArrow>
    </Tooltip>
  </TooltipTrigger>
);

export { _Tooltip as Tooltip };