import { clsx } from 'clsx';
import React, { useState } from 'react';
import { Input, ListBox, ListBoxItem, Selection } from 'react-aria-components';
import { useExecutorDetails, useList } from '../executors';
import { useContentClient } from '../useContentClient';
import css from './ListView.module.css';
import { StatsIndicator } from './StatsIndicator';

export const ListView = () => {
  const list = useList();
  const contentClient = useContentClient();
  const [selectedId, setSelectedId] = useState<string>();
  const [search, setSearch] = useState('');
  const pattern = parseSearch(search);

  const handleSelectionChange = (keys: Selection) => {
    if (keys instanceof Set && keys.size === 1) {
      const selectedId = keys.values().next().value;

      setSelectedId(selectedId);
      contentClient.startInspection(selectedId);
    }
  };

  return (
    <>
      <div className={css.SearchBlock}>
        <Input
          className={css.SearchInput}
          type={'search'}
          placeholder={'Search (text or /regex/)'}
          value={search}
          onChange={event => {
            setSearch(event.target.value);
          }}
        />
      </div>

      <ListBox
        className={css.List}
        selectionMode={'single'}
        selectionBehavior={'replace'}
        selectedKeys={selectedId !== undefined ? [selectedId] : []}
        onSelectionChange={handleSelectionChange}
        aria-label={'Executor list'}
      >
        {list.map(item => (
          <ListItemView
            key={item.executorId}
            id={item.executorId}
            isHidden={typeof pattern === 'string' ? !item.term.includes(pattern) : !pattern.test(item.term)}
          />
        ))}
      </ListBox>
    </>
  );
};

interface ListItemViewProps {
  id: string;
  isHidden: boolean;
}

const ListItemView = ({ id, isHidden }: ListItemViewProps) => {
  const details = useExecutorDetails(id);

  return (
    <ListBoxItem
      id={id}
      className={clsx(css.ListItem, !details.stats.isActive && css.Deactivated, isHidden && css.Hidden)}
      isDisabled={isHidden}
      aria-label={details.keyPreview}
    >
      <StatsIndicator
        stats={details.stats}
        className={css.Spacer}
      />
      {details.keyPreview}
    </ListBoxItem>
  );
};

function parseSearch(search: string): string | RegExp {
  return search.length > 1 && search.startsWith('/') && search.endsWith('/')
    ? new RegExp(search.slice(1, -1), 'i')
    : search.toLowerCase();
}
