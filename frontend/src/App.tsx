import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layouts
import MainLayout from './components/Layout/MainLayout';

// Auth Pages
import Login from './pages/Auth/Login';

// Dashboard Pages
import Dashboard from './pages/Dashboard/Dashboard';
import VMList from './pages/VMs/VMList';
import SSHTerminal from './pages/Terminal/SSHTerminal';
import LogViewer from './pages/Logs/LogViewer';
import SecurityAlerts from './pages/Alerts/SecurityAlerts';
import SecuritySettings from './pages/Settings/SecuritySettings';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="vms" element={<VMList />} />
            <Route path="terminal" element={<SSHTerminal />} />
            <Route path="logs" element={<LogViewer />} />
            <Route path="alerts" element={<SecurityAlerts />} />
            <Route path="settings" element={<SecuritySettings />} />
          </Route>
          
          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
      <ToastContainer position="top-right" autoClose={5000} />
    </AuthProvider>
  );
}

export default App;