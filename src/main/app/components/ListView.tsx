import { clsx } from 'clsx';
import React from 'react';
import { useDetails, useInspector, useList } from '../executors';
import { useContentClient } from '../useContentClient';
import css from './ListView.module.css';
import { StatsIndicator } from './StatsIndicator';

export const ListView = () => {
  const list = useList();

  return list.map(item => (
    <ListItemView
      id={item.executorId}
      key={item.executorId}
    />
  ));
};

interface ListItemProps {
  id: string;
}

const ListItemView = ({ id }: ListItemProps) => {
  const inspector = useInspector();
  const details = useDetails(id);
  const contentClient = useContentClient();

  return (
    <div
      className={clsx(
        css.ListItem,
        id === inspector?.executorId && css.SelectedListItem,
        !details.stats.isActive && css.DeactivatedListItem
      )}
      onClick={() => {
        contentClient.startInspection(id);
      }}
    >
      <div className={css.ListItemWrapper}>
        <StatsIndicator
          stats={details.stats}
          className={css.StatsIndicator}
        />
        {details.keyPreview}
      </div>
    </div>
  );
};
