import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Home, 
  Server, 
  FileText, 
  AlertTriangle, 
  Settings, 
  Shield, 
  Terminal
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { state } = useAuth();
  const role = state.user?.role;

  return (
    <aside className="bg-gray-800 text-white w-64 flex-shrink-0 hidden md:block">
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-center h-16 border-b border-gray-700">
          <Shield className="h-8 w-8 text-blue-400" />
          <span className="ml-2 text-xl font-bold">SecureCloud</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-2 px-2">
            <li>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `flex items-center px-4 py-2 rounded-md ${
                    isActive
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`
                }
              >
                <Home className="h-5 w-5 mr-3" />
                <span>Dashboard</span>
              </NavLink>
            </li>

            {/* Admin and Developer can see VMs */}
            {(role === 'admin' || role === 'developer') && (
              <li>
                <NavLink
                  to="/vms"
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2 rounded-md ${
                      isActive
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`
                  }
                >
                  <Server className="h-5 w-5 mr-3" />
                  <span>Virtual Machines</span>
                </NavLink>
              </li>
            )}

            {/* Developer gets SSH access */}
            {role === 'developer' && (
              <li>
                <NavLink
                  to="/terminal"
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2 rounded-md ${
                      isActive
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`
                  }
                >
                  <Terminal className="h-5 w-5 mr-3" />
                  <span>SSH Terminal</span>
                </NavLink>
              </li>
            )}

            {/* SOC gets logs and alerts */}
            {role === 'soc' && (
              <>
                <li>
                  <NavLink
                    to="/logs"
                    className={({ isActive }) =>
                      `flex items-center px-4 py-2 rounded-md ${
                        isActive
                          ? 'bg-gray-700 text-white'
                          : 'text-gray-300 hover:bg-gray-700'
                      }`
                    }
                  >
                    <FileText className="h-5 w-5 mr-3" />
                    <span>System Logs</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/alerts"
                    className={({ isActive }) =>
                      `flex items-center px-4 py-2 rounded-md ${
                        isActive
                          ? 'bg-gray-700 text-white'
                          : 'text-gray-300 hover:bg-gray-700'
                      }`
                    }
                  >
                    <AlertTriangle className="h-5 w-5 mr-3" />
                    <span>Security Alerts</span>
                  </NavLink>
                </li>
              </>
            )}

            <li>
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `flex items-center px-4 py-2 rounded-md ${
                    isActive
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`
                }
              >
                <Settings className="h-5 w-5 mr-3" />
                <span>Settings</span>
              </NavLink>
            </li>
          </ul>
        </nav>
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center">
            <div className="bg-gray-600 rounded-full p-2">
              <Shield className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{state.user?.username}</p>
              <p className="text-xs text-gray-400 capitalize">{state.user?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;