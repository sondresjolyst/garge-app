/** The case with its two holes marked. The manual in docs/manual draws the same picture. */
export default function DeviceFigure({ label }: { label: string }) {
    return (
        <svg viewBox="0 0 810 845" role="img" aria-label={label} className="block w-full h-auto">
            <rect width="810" height="845" rx="40" fill="#141b26" />
            <image href="/help/device.png" width="810" height="845" />
            <circle cx="348" cy="518" r="17" fill="none" stroke="#4da3ff" strokeWidth="6" />
            <circle cx="325" cy="558" r="17" fill="none" stroke="#ffb020" strokeWidth="6" />
            <polyline points="364,513 510,455 560,455" fill="none" stroke="#4da3ff" strokeWidth="6" />
            <polyline points="340,567 510,635 560,635" fill="none" stroke="#ffb020" strokeWidth="6" />
            <text x="572" y="471" fill="#fff" fontSize="50" fontWeight="700" fontFamily="Segoe UI, sans-serif">BOOT</text>
            <text x="572" y="651" fill="#fff" fontSize="50" fontWeight="700" fontFamily="Segoe UI, sans-serif">Restart</text>
        </svg>
    );
}
