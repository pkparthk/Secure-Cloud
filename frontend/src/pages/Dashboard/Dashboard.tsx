import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Server, FileText, AlertTriangle, Shield } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { state } = useAuth();
  const role = state.user?.role;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {state.user?.username}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Admin and Developer see VM stats */}
        {(role === 'admin' || role === 'developer') && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <Server className="h-8 w-8" />
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-gray-700">Virtual Machines</h2>
                <p className="text-gray-500">
                  {role === 'admin' ? 'Monitor VM instances' : 'Access development VMs'}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <a
                href="/vms"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View all VMs →
              </a>
            </div>
          </div>
        )}

        {/* SOC sees log stats */}
        {role === 'soc' && (
          <>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <FileText className="h-8 w-8" />
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-700">System Logs</h2>
                  <p className="text-gray-500">View and analyze system logs</p>
                </div>
              </div>
              <div className="mt-4">
                <a
                  href="/logs"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View logs →
                </a>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100 text-red-600">
                  <AlertTriangle className="h-8 w-8" />
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-700">Security Alerts</h2>
                  <p className="text-gray-500">Monitor security incidents</p>
                </div>
              </div>
              <div className="mt-4">
                <a
                  href="/alerts"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View alerts →
                </a>
              </div>
            </div>
          </>
        )}

        {/* All roles see security settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <Shield className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-700">Security Settings</h2>
              <p className="text-gray-500">Manage MFA and security preferences</p>
            </div>
          </div>
          <div className="mt-4">
            <a
              href="/settings"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View settings →
            </a>
          </div>
        </div>
      </div>

      {/* Role-specific welcome message */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {role === 'admin'
            ? 'Admin Portal'
            : role === 'developer'
            ? 'Developer Workspace'
            : 'Security Operations Center'}
        </h2>
        <p className="text-gray-600">
          {role === 'admin'
            ? 'As an admin, you have read-only access to VM instances. Use the dashboard to monitor system status and manage user access.'
            : role === 'developer'
            ? 'As a developer, you have SSH access to development environment VMs. Use the terminal to connect to your assigned resources.'
            : 'As a SOC analyst, you have access to system logs and security alerts. Use the dashboard to monitor and respond to security events.'}
        </p>
      </div>
    </div>
  );
};

export default Dashboard;