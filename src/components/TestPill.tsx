export default function TestPill({ visible }: { visible: boolean }) {
    if (!visible) return null;
    return (
        <span
            title="Test mode"
            className="px-1.5 py-0.5 bg-amber-500/15 border border-amber-500/40 text-amber-400 text-[10px] font-bold uppercase tracking-wider rounded"
        >
            Test
        </span>
    );
}
