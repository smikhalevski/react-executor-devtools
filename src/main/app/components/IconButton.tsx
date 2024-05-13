import { clsx } from 'clsx';
import React, { ReactNode } from 'react';
import { Button } from 'react-aria-components';
import css from './IconButton.module.css';

interface IconButtonProps {
  children?: ReactNode;
  className?: string;
  onPress?: () => void;
  isDisabled?: boolean;
}

export const IconButton = (props: IconButtonProps) => (
  <Button
    className={clsx(css.IconButton, props.className)}
    onPress={props.onPress}
    isDisabled={props.isDisabled}
  >
    {props.children}
  </Button>
);
