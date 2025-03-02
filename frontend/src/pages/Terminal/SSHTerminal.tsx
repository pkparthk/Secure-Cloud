import React, { useState, useEffect } from 'react';
import { Terminal as TerminalIcon, X, Maximize2, Minimize2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const SSHTerminal: React.FC = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [output, setOutput] = useState<string[]>([
    'Connecting to secure shell...',
    'Authenticating...',
  ]);
  const [command, setCommand] = useState('');
  const { state } = useAuth();

  useEffect(() => {
    // Simulate connection
    const timer = setTimeout(() => {
      setConnected(true);
      setOutput((prev) => [
        ...prev,
        'Authentication successful',
        'Connected to dev-vm-01',
        'Welcome to Ubuntu 22.04.1 LTS',
        'Last login: Wed Oct 11 2023 from 192.168.1.10',
        '',
        'developer@dev-vm-01:~$ ',
      ]);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!command.trim()) return;
    
    // Add command to output
    setOutput((prev) => [
      ...prev,
      `developer@dev-vm-01:~$ ${command}`,
    ]);

    // Simulate command response
    let response: string[] = [];
    
    if (command === 'ls') {
      response = ['app  config  logs  node_modules  package.json  README.md  src'];
    } else if (command === 'whoami') {
      response = ['developer'];
    } else if (command === 'pwd') {
      response = ['/home/developer'];
    } else if (command === 'sudo su') {
      response = [
        '[sudo] password for developer:',
        'Sorry, user developer is not allowed to execute sudo on dev-vm-01.',
      ];
    } else if (command === 'clear') {
      setOutput(['developer@dev-vm-01:~$ ']);
      setCommand('');
      return;
    } else if (command.startsWith('cd ')) {
      response = [];
    } else {
      response = [`Command not found: ${command}`];
    }
    
    // Add response to output
    setTimeout(() => {
      setOutput((prev) => [
        ...prev,
        ...response,
        'developer@dev-vm-01:~$ ',
      ]);
      setCommand('');
    }, 300);
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'h-[600px]'}`}>
      <div className="flex flex-col h-full">
        <div className="bg-gray-800 text-white px-4 py-2 flex justify-between items-center">
          <div className="flex items-center">
            <TerminalIcon className="h-5 w-5 mr-2" />
            <span className="font-mono">SSH: dev-vm-01</span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1 hover:bg-gray-700 rounded"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={() => window.history.back()}
              className="p-1 hover:bg-gray-700 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 bg-black text-green-400 p-4 font-mono text-sm overflow-auto">
          {output.map((line, index) => (
            <div key={index} className="whitespace-pre-wrap">
              {line}
            </div>
          ))}
          {connected && (
            <form onSubmit={handleCommand} className="flex">
              <span className="mr-0"></span>
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                className="flex-1 bg-transparent outline-none text-green-400 font-mono"
                autoFocus
              />
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SSHTerminal;