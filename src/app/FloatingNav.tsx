"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    HomeIcon,
    SignalIcon,
    BoltIcon,
    PlusCircleIcon,
    WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

const navItems = [
    { href: '/',            label: 'Home',        Icon: HomeIcon },
    { href: '/sensors',     label: 'Sensors',     Icon: SignalIcon },
    { href: '/sockets',     label: 'Sockets',     Icon: PlusCircleIcon },
    { href: '/electricity', label: 'Electricity', Icon: BoltIcon },
    { href: '/automations', label: 'Auto',        Icon: WrenchScrewdriverIcon },
];

export default function FloatingNav() {
    const pathname = usePathname();

    return (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-max">
            <nav className="flex items-center gap-1 bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-full px-2 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
                {navItems.map(({ href, label, Icon }) => {
                    const isActive = href === '/'
                        ? pathname === '/'
                        : pathname?.startsWith(href);
                    return (
                        <Link key={href} href={href}>
                            <div className={`flex flex-col items-center px-3 sm:px-4 py-2 rounded-full transition-all duration-200 cursor-pointer select-none ${
                                isActive
                                    ? 'bg-sky-600/20 text-sky-400'
                                    : 'text-gray-500 hover:text-gray-200 hover:bg-gray-800/60'
                            }`}>
                                <Icon className={`h-5 w-5 transition-all duration-200 ${isActive ? 'stroke-2' : 'stroke-[1.5]'}`} />
                                <span className={`text-[11px] mt-0.5 font-medium ${isActive ? 'text-sky-400' : 'text-gray-500'}`}>
                                    {label}
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
