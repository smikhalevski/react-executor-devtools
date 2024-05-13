import { clsx } from 'clsx';
import React from 'react';
import { ExecutorIcon } from '../gen/icons/ExecutorIcon';
import { InvalidatedExecutorIcon } from '../gen/icons/InvalidatedExecutorIcon';
import { PendingExecutorIcon } from '../gen/icons/PendingExecutorIcon';
import type { ExecutorStats } from '../../types';
import css from './StatsIndicator.module.css';

interface StatsIndicatorProps {
  stats: ExecutorStats;
}

export const StatsIndicator = ({ stats }: StatsIndicatorProps) => {
  return (
    <span
      className={clsx(
        css.StatsIndicator,
        stats.settledAt === 0 ? css.Unsettled : stats.isFulfilled ? css.Fulfilled : css.Rejected
      )}
    >
      {stats.isPending && <PendingExecutorIcon className={css.PendingExecutorIcon} />}
      {stats.invalidatedAt === 0 ? (
        <ExecutorIcon className={css.Icon} />
      ) : (
        <InvalidatedExecutorIcon className={css.Icon} />
      )}
    </span>
  );
};
