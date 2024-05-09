import React from 'react';
import { Layout } from './components/Layout';
import { ListItem } from './components/ListItem';
import { useIds, useInspectedId, useSuperficialInfo } from './executors';
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

  return <SuperficialInfoView inspectedId={inspectedId} />;
};

interface SuperficialInfoViewProps {
  inspectedId: string;
}

const SuperficialInfoView = ({ inspectedId }: SuperficialInfoViewProps) => {
  const superficialInfo = useSuperficialInfo(inspectedId);

  return JSON.stringify(superficialInfo);
};
