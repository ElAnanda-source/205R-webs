import type {
  AccountSettings,
  AuditLogEntry,
  AuthStatus,
  PerformanceSummary,
  PublicPortfolioSummary,
  PublicTradeRecord,
  RiskParameters,
  SiteContent,
  TradeTransaction,
} from '../types/trading';

export interface PortfolioPayload {
  authenticated: boolean;
  currency: string;
  transactions: PublicTradeRecord[];
  account: AccountSettings | null;
  riskParameters: RiskParameters;
  siteContent: SiteContent;
  performance: PerformanceSummary | null;
  publicSummary: PublicPortfolioSummary;
}

export interface AdminOverviewPayload {
  transactions: TradeTransaction[];
  account: AccountSettings;
  riskParameters: RiskParameters;
  siteContent: SiteContent;
  performance: PerformanceSummary;
  auditLogs: AuditLogEntry[];
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers ?? {});
  if (!headers.has('Content-Type') && init?.body) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('X-Requested-With', 'XMLHttpRequest');

  const res = await fetch(url, {
    ...init,
    headers,
    credentials: 'include',
  });

  const text = await res.text();
  let parsed: unknown = {};
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { error: text };
    }
  }

  if (!res.ok) {
    const errObj = parsed as { error?: string } & Record<string, unknown>;
    const err = new Error(errObj.error || `Request failed with status ${res.status}`) as Error & {
      status?: number;
      payload?: unknown;
    };
    err.status = res.status;
    err.payload = parsed;
    throw err;
  }

  return parsed as T;
}

export const api = {
  getPortfolio: () => requestJson<PortfolioPayload>('/api/portfolio'),
  getAuthStatus: () => requestJson<AuthStatus>('/api/auth/status'),
  setupPin: (pin: string) =>
    requestJson<{ authenticated: boolean; status: AuthStatus }>('/api/auth/setup', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    }),
  loginWithPin: (pin: string) =>
    requestJson<{ authenticated: boolean; status: AuthStatus }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    }),
  logout: () =>
    requestJson<{ authenticated: boolean }>('/api/auth/logout', {
      method: 'POST',
    }),
  getAdminOverview: () => requestJson<AdminOverviewPayload>('/api/admin/overview'),
  createTransaction: (payload: Partial<TradeTransaction>) =>
    requestJson<{ transaction: TradeTransaction }>('/api/admin/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateTransaction: (id: number, payload: Partial<TradeTransaction>) =>
    requestJson<{ transaction: TradeTransaction }>(`/api/admin/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteTransaction: (id: number) =>
    requestJson<{ deleted: boolean; id: number }>(`/api/admin/transactions/${id}`, {
      method: 'DELETE',
    }),
  importCsv: (csvText: string, replaceExisting: boolean) =>
    requestJson<{ importedCount: number; warnings: string[] }>(
      '/api/admin/transactions/import-csv',
      {
        method: 'POST',
        body: JSON.stringify({ csvText, replaceExisting }),
      }
    ),
  uploadScreenshot: (filename: string, mimeType: string, dataBase64: string) =>
    requestJson<{ url: string; filename: string }>('/api/admin/uploads', {
      method: 'POST',
      body: JSON.stringify({ filename, mimeType, dataBase64 }),
    }),
  deleteScreenshot: (filename: string) =>
    requestJson<{ deleted: boolean }>(`/api/admin/uploads/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
    }),
  updateAccount: (payload: AccountSettings) =>
    requestJson<{ account: AccountSettings }>('/api/admin/account', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  updateRisk: (payload: RiskParameters) =>
    requestJson<{ riskParameters: RiskParameters }>('/api/admin/risk', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  updateContent: (payload: SiteContent) =>
    requestJson<{ siteContent: SiteContent }>('/api/admin/content', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  changePin: (currentPin: string, newPin: string) =>
    requestJson<{ updated: boolean }>('/api/admin/pin', {
      method: 'PUT',
      body: JSON.stringify({ currentPin, newPin }),
    }),
  restoreBackup: (backupPayload: unknown) =>
    requestJson<{ restoredCount: number }>('/api/admin/restore', {
      method: 'POST',
      body: JSON.stringify(backupPayload),
    }),
};
