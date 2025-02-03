// if user tries to open this page without signing in...
import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const storedUser = localStorage.getItem('bacshotsUser');
  if (!storedUser) {
    return <Navigate to="/signin" replace />;
  }
  return children;
}
