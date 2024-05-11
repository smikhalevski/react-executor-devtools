import { clsx } from 'clsx';
import React, { useState } from 'react';
import { ChevronIcon } from '../../gen/icons/ChevronIcon';
import { DebugIcon } from '../../gen/icons/DebugIcon';
import { EyeIcon } from '../../gen/icons/EyeIcon';
import type { Inspection } from '../../types';
import { useInspectedId } from '../executors';
import css from './InspectionView.module.css';

export interface InspectionViewProps {
  inspection: Inspection;
  onExpanded: (path: number[]) => void;
  onGoToDefinition: (definition: any, path: number[]) => void;
  path?: number[];
  indent?: number;
}

export const InspectionView = (props: InspectionViewProps) => {
  const inspectedId = useInspectedId();
  const { inspection, onExpanded, onGoToDefinition, path = [], indent = 0 } = props;
  const [isExpanded, setExpanded] = useState(false);
  const definition = inspection.annotations?.definition;

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
          {definition &&
            (definition?.type === 'executor' ? (
              definition.id !== inspectedId && (
                <DebugIcon
                  width={14}
                  height={14}
                  style={{ verticalAlign: 'top', cursor: 'pointer' }}
                  onClick={event => {
                    event.preventDefault();
                    onGoToDefinition(definition, path);
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
                  onGoToDefinition(definition, path);
                }}
              />
            ))}
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
            onGoToDefinition={onGoToDefinition}
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
