import React, { Fragment, type ReactNode } from 'react';
import type { ExecutorPart, Location } from '../../types';
import { useDetails, useInspector, usePartInspection } from '../executors';
import { WarningIcon } from '../gen/icons/WarningIcon';
import { useContentClient } from '../useContentClient';
import { Button } from './Button';
import { InspectionView } from './InspectionView';
import css from './InspectorView.module.css';
import { Loading } from './Loading';
import { StatsIndicator } from './StatsIndicator';

export const InspectorView = () => {
  const inspector = useInspector();

  if (inspector === null) {
    return null;
  }

  return (
    <Fragment key={inspector.id}>
      <Section title={'Key'}>
        <PartInspectionView
          id={inspector.id}
          part={'key'}
        />
      </Section>

      <Section title={'Status'}>
        <DetailsView id={inspector.id} />
      </Section>

      <Section title={'Value'}>
        <PartInspectionView
          id={inspector.id}
          part={'value'}
        />
      </Section>

      <Section title={'Reason'}>
        <PartInspectionView
          id={inspector.id}
          part={'reason'}
        />
      </Section>

      <Section title={'Task'}>
        <TaskInspectionView
          id={inspector.id}
          noDataLabel={'No task'}
        />
      </Section>

      <Section title={'Plugins'}>
        <PartInspectionView
          id={inspector.id}
          part={'plugins'}
          isExploded={true}
          noDataLabel={'No plugins'}
        />
      </Section>

      <Section title={'Annotations'}>
        <PartInspectionView
          id={inspector.id}
          part={'annotations'}
          isExploded={true}
          noDataLabel={'No annotations'}
        />
      </Section>
    </Fragment>
  );
};

interface SectionProps {
  title?: ReactNode;
  children: ReactNode;
}

const Section = ({ title, children }: SectionProps) => (
  <div className={css.Section}>
    {title !== undefined && <span className={css.SectionTitle}>{title}</span>}
    {children}
  </div>
);

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
      <div className={css.Statuses}>
        <StatsIndicator
          stats={details.stats}
          className={css.Spacer}
        />

        {statuses.join(', ')}

        {!details.stats.isActive && (
          <>
            <br />
            <span className={css.Spacer}>
              <WarningIcon className={css.DeactivatedIcon} />
            </span>
            {'Deactivated'}
          </>
        )}
      </div>

      <div className={css.ButtonGroup}>
        <Button
          isDisabled={!details.stats.hasTask || details.stats.isPending}
          onPress={() => contentClient.retryExecutor(id)}
        >
          {'Retry'}
        </Button>

        <Button
          isDisabled={details.stats.settledAt === 0 || details.stats.invalidatedAt !== 0}
          onPress={() => contentClient.invalidateExecutor(id)}
        >
          {'Invalidate'}
        </Button>

        <Button
          isDisabled={!details.stats.isPending}
          onPress={() => contentClient.abortExecutor(id)}
        >
          {'Abort'}
        </Button>
      </div>
    </>
  );
};

interface PartInspectionViewProps {
  id: string;
  part: ExecutorPart;
  noDataLabel?: ReactNode;
  isExploded?: boolean;
}

const PartInspectionView = ({ id, part, noDataLabel, isExploded }: PartInspectionViewProps) => {
  const contentClient = useContentClient();
  const inspection = usePartInspection(id, part);

  if (inspection === null) {
    return <Loading />;
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
    return <div className={css.NoData}>{noDataLabel}</div>;
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

interface TaskInspectionViewProps {
  id: string;
  noDataLabel: ReactNode;
}

const TaskInspectionView = ({ id, noDataLabel }: TaskInspectionViewProps) => {
  const details = useDetails(id);

  usePartInspection(id, 'task');

  if (!details.stats.hasTask) {
    return <div className={css.NoData}>{noDataLabel}</div>;
  }

  return (
    <PartInspectionView
      id={id}
      part={'task'}
    />
  );
};
