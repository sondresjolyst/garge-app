'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { TrashIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';
import Section from '@/components/Section';
import LoadingDots from '@/components/LoadingDots';
import ConfirmModal from '@/components/ConfirmModal';
import { toast } from 'sonner';

const TimeSeriesChart = dynamic(() => import('@/components/TimeSeriesChart'), { ssr: false });
import AdminService, { AdminStats, AdminUser, StatSnapshot } from '@/services/adminService';

type StatKey = 'totalUsers' | 'totalSensors' | 'totalSwitches' | 'totalAutomations';

const ALL_ROLES = ['Admin', 'Default', 'Electricity', 'SensorAdmin', 'MqttAdmin', 'AutomationAdmin', 'SwitchAdmin'];


export default function AdminPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const roles: string[] = (session?.user as { roles?: string[] })?.roles ?? [];
    const isAdmin = roles.includes('Admin');

    useEffect(() => {
        if (status === 'authenticated' && !isAdmin) router.push('/');
    }, [status, isAdmin, router]);

    const [stats, setStats] = useState<AdminStats | null>(null);
    const [history, setHistory] = useState<StatSnapshot[]>([]);
    const [selectedStat, setSelectedStat] = useState<StatKey | null>('totalUsers');
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [addRoleFor, setAddRoleFor] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState('');
    const [roleLoading, setRoleLoading] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

    const [userSearch, setUserSearch] = useState('');
    const [userPage, setUserPage] = useState(0);
    const PAGE_SIZE = 10;

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [s, u, h] = await Promise.all([
                AdminService.getStats(),
                AdminService.getUsers(),
                AdminService.getStatsHistory(),
            ]);
            setStats(s);
            setUsers(u);
            setHistory(h);
        } catch {
            setError('Failed to load admin data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isAdmin) load();
    }, [isAdmin, load]);

    const handleAssignRole = async (user: AdminUser) => {
        if (!selectedRole) return;
        setRoleLoading(true);
        try {
            await AdminService.assignRole(user.email, selectedRole);
            toast.success(`Added ${selectedRole} to ${user.firstName}`);
            setAddRoleFor(null);
            setSelectedRole('');
            await load();
        } catch {
            toast.error('Failed to assign role');
        } finally {
            setRoleLoading(false);
        }
    };

    const handleRemoveRole = async (user: AdminUser, role: string) => {
        try {
            await AdminService.removeRole(user.email, role);
            toast.success(`Removed ${role} from ${user.firstName}`);
            await load();
        } catch {
            toast.error('Failed to remove role');
        }
    };

    const handleDeleteUser = async () => {
        if (!deleteTarget) return;
        try {
            await AdminService.deleteUser(deleteTarget.id);
            toast.success(`Deleted ${deleteTarget.firstName} ${deleteTarget.lastName}`);
            setDeleteTarget(null);
            await load();
        } catch {
            toast.error('Failed to delete user');
            setDeleteTarget(null);
        }
    };

    if (status === 'loading' || (status === 'authenticated' && !isAdmin)) {
        return <LoadingDots height="h-64" />;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 pb-32">
            <h1 className="text-xl font-bold text-gray-100">Admin</h1>

            {loading && <LoadingDots height="h-32" />}
            {error && <p className="text-sm text-red-400">{error}</p>}

            {!loading && !error && (
                <>
                    {/* Stats */}
                    <Section title="Overview">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {([
                                { label: 'Users', value: stats?.totalUsers, key: 'totalUsers' as StatKey },
                                { label: 'Sensors', value: stats?.totalSensors, key: 'totalSensors' as StatKey },
                                { label: 'Switches', value: stats?.totalSwitches, key: 'totalSwitches' as StatKey },
                                { label: 'Active automations', value: stats?.activeAutomations, key: 'totalAutomations' as StatKey },
                            ]).map(({ label, value, key }) => {
                                const isSelected = selectedStat === key;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => setSelectedStat(isSelected ? null : key)}
                                        className={`text-left bg-gray-900/50 border rounded-xl p-4 transition-all ${
                                            isSelected
                                                ? 'border-sky-500/60 ring-1 ring-sky-500/30'
                                                : 'border-gray-700/40 hover:border-gray-600/60'
                                        }`}
                                    >
                                        <p className="text-2xl font-bold text-gray-100 tabular-nums">{value ?? '—'}</p>
                                        <p className={`text-xs mt-1 ${isSelected ? 'text-sky-400' : 'text-gray-500'}`}>{label}</p>
                                    </button>
                                );
                            })}
                        </div>

                        {selectedStat && history.length > 0 && (
                            <div className="mt-4">
                                <TimeSeriesChart
                                    title={{
                                        totalUsers: 'Users over time',
                                        totalSensors: 'Sensors over time',
                                        totalSwitches: 'Switches over time',
                                        totalAutomations: 'Automations over time',
                                    }[selectedStat]}
                                    data={history.map(s => ({
                                        x: new Date(s.date).getTime(),
                                        y: s[selectedStat],
                                    }))}
                                    chartType="line"
                                    integerY
                                />
                            </div>
                        )}
                    </Section>

                    {/* Users */}
                    <Section title="Users">
                        {users.length > 0 && (
                            <input
                                type="text"
                                value={userSearch}
                                onChange={e => { setUserSearch(e.target.value); setUserPage(0); }}
                                placeholder="Search by name or email…"
                                className="w-full mb-4 bg-gray-900/60 border border-gray-700/60 rounded-lg px-2.5 py-1.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-sky-500/60"
                            />
                        )}
                        {(() => {
                            const filtered = users.filter(u =>
                                `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(userSearch.toLowerCase())
                            );
                            const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
                            const page = Math.min(userPage, Math.max(0, totalPages - 1));
                            const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

                            if (filtered.length === 0) return <p className="text-xs text-gray-500">No users found.</p>;

                            return (
                                <>
                                    <ul className="space-y-3">
                                        {paged.map((u) => {
                                            const isAddingRole = addRoleFor === u.id;
                                            const available = ALL_ROLES.filter(r => !u.roles.includes(r));
                                            return (
                                                <li key={u.id} className="bg-gray-900/40 border border-gray-700/30 rounded-xl p-3 space-y-2">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-200">
                                                                {u.firstName} {u.lastName}
                                                            </p>
                                                            <p className="text-xs text-gray-500">{u.email}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => setDeleteTarget(u)}
                                                            className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-gray-700/60 transition-all flex-shrink-0"
                                                            title="Delete user"
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>

                                                    <div className="flex flex-wrap gap-1.5 items-center">
                                                        {u.roles.map(role => (
                                                            <span key={role} className="flex items-center gap-1 pl-2 pr-1 py-0.5 bg-sky-600/20 border border-sky-600/30 rounded-lg text-xs text-sky-300">
                                                                {role}
                                                                <button
                                                                    onClick={() => handleRemoveRole(u, role)}
                                                                    className="hover:text-red-400 transition-colors"
                                                                    title={`Remove ${role}`}
                                                                >
                                                                    <XMarkIcon className="h-3 w-3" />
                                                                </button>
                                                            </span>
                                                        ))}
                                                        {!isAddingRole && available.length > 0 && (
                                                            <button
                                                                onClick={() => { setAddRoleFor(u.id); setSelectedRole(available[0]); }}
                                                                className="flex items-center gap-1 px-2 py-0.5 bg-gray-700/50 hover:bg-gray-700 border border-gray-600/40 rounded-lg text-xs text-gray-400 hover:text-gray-200 transition-all"
                                                            >
                                                                <PlusIcon className="h-3 w-3" />
                                                                Add role
                                                            </button>
                                                        )}
                                                    </div>

                                                    {isAddingRole && (
                                                        <div className="flex items-center gap-2 pt-0.5">
                                                            <select
                                                                value={selectedRole}
                                                                onChange={e => setSelectedRole(e.target.value)}
                                                                className="bg-gray-900/60 border border-gray-700/60 rounded-lg px-2 py-1 text-sm text-gray-100 focus:outline-none focus:border-sky-500/60"
                                                            >
                                                                {available.map(r => (
                                                                    <option key={r} value={r}>{r}</option>
                                                                ))}
                                                            </select>
                                                            <button
                                                                onClick={() => handleAssignRole(u)}
                                                                disabled={roleLoading}
                                                                className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs rounded-lg transition-colors"
                                                            >
                                                                {roleLoading ? '...' : 'Add'}
                                                            </button>
                                                            <button
                                                                onClick={() => setAddRoleFor(null)}
                                                                className="px-2.5 py-1 bg-gray-700/60 hover:bg-gray-700 text-gray-300 text-xs rounded-lg transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>

                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-700/40">
                                            <p className="text-xs text-gray-500">
                                                {filtered.length} users · page {page + 1} of {totalPages}
                                            </p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setUserPage(p => Math.max(0, p - 1))}
                                                    disabled={page === 0}
                                                    className="px-3 py-1 text-xs bg-gray-700/60 hover:bg-gray-700 disabled:opacity-30 text-gray-300 rounded-lg transition-colors"
                                                >
                                                    Previous
                                                </button>
                                                <button
                                                    onClick={() => setUserPage(p => Math.min(totalPages - 1, p + 1))}
                                                    disabled={page === totalPages - 1}
                                                    className="px-3 py-1 text-xs bg-gray-700/60 hover:bg-gray-700 disabled:opacity-30 text-gray-300 rounded-lg transition-colors"
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </Section>
                </>
            )}

            {deleteTarget && (
                <ConfirmModal
                    title="Delete user"
                    message={<>Are you sure you want to delete <span className="font-medium text-gray-100">{deleteTarget.firstName} {deleteTarget.lastName}</span>? This cannot be undone.</>}
                    confirmLabel="Delete"
                    onConfirm={handleDeleteUser}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}
        </div>
    );
}
