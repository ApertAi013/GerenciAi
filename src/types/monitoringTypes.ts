// Admin Monitoring Types

export interface BackendMetrics {
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  cpu: {
    user: number;
    system: number;
  };
  nodeVersion: string;
  platform: string;
  pid: number;
}

export interface DatabaseMetrics {
  connectionPool: {
    total: number;
    active: number;
    idle: number;
  };
  queries: {
    total: number;
    slow: number;
    avgTime: number;
  };
  tables: Record<string, { rows: number; size: string }>;
}

export interface APIMetrics {
  requests: {
    total: number;
    success: number;
    errors: number;
    avgResponseTime: number;
  };
  endpoints: Array<{
    path: string;
    method: string;
    count: number;
    avgTime: number;
  }>;
}

export interface UsersMetrics {
  total: number;
  active: number;
  premium: number;
  byRole: Record<string, number>;
  recentSignups: number;
}

export interface GCPMetricData {
  current: number;
  avg: number;
  min: number;
  max: number;
  dataPoints: Array<{
    timestamp: string;
    value: number;
  }>;
}

export interface CloudSQLMetrics {
  instance: string;
  cpu: GCPMetricData;
  memory: GCPMetricData;
  connections: GCPMetricData;
  timestamp: string;
  error?: string;
}

export interface CloudRunMetrics {
  service: string;
  requests: GCPMetricData;
  latency: GCPMetricData;
  instances: GCPMetricData;
  timestamp: string;
  error?: string;
}

export interface GCPCosts {
  projectId: string;
  billingEnabled: boolean;
  billingAccountName: string;
  message: string;
  timestamp: string;
  error?: string;
}

export interface GCPMetrics {
  projectId: string;
  cloudSQL: CloudSQLMetrics;
  cloudRun: CloudRunMetrics;
  billing: GCPCosts;
  timestamp: string;
  enabled?: boolean;
}

export interface DashboardMetrics {
  backend: BackendMetrics;
  database: DatabaseMetrics;
  api: APIMetrics;
  users: UsersMetrics;
  timestamp: string;
}

export interface HealthCheck {
  timestamp: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    backend: {
      status: string;
      uptime: number;
      memory: any;
    };
    database: {
      status: string;
      error?: string;
    };
    tables?: Record<string, {
      status: string;
      count: number;
    }>;
  };
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'admin' | 'gestor' | 'professor' | 'aluno';
  status: 'active' | 'inactive';
  premium_features: string[];
  created_at: string;
  last_login?: string | null;
  total_enrollments?: number;
  total_conversations?: number;
  hasPremium?: boolean;
  hasUnlimited?: boolean;
}

export interface UserDetails {
  user: User;
  statistics: {
    aiUsage: {
      totalConversations: number;
      totalActions: number;
      totalTokens: number;
      lastUse: string | null;
      currentMonthUsage: number;
    };
    enrollments: {
      total: number;
      list: any[];
    };
  };
  recentActivity: any[];
}

export interface Feature {
  feature_code: string;
  feature_name: string;
  free_monthly_limit: number;
  description: string;
  is_active: boolean;
}

export interface FeatureStats {
  dailyUsage: Array<{
    date: string;
    uses: number;
    unique_users: number;
    total_tokens: number;
  }>;
  topUsers: Array<{
    id: number;
    full_name: string;
    email: string;
    uses: number;
  }>;
}

export interface UpdateUserFeaturesData {
  features: string[];
}

export interface UpdateUserRoleData {
  role: 'admin' | 'gestor' | 'professor' | 'aluno';
}

export interface UpdateUserStatusData {
  status: 'active' | 'inactive';
}

export interface UsersListParams {
  role?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}
