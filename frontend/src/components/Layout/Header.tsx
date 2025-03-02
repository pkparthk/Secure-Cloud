import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Bell, User } from 'lucide-react';

const Header: React.FC = () => {
  const { state, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-800">
              Secure Cloud Access System
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button className="p-1 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none">
                <Bell className="h-6 w-6" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
              </button>
            </div>
            <div className="flex items-center">
              <div className="ml-3 relative group">
                <div className="flex items-center space-x-2">
                  <div className="bg-gray-200 rounded-full p-2">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-gray-700">
                      {state.user?.username}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {state.user?.role}
                    </div>
                  </div>
                  <div className="ml-2 flex items-center">
                    <button
                      onClick={logout}
                      className="p-1 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none"
                      title="Logout"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;