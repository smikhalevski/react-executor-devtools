import React, { type ReactNode } from 'react';
import { Button } from 'react-aria-components';
import css from './Button.module.css';

export interface ButtonProps {
  children?: ReactNode;
  onPress?: () => void;
}

export const _Button = ({ children, onPress }: ButtonProps) => {
  return (
    <Button
      className={css.Button}
      onPress={onPress}
    >
      {children}
    </Button>
  );
};

export { _Button as Button };
