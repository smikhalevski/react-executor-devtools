import React, { ReactNode } from 'react';
import type { ExecutorPart, Location } from '../../types';
import { useExecutorDetails, useInspector, usePartInspection } from '../executors';
import { WarningIcon } from '../gen/icons/WarningIcon';
import { useContentClient } from '../useContentClient';
import { Button } from './Button';
import { FormattedRelativeDateTime } from './FormattedRelativeDateTime';
import { InspectionTree } from './InspectionTree';
import css from './InspectorView.module.css';
import { Loading } from './Loading';
import { StatsIndicator } from './StatsIndicator';

export const InspectorView = () => {
  const inspector = useInspector();

  if (inspector === null) {
    return <div className={css.NoExecutor}>{'No executor'}</div>;
  }

  return (
    <div
      key={inspector.executorId}
      className={css.Sections}
    >
      <Section title={'Key'}>
        <PartInspection
          id={inspector.executorId}
          part={'key'}
        />
      </Section>

      <StatsSection id={inspector.executorId} />

      <Section title={'Value'}>
        <PartInspection
          id={inspector.executorId}
          part={'value'}
        />
      </Section>

      <Section title={'Reason'}>
        <PartInspection
          id={inspector.executorId}
          part={'reason'}
        />
      </Section>

      <Section title={'Task'}>
        <TaskInspection
          id={inspector.executorId}
          noDataLabel={'No task'}
        />
      </Section>

      <Section title={'Plugins'}>
        <PartInspection
          id={inspector.executorId}
          part={'plugins'}
          isRootHidden={true}
          noDataLabel={'No plugins'}
        />
      </Section>

      <Section title={'Annotations'}>
        <PartInspection
          id={inspector.executorId}
          part={'annotations'}
          isRootHidden={true}
          noDataLabel={'No annotations'}
        />
      </Section>
    </div>
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

interface StatsSectionProps {
  id: string;
}

const StatsSection = ({ id }: StatsSectionProps) => {
  const contentClient = useContentClient();
  const { stats } = useExecutorDetails(id);

  return (
    <Section title={'Status'}>
      <div className={css.StatusesBlock}>
        <StatsIndicator
          stats={stats}
          className={css.Spacer}
        />

        <div className={css.Statuses}>
          {stats.settledAt !== 0 ? (
            <span className={css.Status}>
              {stats.isFulfilled ? 'Fulfilled ' : 'Rejected '}
              <span className={css.StatusTimestamp}>
                {'('}
                <FormattedRelativeDateTime timestamp={stats.settledAt} />
                {')'}
              </span>
            </span>
          ) : (
            <span className={css.Status}>{'Unsettled'}</span>
          )}

          {stats.invalidatedAt !== 0 && (
            <span className={css.Status}>
              {'Invalidated '}
              <span className={css.StatusTimestamp}>
                {'('}
                <FormattedRelativeDateTime timestamp={stats.invalidatedAt} />
                {')'}
              </span>
            </span>
          )}

          {stats.isPending && <span className={css.Status}>{'Pending'}</span>}
        </div>
      </div>

      {!stats.isActive && (
        <div className={css.Status}>
          <WarningIcon className={css.DeactivatedIcon} />
          {'Deactivated'}
        </div>
      )}

      <div className={css.ButtonGroup}>
        <Button
          isDisabled={!stats.hasTask || stats.isPending}
          onPress={() => contentClient.retryExecutor(id)}
        >
          {'Retry'}
        </Button>

        <Button
          isDisabled={stats.settledAt === 0 || stats.invalidatedAt !== 0}
          onPress={() => contentClient.invalidateExecutor(id)}
        >
          {'Invalidate'}
        </Button>

        <Button
          isDisabled={!stats.isPending}
          onPress={() => contentClient.abortExecutor(id)}
        >
          {'Abort'}
        </Button>
      </div>
    </Section>
  );
};

interface PartInspectionProps {
  id: string;
  part: ExecutorPart;
  noDataLabel?: ReactNode;
  isRootHidden?: boolean;
}

const PartInspection = ({ id, part, noDataLabel, isRootHidden }: PartInspectionProps) => {
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
      contentClient.startInspection(location.executorId);
    } else {
      contentClient.goToDefinition(id, part, path);
    }
  };

  if (!isRootHidden) {
    return (
      <InspectionTree
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
    <InspectionTree
      key={inspection.keyPreview}
      inspection={inspection}
      path={[index]}
      onExpanded={handleExpanded}
      onGoToLocation={handleGoToLocation}
    />
  ));
};

interface TaskInspectionProps {
  id: string;
  noDataLabel: ReactNode;
}

const TaskInspection = ({ id, noDataLabel }: TaskInspectionProps) => {
  const details = useExecutorDetails(id);

  usePartInspection(id, 'task');

  if (!details.stats.hasTask) {
    return <div className={css.NoData}>{noDataLabel}</div>;
  }

  return (
    <PartInspection
      id={id}
      part={'task'}
    />
  );
};
