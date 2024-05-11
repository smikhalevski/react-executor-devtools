import React, { Fragment } from 'react';
import type { InspectionPart } from '../types';
import { DebugIcon } from '../gen/icons/DebugIcon';
import { WarningIcon } from '../gen/icons/WarningIcon';
import { InspectionView } from './components/InspectionView';
import { Layout } from './components/Layout';
import { ListItem } from './components/ListItem';
import { StatsIndicator } from './components/StatsIndicator';
import css from './components/StatsIndicator.module.css';
import { useIds, useInspectedId, usePartInspection, useSuperficialInfo } from './executors';
import { useContentClient } from './useContentClient';

export const App = () => {
  return (
    <Layout
      superficialInfoList={<SuperficialInfoList />}
      inspectedInfo={<InspectedInfoView />}
    />
  );
};

const SuperficialInfoList = () => {
  const ids = useIds();

  return ids.map(id => (
    <SuperficialInfoListItem
      id={id}
      key={id}
    />
  ));
};

interface SuperficialInfoListItemProps {
  id: string;
}

const SuperficialInfoListItem = ({ id }: SuperficialInfoListItemProps) => {
  const inspectedId = useInspectedId();
  const superficialInfo = useSuperficialInfo(id);
  const contentClient = useContentClient();

  return (
    <ListItem
      onClick={() => {
        contentClient.startInspection(id);
      }}
      isSelected={id === inspectedId}
      isDeactivated={!superficialInfo.stats.isActive}
    >
      <StatsIndicator stats={superficialInfo.stats} />
      {superficialInfo.keyDescription}
    </ListItem>
  );
};

const InspectedInfoView = () => {
  const inspectedId = useInspectedId();

  if (inspectedId === null) {
    return 'No pending inspection';
  }

  return (
    <Fragment key={inspectedId}>
      {'Key'}
      <PartInspectionViewView
        inspectedId={inspectedId}
        part={'key'}
      />
      <hr />
      <SuperficialInfoView inspectedId={inspectedId} />
      <hr />
      {'Value'}
      <PartInspectionViewView
        inspectedId={inspectedId}
        part={'value'}
      />
      <hr />
      {'Reason'}
      <PartInspectionViewView
        inspectedId={inspectedId}
        part={'reason'}
      />
      <hr />
      {'Task'}
      <PartInspectionViewView
        inspectedId={inspectedId}
        part={'task'}
      />
      <hr />
      {'Plugins'}
      <PartChildrenInspectionViewView
        inspectedId={inspectedId}
        part={'plugins'}
      />
      <hr />
      {'Annotations'}
      <PartChildrenInspectionViewView
        inspectedId={inspectedId}
        part={'annotations'}
      />
    </Fragment>
  );
};

interface SuperficialInfoViewProps {
  inspectedId: string;
}

const SuperficialInfoView = ({ inspectedId }: SuperficialInfoViewProps) => {
  const superficialInfo = useSuperficialInfo(inspectedId);

  const statuses = [];

  statuses.push(
    superficialInfo.stats.settledAt === 0 ? 'Unsettled' : superficialInfo.stats.isFulfilled ? 'Fulfilled' : 'Rejected'
  );
  if (superficialInfo.stats.invalidatedAt !== 0) {
    statuses.push('Invalidated');
  }
  if (superficialInfo.stats.isPending) {
    statuses.push('Pending');
  }

  return (
    <>
      <StatsIndicator stats={superficialInfo.stats} />

      {statuses.join(', ')}

      {!superficialInfo.stats.isActive && (
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

      <br />
      <DebugIcon
        width={14}
        height={14}
      />
      {'Debug'}
    </>
  );
};

interface PartInspectionViewProps {
  inspectedId: string;
  part: InspectionPart;
}

const PartInspectionViewView = ({ inspectedId, part }: PartInspectionViewProps) => {
  const partInspection = usePartInspection(inspectedId, part);
  const contentClient = useContentClient();

  if (partInspection === null) {
    return <div>{'Loading'}</div>;
  }

  return (
    <InspectionView
      inspection={partInspection}
      path={[]}
      onExpanded={path => {
        contentClient.expandInspection(inspectedId, part, path);
      }}
      onGoToDefinition={(definition, path) => {
        if (definition.type === 'executor') {
          contentClient.startInspection(definition.id);
        } else {
          contentClient.goToDefinition(definition.type, part, path);
        }
      }}
    />
  );
};

interface PartChildrenInspectionViewProps {
  inspectedId: string;
  part: InspectionPart;
}

const PartChildrenInspectionViewView = ({ inspectedId, part }: PartChildrenInspectionViewProps) => {
  const partInspection = usePartInspection(inspectedId, part);
  const contentClient = useContentClient();

  if (partInspection === null) {
    return <div>{'Loading'}</div>;
  }

  if (!partInspection.hasChildren) {
    return <div>{'No ' + part}</div>;
  }

  return partInspection.children?.map((inspection, index) => (
    <InspectionView
      inspection={inspection}
      path={[index]}
      onExpanded={path => {
        contentClient.expandInspection(inspectedId, part, path);
      }}
      onGoToDefinition={(definition, path) => {
        if (definition.type === 'executor') {
          contentClient.startInspection(definition.id);
        } else {
          contentClient.goToDefinition(definition.type, part, path);
        }
      }}
    />
  ));
};
