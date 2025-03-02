import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Shield, User, Lock } from "lucide-react";

const LoginForm: React.FC = () => {
  const { login, state } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<
    "admin" | "developer" | "soc" | null
  >(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    await login({ username, password });
  };

  const handleRoleSelect = (role: "admin" | "developer" | "soc") => {
    setSelectedRole(role);
  };

  const getRoleDescription = () => {
    switch (selectedRole) {
      case "admin":
        return "Admin role provides read-only access to VM instances";
      case "developer":
        return "Developer role provides SSH access to development VMs";
      case "soc":
        return "SOC role provides access to logs and security alerts";
      default:
        return "Select a role to continue";
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
            Secure Cloud Access
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Enter your credentials to access the system
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-4">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 pl-10 border border-gray-600 bg-gray-700 placeholder-gray-400 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="username"
                />
              </div>
            </div>
            <div className="mb-4">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 pl-10 border border-gray-600 bg-gray-700 placeholder-gray-400 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="********"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["admin", "developer", "soc"].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() =>
                    handleRoleSelect(role as "admin" | "developer" | "soc")
                  }
                  className={`py-2 px-4 rounded-md text-center ${
                    selectedRole === role
                      ? "bg-white text-gray-900 font-medium"
                      : "bg-gray-700 text-white hover:bg-gray-600"
                  }`}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-400">{getRoleDescription()}</p>
          </div>

          {state.error && (
            <div className="text-red-500 text-sm">{state.error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={state.isLoading || !selectedRole}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state.isLoading ? "Signing in..." : "Sign In"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
