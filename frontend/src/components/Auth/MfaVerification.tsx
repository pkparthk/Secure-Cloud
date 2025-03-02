import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Shield } from "lucide-react";

interface MfaVerificationProps {
  username: string;
}

const MfaVerification: React.FC<MfaVerificationProps> = ({ username }) => {
  const { verifyMfa, state } = useAuth();
  const [totpCode, setTotpCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.length === 6) {
      await verifyMfa({ username, totpCode });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-lg shadow-md">
        <div className="text-center">
          <div className="flex justify-center">
            <Shield className="h-12 w-12 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-white">
            Two-Factor Authentication
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Enter the verification code from your authenticator app
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="totp-code"
              className="block text-sm font-medium text-gray-300"
            >
              Verification Code
            </label>
            <input
              id="totp-code"
              name="totp-code"
              type="text"
              autoComplete="one-time-code"
              required
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-600 bg-gray-700 rounded-md shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Enter 6-digit code"
              maxLength={6}
              pattern="[0-9]{6}"
              inputMode="numeric"
            />
          </div>

          {state.error && (
            <div className="text-red-500 text-sm text-center">
              {state.error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={state.isLoading || totpCode.length !== 6}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {state.isLoading ? "Verifying..." : "Verify"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MfaVerification;
