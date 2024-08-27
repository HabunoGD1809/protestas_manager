import React, { ReactNode } from 'react';
import AuthLayout from './AuthLayout';

interface AuthLayoutWrapperProps {
   children: ReactNode;
}

const AuthLayoutWrapper: React.FC<AuthLayoutWrapperProps> = ({ children }) => {
   return <AuthLayout>{children}</AuthLayout>;
};

export default AuthLayoutWrapper;
