import { clsx } from 'clsx';
import React, { useState } from 'react';
import { ArrowRight01StrokeRounded } from '../../gen/icons/ArrowRight01StrokeRounded';

import type { Inspection } from '../../content/types';
import css from './InspectionView.module.css';

export interface InspectionViewProps {
  inspection: Inspection;
  path: number[];
  onInspectionRequested: (path: number[]) => void;
}

export const InspectionView = ({ inspection, onInspectionRequested, path }: InspectionViewProps) => {
  const [isExpanded, setExpanded] = useState(false);

  const handleExpandCollapseToggle = () => {
    setExpanded(isExpanded => !isExpanded);

    if (inspection.children === undefined) {
      onInspectionRequested(path);
    }
  };

  return (
    <>
      <span
        style={{ '--inspection-view-indent': path.length }}
        className={clsx(css.InspectionView, !inspection.hasChildren && css.ExpandCollapseToggleSpacer)}
        onClick={inspection.hasChildren ? handleExpandCollapseToggle : undefined}
      >
        {inspection.hasChildren && <ArrowRight01StrokeRounded className={css.ExpandCollapseToggle} />}
        {inspection.keyDescription !== undefined && (
          <span className={css.keyDescription}>{inspection.keyDescription}</span>
        )}
        {inspection.keyDescription !== undefined && <span className={css.AfterkeyDescription}>{':'}</span>}
        <span className={css.valueDescription}>{inspection.valueDescription}</span>
      </span>

      {isExpanded &&
        (inspection.children?.map((child, index) => (
          <InspectionView
            key={index}
            inspection={child}
            path={path.concat(index)}
            onInspectionRequested={onInspectionRequested}
          />
        )) || (
          <span
            style={{ '--inspection-view-indent': path.length + 1 }}
            className={clsx(css.InspectionView, css.ExpandCollapseToggleSpacer)}
          >
            {'Loading'}
          </span>
        ))}
    </>
  );
};