export default function RedirectingOverlay({ message = 'Redirecting to Vipps…' }: { message?: string }) {
    return (
        <div
            role="status"
            aria-live="polite"
            className="fixed inset-0 z-[300] flex flex-col items-center justify-center gap-4 bg-black/80 backdrop-blur-sm"
        >
            <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-200 font-medium">{message}</p>
        </div>
    );
}
