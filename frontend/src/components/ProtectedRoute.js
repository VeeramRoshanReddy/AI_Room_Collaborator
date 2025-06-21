import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserContext } from '../context/UserContext';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useUserContext();
    const location = useLocation();

  // Show loading while checking authentication
    if (loading) {
    return (
        <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '10px'
        }}>
        <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #4285f4',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
        }} />
        <p>Verifying authentication...</p>
        <style jsx>{`
            @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
            }
        `}</style>
        </div>
    );
    }

  // Redirect to login if not authenticated
    if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;