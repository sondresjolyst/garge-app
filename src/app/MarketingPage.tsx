'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SignalIcon, BoltIcon, CpuChipIcon, ChartBarIcon, DevicePhoneMobileIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const features = [
    {
        icon: SignalIcon,
        title: 'Real-time monitoring',
        description: 'Temperature, humidity, and battery voltage updated continuously from your devices.',
    },
    {
        icon: ChartBarIcon,
        title: 'Historical trends',
        description: 'Browse Day, Week, Month, and Year views to understand patterns over time.',
    },
    {
        icon: BoltIcon,
        title: 'Smart sockets',
        description: 'Control and monitor your WiZ smart plugs directly from the dashboard.',
    },
    {
        icon: CpuChipIcon,
        title: 'Automations',
        description: 'Create rules that trigger actions automatically based on sensor readings.',
    },
    {
        icon: DevicePhoneMobileIcon,
        title: 'Any device',
        description: 'Fully responsive web app — works great on phone, tablet, and desktop.',
    },
    {
        icon: ShieldCheckIcon,
        title: 'Secure & private',
        description: 'Your data is tied to your account. Only you can see your sensors.',
    },
];

const faqs = [
    {
        q: 'What is the difference between Garge Sensor and Garge Voltmeter?',
        a: 'Garge Sensor monitors temperature and humidity. Garge Voltmeter is dedicated to monitoring battery voltage — useful for tracking the health of remote battery-powered devices.',
    },
    {
        q: 'How do I add a device to my account?',
        a: 'Go to your Profile page and enter the registration code printed on your device under "Add a device". The sensor will appear in your dashboard immediately.',
    },
    {
        q: 'Can I access my data remotely?',
        a: 'Yes — the Garge dashboard is a web app accessible from any device with an internet connection.',
    },
    {
        q: 'Can I rename my sensors?',
        a: 'Yes. On your Profile page, each sensor has an edit button so you can give it a custom name that makes sense to you.',
    },
];

function RevealSection({ children }: { children: React.ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { el.classList.add('section-visible'); observer.disconnect(); } },
            { threshold: 0.1 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    return <div ref={ref} className="section-reveal">{children}</div>;
}

export default function MarketingPage() {
    return (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-16 text-gray-200">

            {/* Hero */}
            <section className="flex flex-col items-center text-center pt-4 pb-2 gap-6 device-card-grid">
                <div className="fixed top-0 left-0 right-0 h-[480px] -z-10 bg-[radial-gradient(ellipse_at_50%_0%,rgba(14,165,233,0.1),transparent_70%)] pointer-events-none" />
                <Image src="/garge-icon-large.png" width={0} height={0} style={{ height: '80px', width: 'auto' }} alt="Garge" priority unoptimized />
                <div>
                    <h1 className="text-5xl sm:text-7xl font-display font-bold text-gray-100 leading-tight mb-3">
                        Know what&apos;s happening<br className="hidden sm:block" /> in your space
                    </h1>
                    <p className="text-lg text-gray-400 max-w-xl mx-auto">
                        Garge monitors temperature, humidity, and voltage in real time — so you're always in the loop, wherever you are.
                    </p>
                </div>
                <div className="flex gap-3 flex-wrap justify-center">
                    <Link href="/login" className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-xl transition-all text-sm">
                        Get started
                    </Link>
                    <Link href="/register" className="px-5 py-2.5 bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700/50 text-gray-200 font-medium rounded-xl transition-all text-sm">
                        Create account
                    </Link>
                </div>
            </section>

            {/* Product images */}
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/40 rounded-2xl p-6 flex flex-col items-center gap-3">
                    <Image src="/garge-box-v1.1/liz-sensor-v1.1-box-transparent.png" width={200} height={200} alt="Garge Sensor" className="object-contain" />
                    <div className="text-center">
                        <p className="text-sm font-semibold text-gray-100">Garge Sensor</p>
                        <p className="text-xs text-gray-400 mt-0.5">Temperature & humidity monitoring</p>
                    </div>
                </div>
                <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/40 rounded-2xl p-6 flex flex-col items-center gap-3">
                    <Image src="/garge-box-v1.1/liz-sensor-v1.1-box-explode-transparent.png" width={200} height={200} alt="Garge Sensor Exploded" className="object-contain" />
                    <div className="text-center">
                        <p className="text-sm font-semibold text-gray-100">Inside the Garge Sensor</p>
                        <p className="text-xs text-gray-400 mt-0.5">Compact, low-power, wireless</p>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section>
                <RevealSection>
                <h2 className="text-2xl font-display font-bold text-gray-100 mb-6 text-center">Everything you need</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {features.map(({ icon: Icon, title, description }) => (
                        <div key={title} className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/40 rounded-2xl p-5">
                            <div className="w-9 h-9 rounded-xl bg-sky-600/20 flex items-center justify-center mb-3">
                                <Icon className="h-5 w-5 text-sky-400" />
                            </div>
                            <h3 className="text-sm font-semibold text-gray-100 mb-1">{title}</h3>
                            <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
                        </div>
                    ))}
                </div>
                </RevealSection>
            </section>

            {/* FAQ */}
            <section>
                <RevealSection>
                <h2 className="text-2xl font-display font-bold text-gray-100 mb-6 text-center">Frequently asked questions</h2>
                <div className="space-y-3">
                    {faqs.map(({ q, a }) => (
                        <div key={q} className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/40 rounded-2xl p-5">
                            <h3 className="text-sm font-semibold text-gray-100 mb-2">{q}</h3>
                            <p className="text-sm text-gray-400 leading-relaxed">{a}</p>
                        </div>
                    ))}
                </div>
                </RevealSection>
            </section>

        </div>
    );
}
