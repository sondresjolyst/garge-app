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
import ShopService, { ShopItem, CreateShopItemPayload, UpdateShopItemPayload } from '@/services/shopService';
import ShopItemPhotoService from '@/services/shopItemPhotoService';
import PhotoUploader from '@/components/PhotoUploader';
import type { Photo } from '@/services/photoServiceFactory';
import MarkdownEditor from '@/components/MarkdownEditor';
import { formatNok } from '@/lib/formatUtils';

const emptyForm = { name: '', description: '', priceNok: '', stock: '-1' };

export default function AdminShopPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const roles: string[] = (session?.user as { roles?: string[] })?.roles ?? [];
    const isAdmin = roles.includes('Admin');

    useEffect(() => {
        if (status === 'authenticated' && !isAdmin) router.push('/');
    }, [status, isAdmin, router]);

    const [items, setItems] = useState<ShopItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editTarget, setEditTarget] = useState<ShopItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ShopItem | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [editPhoto, setEditPhoto] = useState<Photo | null>(null);

    async function refresh() {
        const all = await ShopService.getShopItems();
        setItems(all);
    }

    useEffect(() => {
        if (!isAdmin) return;
        setLoading(true);
        refresh().catch(() => toast.error('Failed to load items')).finally(() => setLoading(false));
    }, [isAdmin]);

    function openCreate() {
        setEditTarget(null);
        setForm(emptyForm);
        setEditPhoto(null);
        setShowForm(true);
    }

    function openEdit(item: ShopItem) {
        setEditTarget(item);
        setForm({
            name: item.name,
            description: item.description ?? '',
            priceNok: (item.priceInOre / 100).toFixed(2),
            stock: item.stockCount.toString(),
        });
        setEditPhoto(null);
        setShowForm(true);
        if (item.hasImage) {
            ShopItemPhotoService.get(item.id).then(p => setEditPhoto(p));
        }
    }

    function closeForm() {
        setShowForm(false);
        setEditTarget(null);
        setEditPhoto(null);
    }

    async function handleSave() {
        const priceInOre = Math.round(parseFloat(form.priceNok) * 100);
        const stockCount = parseInt(form.stock, 10);
        if (!form.name.trim() || isNaN(priceInOre) || priceInOre < 1) {
            toast.error('Name and valid price required');
            return;
        }
        setSaving(true);
        try {
            const stock = isNaN(stockCount) ? -1 : stockCount;
            if (editTarget) {
                const payload: UpdateShopItemPayload = {
                    name: form.name.trim(),
                    description: form.description.trim() || undefined,
                    priceInOre,
                    stockCount: stock,
                    isActive: editTarget.isActive,
                };
                await ShopService.updateShopItem(editTarget.id, payload);
                toast.success('Item updated');
            } else {
                const payload: CreateShopItemPayload = {
                    name: form.name.trim(),
                    description: form.description.trim() || undefined,
                    priceInOre,
                    stockCount: stock,
                };
                await ShopService.createShopItem(payload);
                toast.success('Item created');
            }
            closeForm();
            await refresh();
        } catch {
            toast.error('Failed to save item');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!deleteTarget) return;
        try {
            await ShopService.deleteShopItem(deleteTarget.id);
            toast.success(`Deleted ${deleteTarget.name}`);
            setDeleteTarget(null);
            await refresh();
        } catch {
            toast.error('Failed to delete item');
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
                <h1 className="text-xl font-display font-bold text-gray-100">Shop Items</h1>
            </div>

            <Section title="Items">
                {loading ? (
                    <LoadingDots height="h-16" />
                ) : (
                    <>
                        <ul className="space-y-2 mb-4">
                            {items.length === 0 && !showForm && (
                                <p className="text-sm text-gray-500">No items yet.</p>
                            )}
                            {items.map(item => (
                                <li key={item.id} className="bg-gray-900/40 border border-gray-700/30 rounded-xl p-4 flex items-center justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-semibold text-gray-100">{item.name}</span>
                                            <span className="text-xs font-medium text-sky-400">{formatNok(item.priceInOre)}</span>
                                            <span className="text-xs text-gray-600">
                                                {item.stockCount === -1 ? 'Unlimited' : `${item.stockCount} in stock`}
                                            </span>
                                            {!item.isActive && (
                                                <span className="px-1.5 py-0.5 bg-gray-700/50 border border-gray-600/40 text-gray-500 text-xs rounded">Inactive</span>
                                            )}
                                        </div>
                                        {item.description && (
                                            <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => openEdit(item)}
                                            className="p-1.5 rounded-lg text-gray-500 hover:text-sky-400 hover:bg-gray-700/60 transition-all"
                                            title="Edit"
                                        >
                                            <PencilSquareIcon className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteTarget(item)}
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
                                    {editTarget ? 'Edit item' : 'New item'}
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
                                {editTarget ? (
                                    <PhotoUploader
                                        photo={editPhoto}
                                        service={ShopItemPhotoService}
                                        parentId={editTarget.id}
                                        alt={`${editTarget.name} image`}
                                        aspectRatio="video"
                                        addLabel="Add image"
                                        onChange={p => { setEditPhoto(p); refresh().catch(() => {}); }}
                                    />
                                ) : (
                                    <p className="text-xs text-gray-600 italic">Save the item first to add an image.</p>
                                )}
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
                                    <input
                                        type="number"
                                        value={form.stock}
                                        onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                                        placeholder="Stock (-1 = ∞)"
                                        className="w-36 bg-gray-900/60 border border-gray-700/60 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-sky-500/60"
                                    />
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
                                Add item
                            </button>
                        )}
                    </>
                )}
            </Section>

            {deleteTarget && (
                <ConfirmModal
                    title="Delete item"
                    message={<>Delete <span className="font-medium text-gray-100">{deleteTarget.name}</span>? Existing orders are unaffected.</>}
                    confirmLabel="Delete"
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}
        </div>
    );
}
