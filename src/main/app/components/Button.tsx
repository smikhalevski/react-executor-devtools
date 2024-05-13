import React, { ReactNode } from 'react';
import { Button } from 'react-aria-components';
import css from './Button.module.css';

interface ButtonProps {
  children?: ReactNode;
  onPress?: () => void;
  isDisabled?: boolean;
}

const __Button = (props: ButtonProps) => (
  <Button
    className={css.Button}
    onPress={props.onPress}
    isDisabled={props.isDisabled}
  >
    {props.children}
  </Button>
);

export { __Button as Button };
