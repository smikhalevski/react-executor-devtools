import React, { ReactNode } from 'react';
import { Button as AriaButton } from 'react-aria-components';
import css from './Button.module.css';

interface ButtonProps {
  children?: ReactNode;
  onPress?: () => void;
  isDisabled?: boolean;
}

export const Button = (props: ButtonProps) => (
  <AriaButton
    className={css.Button}
    onPress={props.onPress}
    isDisabled={props.isDisabled}
  >
    {props.children}
  </AriaButton>
);
