export interface LoginActivity {
  id: string;
  ipAddress: string;
  userAgent: string;
  deviceType: string;
  location: string;
  successful: boolean;
  loginAt: string;
}

export interface LoginActivitiesResponse {
  success: boolean;
  data: {
    activities: LoginActivity[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  message: string;
  errors: Record<string, string[]> | undefined;
  meta: {
    timestamp: string;
    version: string;
  };
}
