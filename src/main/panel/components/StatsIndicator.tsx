import { clsx } from 'clsx';
import React from 'react';
import type { Stats } from '../../types';
import { DefaultIcon } from '../../gen/icons/DefaultIcon';
import { InvalidatedIcon } from '../../gen/icons/InvalidatedIcon';
import { SpinnerIcon } from '../../gen/icons/SpinnerIcon';
import css from './StatsIndicator.module.css';

interface StatsIndicatorProps {
  stats: Stats;
}

export const StatsIndicator = ({ stats }: StatsIndicatorProps) => {
  return (
    <div
      className={clsx(
        css.StatsIndicator,
        stats.settledAt === 0 ? css.Unsettled : stats.isFulfilled ? css.Fulfilled : css.Rejected
      )}
    >
      {stats.isPending && <SpinnerIcon className={css.SpinnerIcon} />}
      {stats.invalidatedAt === 0 ? <DefaultIcon className={css.Icon} /> : <InvalidatedIcon className={css.Icon} />}
    </div>
  );
};
