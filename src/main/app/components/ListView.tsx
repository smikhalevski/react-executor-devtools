import { clsx } from 'clsx';
import React, { useState } from 'react';
import { Input, ListBox, ListBoxItem, Selection } from 'react-aria-components';
import { ListItem, useDetails, useList } from '../executors';
import { useContentClient } from '../useContentClient';
import css from './ListView.module.css';
import { StatsIndicator } from './StatsIndicator';

export const ListView = () => {
  const list = useList();
  const contentClient = useContentClient();
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());
  const [search, setSearch] = useState('');

  const handleSelectionChange = (keys: Selection) => {
    setSelectedKeys(keys);

    if (keys instanceof Set && keys.size === 1) {
      contentClient.startInspection(keys.values().next().value);
    }
  };

  return (
    <>
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

      <ListBox
        aria-label={'Executor list'}
        className={css.ListBox}
        items={list.filter(createListItemFilter(search))}
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
  const details = useDetails(id);

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

function createListItemFilter(search: string): (item: ListItem) => boolean {
  if (search.length > 1 && search[0] === '/' && search[search.length - 1] === '/') {
    const regExp = new RegExp(search.slice(1, -1), 'i');

    return item => regExp.test(item.searchableString);
  }

  search = search.toLowerCase();

  return item => item.searchableString.includes(search);
}
