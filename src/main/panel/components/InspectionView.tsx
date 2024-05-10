import { clsx } from 'clsx';
import React, { useState } from 'react';
import { ChevronIcon } from '../../gen/icons/ChevronIcon';
import { DebugIcon } from '../../gen/icons/DebugIcon';
import type { Inspection } from '../../types';
import css from './InspectionView.module.css';

export interface InspectionViewProps {
  inspection: Inspection;
  onExpanded: (path: number[]) => void;
  path?: number[];
  indent?: number;
}

export const InspectionView = ({ inspection, onExpanded, path = [], indent = 0 }: InspectionViewProps) => {
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
        style={{ '--inspection-view-indent': indent }}
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
        <span className={css.ValueDescription}>
          {inspection.annotations?.isExecutor && (
            <DebugIcon
              width={14}
              height={14}
              style={{ verticalAlign: 'top' }}
            />
          )}
          {inspection.valueDescription}
        </span>
      </span>

      {isExpanded &&
        (inspection.children?.map((child, index) => (
          <InspectionView
            key={index}
            inspection={child}
            path={path.concat(index)}
            indent={indent + 1}
            onExpanded={onExpanded}
          />
        )) || (
          <span
            style={{ '--inspection-view-indent': indent + 1 }}
            className={clsx(css.InspectionView, css.ExpandCollapseToggleSpacer)}
          >
            {'Loading'}
          </span>
        ))}
    </>
  );
};
