import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { UserContext } from '../context/UserContext';
import Spinner from './common/Spinner';

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;
  height: 100vh;
  color: #64748b;
`;

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(UserContext);
  const isAuthenticated = !!user;
  const location = useLocation();

  if (loading) {
    return (
      <LoadingContainer role="status" aria-live="polite">
        <Spinner />
        <p>Verifying authentication...</p>
      </LoadingContainer>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;