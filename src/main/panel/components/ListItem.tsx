import { clsx } from 'clsx';
import React, { type ReactNode } from 'react';
import css from './ListItem.module.css';

interface ListItemProps {
  children?: ReactNode;
  isSelected?: boolean;
  onClick?: () => void;
}

export const ListItem = (props: ListItemProps) => {
  return (
    <div
      className={clsx(css.ListItem, props.isSelected && css.SelectedListItem)}
      onClick={props.onClick}
    >
      <div className={css.ListItemWrapper}>{props.children}</div>
    </div>
  );
};
