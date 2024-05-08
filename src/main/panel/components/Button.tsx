import React, { type ReactNode } from 'react';
import css from './Button.module.css';

export interface ButtonProps {
  children?: ReactNode;
}

export const Button = ({ children }: ButtonProps) => {
  return (
    <button className={css.Button}>
      <span className={css.ButtonContent}>{children}</span>
    </button>
  );
};
