import { toast as sonnerToast } from 'sonner';
import { getSessionPromptOpen } from '@sjolystinnovation/app-kit/session';

// While the re-sign-in prompt is open, it already tells the user why a request failed, so error
// toasts stay quiet. Every other toast passes through to sonner.
const error: typeof sonnerToast.error = (...args) => (getSessionPromptOpen() ? '' : sonnerToast.error(...args));

export const toast = new Proxy(sonnerToast, {
    get: (target, property, receiver) => (property === 'error' ? error : Reflect.get(target, property, receiver)),
});
