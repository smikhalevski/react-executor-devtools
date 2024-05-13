import React from 'react';
import { InspectorView } from './components/InspectorView';
import { Layout } from './components/Layout';
import { ListView } from './components/ListView';

export const App = () => {
  return (
    <Layout
      leftBlock={<ListView />}
      rightBlock={<InspectorView />}
    />
  );
};
