import axiosInstance from './axiosInstance';

export interface AdminOrderStats {
    today: number;
    thisWeek: number;
    thisMonth: number;
    pendingCapture: number;
    failedOrCancelled: number;
    totalRevenueInOre: number;
    monthRevenueInOre: number;
}

export interface AdminSubscriptionStats {
    active: number;
    pendingConfirm: number;
    stoppedThisMonth: number;
    monthlyRecurringInOre: number;
}

export interface AdminStats {
    totalUsers: number;
    totalSensors: number;
    totalSwitches: number;
    activeAutomations: number;
    // Optional so the UI keeps loading even if it talks to an older API build
    // that hasn't shipped the new commerce stats yet.
    orders?: AdminOrderStats;
    subscriptions?: AdminSubscriptionStats;
}

export interface AdminUser {
    id: string;
    userName: string;
    firstName: string;
    lastName: string;
    email: string;
    /** True for soft-deleted (scrubbed) accounts. Hidden by default; shown via the "Show deleted" toggle. */
    isDeleted: boolean;
    roles: string[];
}

export interface StatSnapshot {
    date: string;
    totalUsers: number;
    totalSensors: number;
    totalSwitches: number;
    totalAutomations: number;
}

export interface DiscoveredDevice {
    id: number;
    discoveredBy: string;
    target: string;
    type: string;
    timestamp: string;
}

export interface EmailStats {
    requests: number;
    delivered: number;
    hardBounces: number;
    softBounces: number;
    spamReports: number;
    blocked: number;
    invalid: number;
    days: number;
}

export interface AppSettings {
    cookieBannerEnabled: boolean;
    vatEnabled: boolean;
    vippsTestMode: boolean;
}

const AdminService = {
    async getStats(opts?: { test?: boolean }): Promise<AdminStats> {
        const res = await axiosInstance.get<AdminStats>('/admin/stats', {
            params: opts?.test ? { test: true } : undefined,
        });
        return res.data;
    },

    async getDevices(): Promise<DiscoveredDevice[]> {
        const res = await axiosInstance.get<DiscoveredDevice[] | { $values: DiscoveredDevice[] }>('/admin/devices');
        const data = res.data;
        return '$values' in data ? data.$values : data;
    },

    async getUsers(opts?: { includeDeleted?: boolean }): Promise<AdminUser[]> {
        const res = await axiosInstance.get<AdminUser[] | { $values: AdminUser[] }>('/users', {
            params: opts?.includeDeleted ? { includeDeleted: true } : undefined,
        });
        const data = res.data;
        return '$values' in data ? data.$values : data;
    },

    async getAllRoles(): Promise<string[]> {
        const res = await axiosInstance.get<{ name: string }[] | { $values: { name: string }[] }>('/roles');
        const data = res.data;
        const list = '$values' in data ? data.$values : data;
        return list.map(r => r.name);
    },

    async assignRole(userEmail: string, roleName: string): Promise<void> {
        await axiosInstance.post(`/roles/${encodeURIComponent(roleName)}/users`, null, {
            params: { userEmail },
        });
    },

    async removeRole(userEmail: string, roleName: string): Promise<void> {
        await axiosInstance.delete(`/roles/${encodeURIComponent(roleName)}/users`, {
            params: { userEmail },
        });
    },

    async deleteUser(userId: string): Promise<void> {
        await axiosInstance.delete(`/users/${userId}`);
    },

    async getStatsHistory(): Promise<StatSnapshot[]> {
        const res = await axiosInstance.get<StatSnapshot[] | { $values: StatSnapshot[] }>('/admin/stats/history');
        const data = res.data;
        return '$values' in data ? data.$values : data;
    },

    async getEmailStats(days = 30): Promise<EmailStats> {
        const res = await axiosInstance.get<EmailStats>('/admin/email-stats', { params: { days } });
        return res.data;
    },

    async getAppSettings(): Promise<AppSettings> {
        const res = await axiosInstance.get<AppSettings>('/admin/settings');
        return res.data;
    },

    async updateAppSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
        const res = await axiosInstance.put<AppSettings>('/admin/settings', patch);
        return res.data;
    },
};

export default AdminService;
