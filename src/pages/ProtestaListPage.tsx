import React from 'react';
import ProtestaList from '../components/Protesta/ProtestaList';
import ProtestaStats from '../components/Protesta/ProtestaStats';

const ProtestaListPage: React.FC = () => {
  return (
    <div>
      <h1>Dashboard de Protestas</h1>
      <ProtestaStats />
      <ProtestaList />
    </div>
  );
};

export default ProtestaListPage;
