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
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());
  const [search, setSearch] = useState('');
  const pattern = parseSearch(search);

  const handleSelectionChange = (keys: Selection) => {
    setSelectedKeys(keys);

    if (keys instanceof Set && keys.size === 1) {
      contentClient.startInspection(keys.values().next().value);
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
            setSelectedKeys(new Set());
            setSearch(event.target.value);
          }}
        />
      </div>

      <ListBox
        aria-label={'Executor list'}
        className={css.ListBox}
        items={list.filter(item =>
          typeof pattern === 'string' ? item.term.includes(pattern) : pattern.test(item.term)
        )}
        selectedKeys={selectedKeys}
        selectionMode={'single'}
        selectionBehavior={'replace'}
        onSelectionChange={handleSelectionChange}
      >
        {item => <ListItemView id={item.executorId} />}
      </ListBox>
    </>
  );
};

interface ListItemViewProps {
  id: string;
}

const ListItemView = ({ id }: ListItemViewProps) => {
  const details = useExecutorDetails(id);

  return (
    <ListBoxItem
      id={id}
      className={clsx(css.ListBoxItem, !details.stats.isActive && css.Deactivated)}
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
  if (search.length > 1 && search.startsWith('/') && search.endsWith('/')) {
    return new RegExp(search.slice(1, -1), 'i');
  }
  return search.toLowerCase();
}
