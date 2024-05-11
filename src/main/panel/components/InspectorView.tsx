import React, { Fragment } from 'react';
import { WarningIcon } from '../../gen/icons/WarningIcon';
import type { ExecutorPart, Location } from '../../types';
import { useDetails, useInspector, usePartInspection } from '../executors';
import { useContentClient } from '../useContentClient';
import { InspectionView } from './InspectionView';
import { StatsIndicator } from './StatsIndicator';
import css from './StatsIndicator.module.css';

export const InspectorView = () => {
  const inspector = useInspector();

  if (inspector === null) {
    return 'No inspection';
  }

  return (
    <Fragment key={inspector.id}>
      {'Key'}
      <PartInspectionView
        id={inspector.id}
        part={'key'}
      />
      <hr />
      <DetailsView id={inspector.id} />
      <hr />
      {'Value'}
      <PartInspectionView
        id={inspector.id}
        part={'value'}
      />
      <hr />
      {'Reason'}
      <PartInspectionView
        id={inspector.id}
        part={'reason'}
      />
      <hr />
      {'Task'}
      <PartInspectionView
        id={inspector.id}
        part={'task'}
      />
      <hr />
      {'Plugins'}
      <PartInspectionView
        id={inspector.id}
        part={'plugins'}
        isExploded={true}
      />
      <hr />
      {'Annotations'}
      <PartInspectionView
        id={inspector.id}
        part={'annotations'}
        isExploded={true}
      />
    </Fragment>
  );
};

interface DetailsViewProps {
  id: string;
}

const DetailsView = ({ id }: DetailsViewProps) => {
  const contentClient = useContentClient();
  const details = useDetails(id);

  const statuses = [];

  statuses.push(details.stats.settledAt === 0 ? 'Unsettled' : details.stats.isFulfilled ? 'Fulfilled' : 'Rejected');
  if (details.stats.invalidatedAt !== 0) {
    statuses.push('Invalidated');
  }
  if (details.stats.isPending) {
    statuses.push('Pending');
  }

  return (
    <>
      <StatsIndicator stats={details.stats} />

      {statuses.join(', ')}

      {!details.stats.isActive && (
        <>
          <br />
          <WarningIcon
            width={14}
            height={14}
            className={css.Warning}
          />
          {'Deactivated'}
        </>
      )}

      <hr />

      {details.stats.hasTask && <button onClick={() => contentClient.retryExecutor(id)}>{'Retry'}</button>}

      {details.stats.settledAt !== 0 && (
        <button onClick={() => contentClient.invalidateExecutor(id)}>{'Invalidate'}</button>
      )}

      {details.stats.isPending && <button onClick={() => contentClient.abortExecutor(id)}>{'Abort'}</button>}
    </>
  );
};

interface PartInspectionViewProps {
  id: string;
  part: ExecutorPart;
  isExploded?: boolean;
}

const PartInspectionView = ({ id, part, isExploded }: PartInspectionViewProps) => {
  const contentClient = useContentClient();
  const inspection = usePartInspection(id, part);

  if (inspection === null) {
    return <div>{'Loading'}</div>;
  }

  const handleExpanded = (path: number[]) => {
    contentClient.inspectChildren(id, part, path);
  };

  const handleGoToLocation = (location: Location, path: number[]) => {
    if (location.type === 'executor') {
      contentClient.startInspection(location.id);
    } else {
      contentClient.goToDefinition(id, part, path);
    }
  };

  if (!isExploded) {
    return (
      <InspectionView
        inspection={inspection}
        onExpanded={handleExpanded}
        onGoToLocation={handleGoToLocation}
      />
    );
  }

  if (inspection.children === undefined) {
    return <div>{'Nothing here'}</div>;
  }

  return inspection.children.map((inspection, index) => (
    <InspectionView
      key={inspection.keyPreview}
      inspection={inspection}
      path={[index]}
      onExpanded={handleExpanded}
      onGoToLocation={handleGoToLocation}
    />
  ));
};
