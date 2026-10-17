import {
    apiFieldErrors,
    createAdminUsersService,
    createEmailStatsService,
    createSettingsService,
    type EmailStats,
    type SiteSettings,
} from '@sjolystinnovation/app-kit/api';
import axiosInstance from './axiosInstance';
import { formatApiError } from '@/lib/errorMessages';
import { FieldValidationError } from '@/lib/errors';

export type { EmailStats, SiteSettings };

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

    /** The roles an admin may give, from AppKit.Auth's `GET /users/roles`. */
    getAllRoles(): Promise<string[]> {
        return userAdmin.roles();
    },

    async assignRole(userId: string, roleName: string): Promise<void> {
        await axiosInstance.post(`/users/${encodeURIComponent(userId)}/roles`, { role: roleName });
    },

    async removeRole(userId: string, roleName: string): Promise<void> {
        await axiosInstance.delete(`/users/${encodeURIComponent(userId)}/roles/${encodeURIComponent(roleName)}`);
    },

    async deleteUser(userId: string): Promise<void> {
        await axiosInstance.delete(`/users/${userId}`);
    },

    async getStatsHistory(): Promise<StatSnapshot[]> {
        const res = await axiosInstance.get<StatSnapshot[] | { $values: StatSnapshot[] }>('/admin/stats/history');
        const data = res.data;
        return '$values' in data ? data.$values : data;
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
     * Saves the full set of company details on `/settings`. A validation problem throws a
     * FieldValidationError keyed by field in camelCase. app-kit's `createSettingsService` turns every
     * failure into one message, so the save goes through axios here to keep the per-field errors.
     */
    async updateSiteSettings(data: SiteSettings): Promise<SiteSettings> {
        try {
            const res = await axiosInstance.put<SiteSettings>('/settings', data);
            return res.data;
        } catch (error: unknown) {
            const fieldErrors = apiFieldErrors(error);
            if (fieldErrors) throw new FieldValidationError(fieldErrors);
            throw new Error(formatApiError(error, 'Failed to save the company details'));
        }
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
