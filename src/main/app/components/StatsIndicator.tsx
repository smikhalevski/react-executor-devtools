import { clsx } from 'clsx';
import React from 'react';
import type { ExecutorStats } from '../../types';
import { ExecutorIcon } from '../gen/icons/ExecutorIcon';
import { InvalidatedExecutorIcon } from '../gen/icons/InvalidatedExecutorIcon';
import { PendingExecutorIcon } from '../gen/icons/PendingExecutorIcon';
import css from './StatsIndicator.module.css';

interface StatsIndicatorProps {
  stats: ExecutorStats;
  className?: string;
}

export const StatsIndicator = ({ stats, className }: StatsIndicatorProps) => (
  <span
    className={clsx(
      css.StatsIndicator,
      stats.settledAt === 0 ? css.Unsettled : stats.isFulfilled ? css.Fulfilled : css.Rejected,
      className
    )}
  >
    {stats.isPending && <PendingExecutorIcon className={css.PendingExecutorIcon} />}
    {stats.invalidatedAt === 0 ? (
      <ExecutorIcon className={css.ExecutorIcon} />
    ) : (
      <InvalidatedExecutorIcon className={css.ExecutorIcon} />
    )}
  </span>
);
