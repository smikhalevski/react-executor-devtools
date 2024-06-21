import React, { ReactNode } from 'react';
import { OverlayArrow, Tooltip as _Tooltip } from 'react-aria-components';
import css from './Tooltip.module.css';

interface TooltipProps {
  children: ReactNode;
}

export const Tooltip = ({ children }: TooltipProps) => (
  <_Tooltip className={css.Tooltip}>
    {children}
    <OverlayArrow className={css.OverlayArrow}>
      <svg
        width={8}
        height={8}
        viewBox="0 0 8 8"
      >
        <path d="M0 0 L4 4 L8 0" />
      </svg>
    </OverlayArrow>
  </_Tooltip>
);
