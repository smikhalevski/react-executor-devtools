import { clsx } from 'clsx';
import React, { useState } from 'react';
import type { Inspection, Location } from '../../types';
import { useInspector } from '../executors';
import { ChevronIcon } from '../gen/icons/ChevronIcon';
import { EyeIcon } from '../gen/icons/EyeIcon';
import { IconButton } from './IconButton';
import css from './InspectionView.module.css';
import { Loading } from './Loading';
import { Tooltip } from './Tooltip';

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

        {inspection.keyPreview !== undefined && <span className={css.Spacer}>{':'}</span>}

        <span className={css.ValuePreview}>
          {location !== undefined && (
            <Tooltip title={'Go to definition'}>
              <IconButton
                className={css.Spacer}
                isDisabled={location.type === 'executor' && location.executorId === inspector?.executorId}
                onPress={() => {
                  onGoToLocation(location, path);
                }}
              >
                <EyeIcon />
              </IconButton>
            </Tooltip>
          )}
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
            <Loading />
          </span>
        ))}
    </>
  );
};
