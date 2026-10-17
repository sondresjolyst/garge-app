'use client';

import React, { useEffect, useState } from 'react';
import { toast } from '@sjolystinnovation/app-kit/toast';
import { zodFieldErrors } from '@sjolystinnovation/app-kit/validation';
import AdminService, { type SiteSettings } from '@/services/adminService';
import { inputClass } from '@/components/TextInput';
import { FieldValidationError, type FieldErrors } from '@/lib/errors';
import { companySettingsSchema, type CompanySettingsForm } from '@/lib/validation/companySettingsSchema';

type Field = keyof CompanySettingsForm;

interface FieldSpec {
    name: Field;
    label: string;
    type?: 'email' | 'tel';
    inputMode?: 'numeric';
    required?: boolean;
    hint?: string;
    /** Tailwind column span within the form grid. */
    span?: string;
}

// Rows of the form. On small screens every field takes the full width.
const FIELDS: FieldSpec[] = [
    { name: 'companyName', label: 'Company name', required: true },
    { name: 'companyLegalName', label: 'Legal name', hint: 'Blank until registered. The company name stands in.' },
    { name: 'orgNumber', label: 'Organisation number', inputMode: 'numeric', hint: 'Gets "MVA" after it while VAT is on.' },
    { name: 'streetAddress', label: 'Street address', required: true },
    { name: 'postalCode', label: 'Postal code', inputMode: 'numeric', span: 'sm:col-span-1' },
    { name: 'addressLocality', label: 'Place', span: 'sm:col-span-1' },
    { name: 'addressRegion', label: 'County' },
    { name: 'publicEmail', label: 'Public email', type: 'email', required: true },
    { name: 'publicPhone', label: 'Public phone', type: 'tel', required: true },
    { name: 'contactRecipientEmail', label: 'Contact form recipient', type: 'email', required: true, hint: 'Where contact form messages go. Not shown publicly.' },
];

const FIELD_NAMES = new Set<string>(FIELDS.map(f => f.name));

function toForm(s: SiteSettings): CompanySettingsForm {
    return {
        contactRecipientEmail: s.contactRecipientEmail ?? '',
        companyName: s.companyName ?? '',
        companyLegalName: s.companyLegalName ?? '',
        orgNumber: s.orgNumber ?? '',
        streetAddress: s.streetAddress ?? '',
        postalCode: s.postalCode ?? '',
        addressLocality: s.addressLocality ?? '',
        addressRegion: s.addressRegion ?? '',
        publicEmail: s.publicEmail ?? '',
        publicPhone: s.publicPhone ?? '',
    };
}

const sameForm = (a: CompanySettingsForm, b: CompanySettingsForm) => FIELDS.every(f => a[f.name] === b[f.name]);

/**
 * The company details the public pages show, saved as a whole on `/settings`. VAT registration is
 * part of that body but is set by the VAT toggle in Site Settings, so a save sends the value the API
 * holds at that moment instead of one loaded earlier.
 */
export default function CompanySettingsCard() {
    const [saved, setSaved] = useState<CompanySettingsForm | null>(null);
    const [form, setForm] = useState<CompanySettingsForm | null>(null);
    const [failed, setFailed] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<FieldErrors>({});

    useEffect(() => {
        let active = true;
        AdminService.getSiteSettings()
            .then(s => {
                if (!active) return;
                setSaved(toForm(s));
                setForm(toForm(s));
            })
            .catch(e => {
                if (!active) return;
                // No form without the stored details, since saving a blank one would erase them.
                setFailed(true);
                toast.error(e instanceof Error && e.message ? e.message : 'Failed to load the company details');
            });
        return () => { active = false; };
    }, []);

    if (failed) {
        return <p className="text-xs text-gray-500">Could not load the company details.</p>;
    }
    if (form === null || saved === null) {
        return <div className="h-64 bg-gray-800/40 rounded-xl animate-pulse" />;
    }

    const change = (name: Field, value: string) => {
        setForm({ ...form, [name]: value });
        if (errors[name]) {
            const rest = { ...errors };
            delete rest[name];
            setErrors(rest);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const parsed = companySettingsSchema.safeParse(form);
        if (!parsed.success) {
            setErrors(zodFieldErrors(parsed.error, { all: true }));
            return;
        }
        setSaving(true);
        setErrors({});
        try {
            const current = await AdminService.getSiteSettings();
            const stored = toForm(await AdminService.updateSiteSettings({ ...parsed.data, vatRegistered: current.vatRegistered }));
            setSaved(stored);
            setForm(stored);
            toast.success('Company details saved');
        } catch (err) {
            if (err instanceof FieldValidationError) {
                setErrors(err.fieldErrors);
                // A problem on a field the form does not show, such as the org number VAT needs, still gets said.
                const other = Object.entries(err.fieldErrors).find(([field]) => !FIELD_NAMES.has(field));
                toast.error(other?.[1][0] ?? 'Check the highlighted fields');
            } else {
                toast.error(err instanceof Error && err.message ? err.message : 'Failed to save the company details');
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-4 bg-gray-900/50 border border-gray-700/40 rounded-xl p-4">
            <div className="grid gap-4 sm:grid-cols-2">
                {FIELDS.map(f => {
                    const id = `company-${f.name}`;
                    const fieldErrors = errors[f.name];
                    return (
                        <div key={f.name} className={f.span ?? 'sm:col-span-2'}>
                            <label htmlFor={id} className="block text-xs font-medium text-gray-400 mb-1.5">
                                {f.label}
                                {f.required && <span className="text-red-400"> *</span>}
                            </label>
                            <input
                                id={id}
                                name={f.name}
                                type={f.type ?? 'text'}
                                inputMode={f.inputMode}
                                value={form[f.name]}
                                onChange={e => change(f.name, e.target.value)}
                                disabled={saving}
                                aria-invalid={fieldErrors ? true : undefined}
                                className={`${inputClass}${fieldErrors ? ' border-red-500/60' : ''}`}
                            />
                            {f.hint && !fieldErrors && <p className="text-xs text-gray-500 mt-1">{f.hint}</p>}
                            {fieldErrors?.map((msg, i) => <p key={i} className="text-xs text-red-400 mt-1">{msg}</p>)}
                        </div>
                    );
                })}
            </div>
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={saving || sameForm(form, saved)}
                    className="px-3 py-1.5 text-sm font-medium text-gray-100 bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? 'Saving...' : 'Save'}
                </button>
            </div>
        </form>
    );
}
