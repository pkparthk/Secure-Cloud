import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoginForm from '../../components/Auth/LoginForm';
import MfaVerification from '../../components/Auth/MfaVerification';

const Login: React.FC = () => {
  const { state } = useAuth();
  const [email, setEmail] = useState('');

  // If already authenticated, redirect to dashboard
  if (state.isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  // Handle successful login but MFA required
  if (state.error === 'MFA required') {
    return <MfaVerification email={email} />;
  }

  return <LoginForm />;
};

export default Login;