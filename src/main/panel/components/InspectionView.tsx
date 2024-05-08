import { clsx } from 'clsx';
import React, { useState } from 'react';
import { ArrowRight01StrokeRounded } from '../../gen/icons/ArrowRight01StrokeRounded';
import type { Inspection } from '../../inspect';
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
        style={{ '--indent': path.length }}
        className={clsx(css.InspectionView, !inspection.hasChildren && css.ExpandCollapseToggleSpacer)}
        onClick={inspection.hasChildren ? handleExpandCollapseToggle : undefined}
      >
        {inspection.hasChildren && <ArrowRight01StrokeRounded className={css.ExpandCollapseToggle} />}
        {inspection.keyPreview !== undefined && <span className={css.KeyPreview}>{inspection.keyPreview}</span>}
        {inspection.keyPreview !== undefined && <span className={css.AfterKeyPreview}>{':'}</span>}
        <span className={css.ValuePreview}>{inspection.valuePreview}</span>
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
            style={{ '--indent': path.length + 1 }}
            className={clsx(css.InspectionView, css.ExpandCollapseToggleSpacer)}
          >
            {'Loading'}
          </span>
        ))}
    </>
  );
};
