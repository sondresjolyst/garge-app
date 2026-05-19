'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, PencilSquareIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import Section from '@/components/Section';
import LoadingDots from '@/components/LoadingDots';
import ConfirmModal from '@/components/ConfirmModal';
import { toast } from 'sonner';
import ProductService, { Product, CreateProductPayload, UpdateProductPayload } from '@/services/productService';
import MarkdownEditor from '@/components/MarkdownEditor';
import { formatNok } from '@/lib/formatUtils';

const emptyForm = { name: '', description: '', priceNok: '', interval: 0 as 0 | 1, type: 0 as 0 | 1 };

export default function AdminProductsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const roles: string[] = (session?.user as { roles?: string[] })?.roles ?? [];
    const isAdmin = roles.includes('Admin');

    useEffect(() => {
        if (status === 'authenticated' && !isAdmin) router.push('/');
    }, [status, isAdmin, router]);

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editTarget, setEditTarget] = useState<Product | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    async function refresh() {
        const all = await ProductService.getProducts();
        setProducts(all);
    }

    useEffect(() => {
        if (!isAdmin) return;
        setLoading(true);
        refresh().catch(() => toast.error('Failed to load plans')).finally(() => setLoading(false));
    }, [isAdmin]);

    function openCreate() {
        setEditTarget(null);
        setForm(emptyForm);
        setShowForm(true);
    }

    function openEdit(p: Product) {
        setEditTarget(p);
        setForm({
            name: p.name,
            description: p.description ?? '',
            priceNok: (p.priceInOre / 100).toFixed(2),
            interval: p.interval === 'Monthly' ? 0 : 1,
            type: p.type === 'Primary' ? 0 : 1,
        });
        setShowForm(true);
    }

    function closeForm() {
        setShowForm(false);
        setEditTarget(null);
    }

    async function handleSave() {
        const priceInOre = Math.round(parseFloat(form.priceNok) * 100);
        if (!form.name.trim() || isNaN(priceInOre) || priceInOre < 1) {
            toast.error('Name and valid price required');
            return;
        }
        setSaving(true);
        try {
            if (editTarget) {
                const payload: UpdateProductPayload = {
                    name: form.name.trim(),
                    description: form.description.trim() || undefined,
                    priceInOre,
                    interval: form.interval,
                    type: form.type,
                    isActive: editTarget.isActive,
                };
                await ProductService.updateProduct(editTarget.id, payload);
                toast.success('Plan updated');
            } else {
                const payload: CreateProductPayload = {
                    name: form.name.trim(),
                    description: form.description.trim() || undefined,
                    priceInOre,
                    interval: form.interval,
                    type: form.type,
                };
                await ProductService.createProduct(payload);
                toast.success('Plan created');
            }
            closeForm();
            await refresh();
        } catch {
            toast.error('Failed to save plan');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!deleteTarget) return;
        try {
            await ProductService.deleteProduct(deleteTarget.id);
            toast.success(`Deleted ${deleteTarget.name}`);
            setDeleteTarget(null);
            await refresh();
        } catch {
            toast.error('Failed to delete plan');
            setDeleteTarget(null);
        }
    }

    if (status === 'loading' || (status === 'authenticated' && !isAdmin)) {
        return <LoadingDots height="h-64" />;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-5 pb-32">
            <div className="flex items-center gap-3">
                <Link href="/admin" className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-700/60 transition-all">
                    <ArrowLeftIcon className="h-4 w-4" />
                </Link>
                <h1 className="text-xl font-display font-bold text-gray-100">Subscription Plans</h1>
            </div>

            <Section title="Plans">
                {loading ? (
                    <LoadingDots height="h-16" />
                ) : (
                    <>
                        <ul className="space-y-2 mb-4">
                            {products.length === 0 && !showForm && (
                                <p className="text-sm text-gray-500">No plans yet.</p>
                            )}
                            {products.map(p => (
                                <li key={p.id} className="bg-gray-900/40 border border-gray-700/30 rounded-xl p-4 flex items-center justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-semibold text-gray-100">{p.name}</span>
                                            <span className="text-xs font-medium text-sky-400">
                                                {formatNok(p.priceInOre)} / {p.interval === 'Monthly' ? 'mo' : 'yr'}
                                            </span>
                                            <span className={`px-1.5 py-0.5 border rounded text-xs font-medium ${p.type === 'Primary' ? 'bg-sky-900/30 border-sky-700/40 text-sky-400' : 'bg-purple-900/30 border-purple-700/40 text-purple-400'}`}>
                                                {p.type === 'Primary' ? 'Primary' : 'Add-on'}
                                            </span>
                                            {!p.isActive && (
                                                <span className="px-1.5 py-0.5 bg-gray-700/50 border border-gray-600/40 text-gray-500 text-xs rounded">Inactive</span>
                                            )}
                                        </div>
                                        {p.description && (
                                            <p className="text-xs text-gray-500 mt-1">{p.description}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => openEdit(p)}
                                            className="p-1.5 rounded-lg text-gray-500 hover:text-sky-400 hover:bg-gray-700/60 transition-all"
                                            title="Edit"
                                        >
                                            <PencilSquareIcon className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteTarget(p)}
                                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-gray-700/60 transition-all"
                                            title="Delete"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        {showForm ? (
                            <div className="bg-gray-900/40 border border-gray-700/30 rounded-xl p-4 space-y-3">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    {editTarget ? 'Edit plan' : 'New plan'}
                                </p>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="Name"
                                    className="w-full bg-gray-900/60 border border-gray-700/60 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-sky-500/60"
                                />
                                <MarkdownEditor
                                    value={form.description}
                                    onChange={v => setForm(f => ({ ...f, description: v }))}
                                    placeholder="Description (markdown supported)"
                                    maxLength={2000}
                                />
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">NOK</span>
                                        <input
                                            type="number"
                                            value={form.priceNok}
                                            onChange={e => setForm(f => ({ ...f, priceNok: e.target.value }))}
                                            placeholder="0.00"
                                            step="0.01"
                                            min="0.01"
                                            className="w-full bg-gray-900/60 border border-gray-700/60 rounded-lg pl-11 pr-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-sky-500/60"
                                        />
                                    </div>
                                    <select
                                        value={form.interval}
                                        onChange={e => setForm(f => ({ ...f, interval: Number(e.target.value) as 0 | 1 }))}
                                        className="bg-gray-900/60 border border-gray-700/60 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-sky-500/60"
                                    >
                                        <option value={0}>Monthly</option>
                                        <option value={1}>Yearly</option>
                                    </select>
                                    <select
                                        value={form.type}
                                        onChange={e => setForm(f => ({ ...f, type: Number(e.target.value) as 0 | 1 }))}
                                        className="bg-gray-900/60 border border-gray-700/60 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-sky-500/60"
                                    >
                                        <option value={0}>Primary</option>
                                        <option value={1}>Add-on</option>
                                    </select>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                                    >
                                        {saving ? 'Saving…' : 'Save'}
                                    </button>
                                    <button
                                        onClick={closeForm}
                                        className="px-4 py-2 bg-gray-700/60 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={openCreate}
                                className="flex items-center gap-2 px-3 py-2 bg-gray-700/50 hover:bg-gray-700 border border-gray-600/40 rounded-lg text-sm text-gray-400 hover:text-gray-200 transition-all"
                            >
                                <PlusIcon className="h-4 w-4" />
                                Add plan
                            </button>
                        )}
                    </>
                )}
            </Section>

            {deleteTarget && (
                <ConfirmModal
                    title="Delete plan"
                    message={<>Delete <span className="font-medium text-gray-100">{deleteTarget.name}</span>? Existing subscriptions are unaffected.</>}
                    confirmLabel="Delete"
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}
        </div>
    );
}
