import React, { ReactNode } from 'react';
import { Button as _Button } from 'react-aria-components';
import css from './Button.module.css';

interface ButtonProps {
  children?: ReactNode;
  onPress?: () => void;
  isDisabled?: boolean;
}

export const Button = (props: ButtonProps) => (
  <_Button
    className={css.Button}
    onPress={props.onPress}
    isDisabled={props.isDisabled}
  >
    {props.children}
  </_Button>
);
