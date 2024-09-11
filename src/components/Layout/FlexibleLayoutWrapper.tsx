import React, { ReactNode } from 'react';
import FlexibleLayout from './FlexibleLayout';

interface FlexibleLayoutWrapperProps {
   children: ReactNode;
   maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
   containerMaxWidth?: number | string;
}

const FlexibleLayoutWrapper: React.FC<FlexibleLayoutWrapperProps> = ({
   children,
   maxWidth,
   containerMaxWidth
}) => {
   return (
      <FlexibleLayout
         maxWidth={maxWidth}
         containerMaxWidth={containerMaxWidth}
      >
         {children}
      </FlexibleLayout>
   );
};

export default FlexibleLayoutWrapper;
