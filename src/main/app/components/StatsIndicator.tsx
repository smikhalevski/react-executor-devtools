import { clsx } from 'clsx';
import React from 'react';
import { ExecutorIcon } from '../gen/icons/ExecutorIcon';
import { InvalidatedExecutorIcon } from '../gen/icons/InvalidatedExecutorIcon';
import { PendingExecutorIcon } from '../gen/icons/PendingExecutorIcon';
import type { ExecutorStats } from '../../types';
import css from './StatsIndicator.module.css';

interface StatsIndicatorProps {
  stats: ExecutorStats;
  className?: string;
}

export const StatsIndicator = (props: StatsIndicatorProps) => (
  <span
    className={clsx(
      css.StatsIndicator,
      props.stats.settledAt === 0 ? css.Unsettled : props.stats.isFulfilled ? css.Fulfilled : css.Rejected,
      props.className
    )}
  >
    {props.stats.isPending && <PendingExecutorIcon className={css.PendingExecutorIcon} />}
    {props.stats.invalidatedAt === 0 ? (
      <ExecutorIcon className={css.ExecutorIcon} />
    ) : (
      <InvalidatedExecutorIcon className={css.ExecutorIcon} />
    )}
  </span>
);
