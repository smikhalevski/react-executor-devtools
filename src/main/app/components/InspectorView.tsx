import React, { ReactNode } from 'react';
import type { ExecutorPart, Location } from '../../types';
import { useDetails, useInspector, usePartInspection } from '../executors';
import { DebugIcon } from '../gen/icons/DebugIcon';
import { WarningIcon } from '../gen/icons/WarningIcon';
import { useContentClient } from '../useContentClient';
import { Button } from './Button';
import { FormattedRelativeDateTime } from './FormattedRelativeDateTime';
import { IconButton } from './IconButton';
import { InspectionTree } from './InspectionTree';
import css from './InspectorView.module.css';
import { Loading } from './Loading';
import { StatsIndicator } from './StatsIndicator';
import { Tooltip } from './Tooltip';
import { TooltipTrigger } from 'react-aria-components';

export const InspectorView = () => {
  const inspector = useInspector();

  if (inspector === undefined) {
    return <div className={css.NoExecutor}>{'No executor'}</div>;
  }

  return (
    <div
      key={inspector.executorId}
      className={css.Sections}
    >
      <Section title={'Key'}>
        <PartInspection
          executorId={inspector.executorId}
          part={'key'}
        />
      </Section>

      <StatsSection executorId={inspector.executorId} />

      <Section title={'Value'}>
        <PartInspection
          executorId={inspector.executorId}
          part={'value'}
        />
      </Section>

      <Section title={'Reason'}>
        <PartInspection
          executorId={inspector.executorId}
          part={'reason'}
        />
      </Section>

      <Section title={'Task'}>
        <TaskInspection
          executorId={inspector.executorId}
          noDataLabel={'No task'}
        />
      </Section>

      <Section title={'Plugins'}>
        <PartInspection
          executorId={inspector.executorId}
          part={'plugins'}
          isHeadless={true}
          noDataLabel={'No plugins'}
        />
      </Section>

      <Section title={'Annotations'}>
        <PartInspection
          executorId={inspector.executorId}
          part={'annotations'}
          isHeadless={true}
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
  executorId: string;
}

const StatsSection = ({ executorId }: StatsSectionProps) => {
  const contentClient = useContentClient();
  const { stats } = useDetails(executorId);

  return (
    <Section
      title={
        <>
          {'Status '}
          <TooltipTrigger>
            <IconButton onPress={() => contentClient.debugExecutor(executorId)}>
              <DebugIcon />
            </IconButton>
            <Tooltip>{'Debug in console'}</Tooltip>
          </TooltipTrigger>
        </>
      }
    >
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
          onPress={() => contentClient.retryExecutor(executorId)}
        >
          {'Retry'}
        </Button>

        <Button
          isDisabled={stats.settledAt === 0 || stats.invalidatedAt !== 0}
          onPress={() => contentClient.invalidateExecutor(executorId)}
        >
          {'Invalidate'}
        </Button>

        <Button
          isDisabled={!stats.isPending}
          onPress={() => contentClient.abortExecutor(executorId)}
        >
          {'Abort'}
        </Button>
      </div>
    </Section>
  );
};

interface PartInspectionProps {
  executorId: string;
  part: ExecutorPart;
  noDataLabel?: ReactNode;
  isHeadless?: boolean;
}

const PartInspection = ({ executorId, part, noDataLabel, isHeadless }: PartInspectionProps) => {
  const contentClient = useContentClient();
  const inspection = usePartInspection(executorId, part);

  if (inspection === undefined) {
    return <Loading />;
  }

  const handleExpanded = (path: number[]) => {
    contentClient.inspectChildren(executorId, part, path);
  };

  const handleGoToLocation = (location: Location, path: number[]) => {
    if (location.type === 'executor') {
      contentClient.startInspection(location.executorId);
    } else {
      contentClient.goToDefinition(executorId, part, path);
    }
  };

  if (!isHeadless) {
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
  executorId: string;
  noDataLabel: ReactNode;
}

const TaskInspection = ({ executorId, noDataLabel }: TaskInspectionProps) => {
  const details = useDetails(executorId);

  usePartInspection(executorId, 'task');

  if (!details.stats.hasTask) {
    return <div className={css.NoData}>{noDataLabel}</div>;
  }

  return (
    <PartInspection
      executorId={executorId}
      part={'task'}
    />
  );
};
