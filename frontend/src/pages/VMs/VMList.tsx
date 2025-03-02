import React, { useState, useEffect } from 'react';
import { vmService } from '../../services/api';
import { VM } from '../../types';
import { Server, Power, PowerOff, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const VMList: React.FC = () => {
  const [vms, setVms] = useState<VM[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { state } = useAuth();
  const isAdmin = state.user?.role === 'admin';

  useEffect(() => {
    const fetchVMs = async () => {
      try {
        const response = await vmService.getVMs();
        setVms(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch VM instances');
        setLoading(false);
      }
    };

    fetchVMs();
  }, []);

  const handleAccessRequest = async (vmId: string) => {
    try {
      await vmService.requestAccess(vmId);
      // Redirect to terminal or show access instructions
      window.location.href = '/terminal';
    } catch (err) {
      setError('Failed to request access');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-800';
      case 'stopped':
        return 'bg-yellow-100 text-yellow-800';
      case 'terminated':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Virtual Machines</h1>
        <p className="text-gray-600">
          {isAdmin
            ? 'View and monitor VM instances'
            : 'Access development environment VMs'}
        </p>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Instance
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                IP Address
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {vms.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  No virtual machines available
                </td>
              </tr>
            ) : (
              vms.map((vm) => (
                <tr key={vm.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-100 rounded-md">
                        <Server className="h-6 w-6 text-gray-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{vm.name}</div>
                        <div className="text-sm text-gray-500">ID: {vm.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(vm.status)}`}>
                      {vm.status === 'running' ? (
                        <Power className="h-4 w-4 mr-1" />
                      ) : (
                        <PowerOff className="h-4 w-4 mr-1" />
                      )}
                      {vm.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {vm.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {vm.ip}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {isAdmin ? (
                      <span className="text-gray-500">Read-only access</span>
                    ) : (
                      <button
                        onClick={() => handleAccessRequest(vm.id)}
                        disabled={vm.status !== 'running'}
                        className={`inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white ${
                          vm.status === 'running'
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'bg-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Connect
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VMList;