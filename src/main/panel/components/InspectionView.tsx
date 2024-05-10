import { clsx } from 'clsx';
import React, { useState } from 'react';

import type { Inspection } from '../../content/types';
import { ChevronIcon } from '../../gen/icons/ChevronIcon';
import css from './InspectionView.module.css';

export interface InspectionViewProps {
  inspection: Inspection;
  onExpanded: (path: number[]) => void;
  path?: number[];
}

export const InspectionView = ({ inspection, onExpanded, path = [] }: InspectionViewProps) => {
  const [isExpanded, setExpanded] = useState(false);

  const handleExpandCollapseToggle = () => {
    setExpanded(isExpanded => !isExpanded);

    if (inspection.children === undefined) {
      onExpanded(path);
    }
  };

  return (
    <>
      <span
        style={{ '--inspection-view-indent': path.length }}
        className={clsx(css.InspectionView, !inspection.hasChildren && css.ExpandCollapseToggleSpacer)}
        onClick={inspection.hasChildren ? handleExpandCollapseToggle : undefined}
      >
        {inspection.hasChildren && (
          <ChevronIcon className={clsx(css.ExpandCollapseToggle, isExpanded && css.Expanded)} />
        )}
        {inspection.keyDescription !== undefined && (
          <span className={css.KeyDescription}>{inspection.keyDescription}</span>
        )}
        {inspection.keyDescription !== undefined && <span className={css.AfterKeyDescription}>{':'}</span>}
        <span className={css.ValueDescription}>{inspection.valueDescription}</span>
      </span>

      {isExpanded &&
        (inspection.children?.map((child, index) => (
          <InspectionView
            key={index}
            inspection={child}
            path={path.concat(index)}
            onExpanded={onExpanded}
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
