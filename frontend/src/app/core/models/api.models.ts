export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  requestId?: string;
}

export interface CurrentUser {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'MANAGER' | 'OPERATOR' | 'VIEWER';
}

export interface LoginResult {
  accessToken: string;
  user: CurrentUser;
}

export interface PageResult<T> {
  items: T[];
  nextCursor?: string | null;
  total?: number;
}

export interface DashboardSummary {
  whatsappStatus: string;
  totalContacts: number;
  totalGroups: number;
  messagesSentToday: number;
  messagesDelivered: number;
  messagesRead: number;
  messagesFailed: number;
  campaignsRunning: number;
  campaignsCompleted: number;
  mediaSent: number;
  apiUsage: number;
  queuePending: number;
  queueFailed: number;
  messageVolume: Array<{ date: string; dayLabel?: string; sent: number; failed: number }>;
  latestMessages: Array<{ id: string; recipient: string; status: string; createdAt: string; body?: string; hasMedia?: boolean; bodySnippet?: string }>;
}

export interface Contact {
  id: string;
  displayName: string | null;
  phoneE164: string;
  email?: string | null;
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  status: string;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  providerGroupId: string;
  participantCount: number;
  updatedAt: string;
}

export interface BulkSendItem {
  target: string;
  name?: string;
  type: 'contact' | 'group' | 'manual';
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface BulkSendResult {
  total: number;
  sent: number;
  failed: number;
  details: BulkSendItem[];
}