import {
    createAdminUsersService,
    createEmailStatsService,
    createSettingsService,
    type AdminUser,
    type EmailStats,
    type SiteSettings,
} from '@sjolystinnovation/app-kit/api';
import axiosInstance from './axiosInstance';

export type { AdminUser, EmailStats, SiteSettings };

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
    // Optional so the UI keeps loading against an older API build that has not
    // yet shipped the commerce stats.
    orders?: AdminOrderStats;
    subscriptions?: AdminSubscriptionStats;
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

/**
 * Garge's own settings on `/admin/settings`. The company details live on `/settings`, served by
 * SjolystInnovation.AppKit.SiteSettings, as SiteSettings.
 */
export interface AppSettings {
    cookieBannerEnabled: boolean;
    vatEnabled: boolean;
    /** The first moment sales carry VAT, in UTC. Null while VAT is off. */
    vatRegisteredFrom?: string | null;
    vippsTestMode: boolean;
}

export interface SecuritySettings {
    alertThresholdMinutes: number;
    minAlertThresholdMinutes: number;
    maxAlertThresholdMinutes: number;
    wakeIntervalSeconds: number;
}

const siteSettings = createSettingsService(axiosInstance);
const userAdmin = createAdminUsersService(axiosInstance);
const emailStats = createEmailStatsService(axiosInstance);

const AdminService = {
    async getStats(opts?: { test?: boolean }): Promise<AdminStats> {
        const res = await axiosInstance.get<AdminStats>('/admin/stats', {
            params: opts?.test ? { test: true } : undefined,
        });
        return res.data;
    },

    async getDevices(): Promise<DiscoveredDevice[]> {
        const res = await axiosInstance.get<DiscoveredDevice[]>('/admin/devices');
        return res.data;
    },

    /** The users, from AppKit.Auth's `GET /users`. Soft-deleted accounts only when `includeDeleted` is true. */
    getUsers(includeDeleted = false): Promise<AdminUser[]> {
        return userAdmin.getUsers(includeDeleted);
    },

    /** The roles an admin may give, from AppKit.Auth's `GET /users/roles`. */
    getAllRoles(): Promise<string[]> {
        return userAdmin.roles();
    },

    /** Gives the user a role, through AppKit.Auth's `POST /users/{id}/roles`. */
    async addRole(userId: string, role: string): Promise<void> {
        await userAdmin.addRole(userId, role);
    },

    /** Takes a role from the user, through AppKit.Auth's `DELETE /users/{id}/roles/{role}`. */
    async removeRole(userId: string, role: string): Promise<void> {
        await userAdmin.removeRole(userId, role);
    },

    /**
     * Deletes another user's account on garge-api's own `DELETE /users/{id}`. AppKit.Auth's user
     * admin endpoints have no admin delete, and `/users/{id}/account` only deletes the caller's own.
     */
    async deleteUser(userId: string): Promise<void> {
        await axiosInstance.delete(`/users/${encodeURIComponent(userId)}`);
    },

    /** The daily totals for the chart, from AppKit.AdminStats's `GET /admin/stats/history`. */
    async getStatsHistory(): Promise<StatSnapshot[]> {
        const res = await axiosInstance.get<StatSnapshot[]>('/admin/stats/history');
        return res.data;
    },

    /** The Brevo stats for the last `days` days, from AppKit.Email's `GET /admin/email-stats`. */
    getEmailStats(days = 30): Promise<EmailStats> {
        return emailStats.get(days);
    },

    async getAppSettings(): Promise<AppSettings> {
        const res = await axiosInstance.get<AppSettings>('/admin/settings');
        return res.data;
    },

    async updateAppSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
        const res = await axiosInstance.put<AppSettings>('/admin/settings', patch);
        return res.data;
    },

    /** The company details as stored, from `/settings`. */
    getSiteSettings(): Promise<SiteSettings> {
        return siteSettings.get();
    },

    /**
     * Saves the full set of company details on `/settings`. A validation problem throws an error that
     * `apiFieldErrors` reads the per-field messages from.
     */
    updateSiteSettings(data: SiteSettings): Promise<SiteSettings> {
        return siteSettings.update(data);
    },

    async getSecuritySettings(): Promise<SecuritySettings> {
        const res = await axiosInstance.get<SecuritySettings>('/admin/security-settings');
        return res.data;
    },

    async updateSecuritySettings(alertThresholdMinutes: number): Promise<SecuritySettings> {
        const res = await axiosInstance.put<SecuritySettings>('/admin/security-settings', { alertThresholdMinutes });
        return res.data;
    },
};

export default AdminService;
