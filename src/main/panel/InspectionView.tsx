import { clsx } from 'clsx';
import React, { useState } from 'react';
import { useExecutor } from 'react-executor';
import detachDeactivated from 'react-executor/plugin/detachDeactivated';
import { ArrowRight01StrokeRounded } from '../gen/icons/ArrowRight01StrokeRounded';
import type { Inspection } from '../inspect';
import { useAPI } from './APIContext';
import css from './inspection-view.module.css';

export interface Qualifier {
  type: string;
  executorIndex: number;
}

export interface InspectionViewProps {
  inspection: Inspection;
  qualifier: Qualifier;
  path: number[];
}

export const InspectionView = ({ inspection, qualifier, path }: InspectionViewProps) => {
  const [isExpanded, setExpanded] = useState(false);

  const api = useAPI();

  const expandExecutor = useExecutor('child_' + qualifier.executorIndex + '_' + path.join('_'), undefined, [
    detachDeactivated(),
  ]);

  const handleToggle = () => {
    setExpanded(isExpanded => !isExpanded);

    if (inspection.children !== undefined || expandExecutor.isPending) {
      return;
    }
    expandExecutor.execute(() => api.getKeyInspectionAt(qualifier, path));
  };

  return (
    <>
      <span
        style={{ '--indent': path.length }}
        className={clsx(css.inspection, !inspection.hasChildren && css.expandCollapseToggleSpacer)}
        onClick={inspection.hasChildren ? handleToggle : undefined}
      >
        {inspection.hasChildren && <ArrowRight01StrokeRounded className={css.expandCollapseToggle} />}
        {inspection.key !== undefined && <span className={css.key}>{inspection.key}</span>}
        {inspection.key !== undefined && <span className={css.afterKey}>{':'}</span>}
        <span className={css.value}>{inspection.value}</span>
      </span>

      {isExpanded &&
        (expandExecutor.isPending ? (
          <span
            style={{ '--indent': path.length + 1 }}
            className={clsx(css.inspection, css.expandCollapseToggleSpacer)}
          >
            {'Loading'}
          </span>
        ) : (
          inspection.children?.map((child, index) => (
            <InspectionView
              key={index}
              inspection={child}
              qualifier={qualifier}
              path={path.concat(index)}
            />
          ))
        ))}
    </>
  );
};
