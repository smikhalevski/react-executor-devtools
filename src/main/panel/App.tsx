import React, { Fragment } from 'react';
import type { InspectionPart } from '../content/types';
import { InspectionView } from './components/InspectionView';
import { Layout } from './components/Layout';
import { ListItem } from './components/ListItem';
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
  const info = useSuperficialInfo(id);
  const contentClient = useContentClient();

  return (
    <ListItem
      onClick={() => {
        contentClient.startInspection(id);
      }}
      isSelected={id === inspectedId}
    >
      {info.keyDescription}
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
      {'Plugins'}
      <PartInspectionViewView
        inspectedId={inspectedId}
        part={'plugins'}
      />
      <hr />
      {'Annotations'}
      <PartInspectionViewView
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

  return (
    <>
      {superficialInfo.stats.settledAt === 0
        ? '⚪️ Clean'
        : superficialInfo.stats.isFulfilled
          ? '🟢 Fulfilled'
          : '🔴 Rejected'}

      {superficialInfo.stats.isActive ? (
        <>
          <br />
          {'🔌 Active'}
        </>
      ) : null}

      {superficialInfo.stats.invalidatedAt === 0 ? null : (
        <>
          <br />
          {'❌ Invalidated'}
        </>
      )}
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
    return 'Loading';
  }

  return (
    <InspectionView
      inspection={partInspection}
      path={[]}
      onExpanded={path => {
        contentClient.expandInspection(inspectedId, part, path);
      }}
    />
  );
};
