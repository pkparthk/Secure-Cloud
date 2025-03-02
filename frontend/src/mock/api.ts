import MockAdapter from 'axios-mock-adapter';
import { api } from '../services/api';

// Create a mock instance
const mock = new MockAdapter(api, { delayResponse: 1000 });

// Mock users
const users = [
  {
    id: '1',
    username: 'admin_user',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
  },
  {
    id: '2',
    username: 'developer_user',
    email: 'developer@example.com',
    password: 'dev123',
    role: 'developer',
  },
  {
    id: '3',
    username: 'soc_user',
    email: 'soc@example.com',
    password: 'soc123',
    role: 'soc',
  },
];

// Mock VMs
const vms = [
  {
    id: 'vm-001',
    name: 'Production Server',
    status: 'running',
    type: 't2.medium',
    ip: '10.0.1.5',
  },
  {
    id: 'vm-002',
    name: 'Development Server',
    status: 'running',
    type: 't2.small',
    ip: '10.0.1.6',
  },
  {
    id: 'vm-003',
    name: 'Test Server',
    status: 'stopped',
    type: 't2.micro',
    ip: '10.0.1.7',
  },
  {
    id: 'vm-004',
    name: 'Database Server',
    status: 'running',
    type: 't2.large',
    ip: '10.0.1.8',
  },
];

// Mock logs
const logs = [
  {
    id: 'log-001',
    timestamp: '2023-10-11T08:30:45Z',
    level: 'info',
    source: 'auth-service',
    message: 'User login successful',
    details: 'User admin_user logged in from IP 192.168.1.10',
  },
  {
    id: 'log-002',
    timestamp: '2023-10-11T08:35:12Z',
    level: 'warning',
    source: 'api-gateway',
    message: 'Rate limit exceeded',
    details: 'Client IP 203.0.113.5 exceeded rate limit for /api/users endpoint',
  },
  {
    id: 'log-003',
    timestamp: '2023-10-11T09:15:30Z',
    level: 'error',
    source: 'database-service',
    message: 'Database connection failed',
    details: 'Failed to connect to database server at 10.0.1.8:5432',
  },
  {
    id: 'log-004',
    timestamp: '2023-10-11T09:45:22Z',
    level: 'info',
    source: 'vm-service',
    message: 'VM instance started',
    details: 'VM instance vm-003 started by user developer_user',
  },
  {
    id: 'log-005',
    timestamp: '2023-10-11T10:05:18Z',
    level: 'critical',
    source: 'security-service',
    message: 'Multiple failed login attempts',
    details: 'Multiple failed login attempts for user admin_user from IP 203.0.113.10',
  },
  {
    id: 'log-006',
    timestamp: '2023-10-11T10:30:45Z',
    level: 'warning',
    source: 'network-monitor',
    message: 'High network traffic detected',
    details: 'Unusual network traffic pattern detected on VM vm-001',
  },
];

// Mock alerts
const alerts = [
  {
    id: 'alert-001',
    timestamp: '2023-10-11T10:05:18Z',
    severity: 'high',
    message: 'Multiple failed login attempts detected',
    source: 'security-service',
    status: 'new',
  },
  {
    id: 'alert-002',
    timestamp: '2023-10-11T09:15:30Z',
    severity: 'medium',
    message: 'Database connection failure',
    source: 'database-service',
    status: 'acknowledged',
  },
  {
    id: 'alert-003',
    timestamp: '2023-10-11T08:35:12Z',
    severity: 'low',
    message: 'API rate limit exceeded',
    source: 'api-gateway',
    status: 'resolved',
  },
  {
    id: 'alert-004',
    timestamp: '2023-10-11T11:22:05Z',
    severity: 'critical',
    message: 'Potential data exfiltration detected',
    source: 'ml-analysis',
    status: 'new',
  },
];

// Mock login endpoint
mock.onPost('/auth/login').reply((config) => {
  const { email, password } = JSON.parse(config.data);
  const user = users.find((u) => u.email === email && u.password === password);

  if (user) {
    return [
      200,
      {
        requireMfa: true,
        message: 'MFA required',
        email: user.email,
      },
    ];
  }

  return [401, { message: 'Invalid credentials' }];
});

// Mock MFA verification endpoint
mock.onPost('/auth/verify-mfa').reply((config) => {
  const { email, totpCode } = JSON.parse(config.data);
  const user = users.find((u) => u.email === email);

  if (user && totpCode.length === 6) {
    // In a real app, we would validate the TOTP code
    // For this mock, we'll accept any 6-digit code
    const { password, ...userWithoutPassword } = user;
    return [
      200,
      {
        token: 'mock-jwt-token',
        user: userWithoutPassword,
      },
    ];
  }

  return [401, { message: 'Invalid verification code' }];
});

// Mock user profile endpoint
mock.onGet('/users/profile').reply((config) => {
  const authHeader = config.headers?.Authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // In a real app, we would validate the token
    // For this mock, we'll return the admin user
    const { password, ...userWithoutPassword } = users[0];
    return [200, userWithoutPassword];
  }
  
  return [401, { message: 'Unauthorized' }];
});

// Mock setup MFA endpoint
mock.onPost('/users/setup-mfa').reply(200, {
  qrCodeUrl: 'https://example.com/qr-code',
  secretKey: 'EXAMPLEKEY123456',
});

// Mock VMs endpoint
mock.onGet('/vms').reply(200, vms);

// Mock VM access request endpoint
mock.onPost(/\/vms\/.*\/access/).reply(200, {
  message: 'Access granted',
  sessionUrl: '/terminal',
});

// Mock logs endpoint
mock.onGet('/logs').reply(200, logs);

// Mock alerts endpoint
mock.onGet('/logs/alerts').reply(200, alerts);

console.log('Mock API initialized');