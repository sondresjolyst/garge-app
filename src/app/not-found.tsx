import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-gray-400">
            <span className="text-6xl font-bold text-gray-600">404</span>
            <p className="text-lg">This page does not exist.</p>
            <Link href="/" className="text-sky-500 hover:text-sky-400 transition-colors">
                Go home
            </Link>
        </div>
    );
}
