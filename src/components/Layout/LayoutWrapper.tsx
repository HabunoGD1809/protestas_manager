import React, { ReactNode } from 'react';
import Layout from './Layout';

interface LayoutWrapperProps {
   children: ReactNode;
}

const LayoutWrapper: React.FC<LayoutWrapperProps> = ({ children }) => {
   return <Layout>{children}</Layout>;
};

export default LayoutWrapper;
