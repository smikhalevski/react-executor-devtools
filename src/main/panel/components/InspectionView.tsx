import { clsx } from 'clsx';
import React, { useState } from 'react';
import { ChevronIcon } from '../../gen/icons/ChevronIcon';
import { DebugIcon } from '../../gen/icons/DebugIcon';
import { EyeIcon } from '../../gen/icons/EyeIcon';
import type { Inspection, Location } from '../../types';
import { useInspector } from '../executors';
import css from './InspectionView.module.css';

export interface InspectionViewProps {
  inspection: Inspection;
  onExpanded: (path: number[]) => void;
  onGoToLocation: (location: Location, path: number[]) => void;
  path?: number[];
  indent?: number;
}

export const InspectionView = (props: InspectionViewProps) => {
  const { inspection, onExpanded, onGoToLocation, path = [], indent = 0 } = props;

  const inspector = useInspector();
  const [isExpanded, setExpanded] = useState(false);

  const { location } = inspection;

  const handleExpandCollapseToggle = () => {
    setExpanded(isExpanded => !isExpanded);

    if (inspection.children === undefined) {
      onExpanded(path);
    }
  };

  return (
    <>
      <span
        style={{ '--inspection-indent': indent }}
        className={clsx(css.Inspection, !inspection.hasChildren && css.ExpandCollapseToggleSpacer)}
        onClick={inspection.hasChildren ? handleExpandCollapseToggle : undefined}
      >
        {inspection.hasChildren && (
          <ChevronIcon className={clsx(css.ExpandCollapseToggle, isExpanded && css.Expanded)} />
        )}

        {inspection.keyPreview !== undefined && <span className={css.KeyPreview}>{inspection.keyPreview}</span>}

        {inspection.keyPreview !== undefined && <span className={css.AfterKeyPreview}>{':'}</span>}

        <span className={css.ValuePreview}>
          {location &&
            (location?.type === 'executor' ? (
              location.id !== inspector?.id && (
                <DebugIcon
                  width={14}
                  height={14}
                  style={{ verticalAlign: 'top', cursor: 'pointer' }}
                  onClick={event => {
                    event.preventDefault();
                    onGoToLocation(location, path);
                  }}
                />
              )
            ) : (
              <EyeIcon
                width={14}
                height={14}
                style={{ verticalAlign: 'top', cursor: 'pointer' }}
                onClick={event => {
                  event.preventDefault();
                  onGoToLocation(location, path);
                }}
              />
            ))}
          {inspection.valuePreview}
        </span>
      </span>

      {inspection.hasChildren &&
        isExpanded &&
        (inspection.children?.map((child, index) => (
          <InspectionView
            key={child.keyPreview}
            inspection={child}
            path={path.concat(index)}
            indent={indent + 1}
            onExpanded={onExpanded}
            onGoToLocation={onGoToLocation}
          />
        )) || (
          <span
            style={{ '--inspection-indent': indent + 1 }}
            className={clsx(css.Inspection, css.ExpandCollapseToggleSpacer)}
          >
            {'Loading'}
          </span>
        ))}
    </>
  );
};
