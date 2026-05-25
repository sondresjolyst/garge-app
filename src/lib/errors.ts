/** Per-field validation messages, keyed by field name. */
export type FieldErrors = Record<string, string[]>;

/**
 * Carries structured per-field validation errors so callers can map them onto
 * form fields without serializing through `Error.message`. Use `instanceof
 * FieldValidationError` at the call site to read `fieldErrors`.
 */
export class FieldValidationError extends Error {
    readonly fieldErrors: FieldErrors;

    constructor(fieldErrors: FieldErrors, message = 'Validation failed') {
        super(message);
        this.name = 'FieldValidationError';
        this.fieldErrors = fieldErrors;
        // Restore the prototype chain for instanceof to work after transpilation.
        Object.setPrototypeOf(this, FieldValidationError.prototype);
    }
}
