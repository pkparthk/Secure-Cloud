import React, { useState } from 'react';
import { userService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Shield, QrCode, Key, Lock } from 'lucide-react';

const SecuritySettings: React.FC = () => {
  const { state } = useAuth();
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const setupMfa = async () => {
    try {
      setError(null);
      const response = await userService.setupMfa();
      setQrCodeUrl(response.data.qrCodeUrl);
      setSecretKey(response.data.secretKey);
      setShowQRCode(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to setup MFA');
    }
  };

  const verifyMfa = async () => {
    try {
      setError(null);
      // This would be an API call to verify the MFA code
      // await userService.verifyMfaSetup({ code: verificationCode });
      setSuccess('MFA has been successfully set up');
      setShowQRCode(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid verification code');
    }
  };

  const toggleMfa = () => {
    if (!mfaEnabled) {
      setupMfa();
    } else {
      setMfaEnabled(false);
      setSuccess('MFA has been disabled');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Security Settings</h1>
        <p className="text-gray-600">Manage your account security preferences</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{success}</span>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Multi-Factor Authentication</h2>
          
          <div className="flex items-center justify-between py-4 border-b border-gray-200">
            <div className="flex items-center">
              <Shield className="h-6 w-6 text-blue-500 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-gray-900">Two-Factor Authentication (TOTP)</h3>
                <p className="text-sm text-gray-500">
                  Add an extra layer of security to your account using an authenticator app
                </p>
              </div>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={toggleMfa}
                className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  mfaEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
                role="switch"
                aria-checked={mfaEnabled}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                    mfaEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                ></span>
              </button>
            </div>
          </div>

          {showQRCode && (
            <div className="mt-6 p-4 border border-gray-200 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Set up authenticator app</h3>
              <p className="text-sm text-gray-500 mb-4">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>
              
              <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
                <div className="flex-shrink-0 bg-gray-100 p-4 rounded-lg">
                  <QrCode className="h-32 w-32 text-gray-700" />
                  <p className="text-xs text-center mt-2 text-gray-500">QR Code Placeholder</p>
                </div>
                
                <div className="flex-1">
                  <div className="mb-4">
                    <label htmlFor="secret-key" className="block text-sm font-medium text-gray-700 mb-1">
                      Secret Key
                    </label>
                    <div className="flex items-center">
                      <input
                        type="text"
                        id="secret-key"
                        value={secretKey || 'EXAMPLEKEY123456'}
                        readOnly
                        className="flex-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md bg-gray-50"
                      />
                      <button
                        type="button"
                        className="ml-2 inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      If you can't scan the QR code, enter this secret key manually in your app
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700 mb-1">
                      Verification Code
                    </label>
                    <div className="flex items-center">
                      <input
                        type="text"
                        id="verification-code"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                      <button
                        type="button"
                        onClick={verifyMfa}
                        disabled={verificationCode.length !== 6}
                        className="ml-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        Verify
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Additional Security Settings</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-4 border-b border-gray-200">
              <div className="flex items-center">
                <Key className="h-6 w-6 text-blue-500 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-gray-900">API Access Keys</h3>
                  <p className="text-sm text-gray-500">
                    Manage API keys for programmatic access
                  </p>
                </div>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Manage
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between py-4 border-b border-gray-200">
              <div className="flex items-center">
                <Lock className="h-6 w-6 text-blue-500 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Password Settings</h3>
                  <p className="text-sm text-gray-500">
                    Update your password and security questions
                  </p>
                </div>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Change
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;