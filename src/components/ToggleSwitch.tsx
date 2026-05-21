interface ToggleSwitchProps {
    /** Current on/off state. */
    checked: boolean;
    /** Called when the user flips the switch. */
    onChange: () => void;
    disabled?: boolean;
    /** Required for screen readers — describe what the switch controls. */
    ariaLabel: string;
}

/**
 * A small on/off pill switch. Use for boolean settings (e.g. notifications,
 * data-retention) so the markup and accessibility semantics stay consistent.
 */
export default function ToggleSwitch({ checked, onChange, disabled = false, ariaLabel }: ToggleSwitchProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={ariaLabel}
            onClick={onChange}
            disabled={disabled}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${checked ? 'bg-sky-600' : 'bg-gray-700'}`}
        >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    );
}
