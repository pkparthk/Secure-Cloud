export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'developer' | 'soc';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface MfaVerification {
  email: string;
  totpCode: string;
}

export interface VM {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'terminated';
  type: string;
  ip: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  source: string;
  message: string;
  details?: string;
}

export interface Alert {
  id: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  source: string;
  status: 'new' | 'acknowledged' | 'resolved';
}