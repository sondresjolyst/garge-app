import type { ReactNode } from 'react';

/** A button or menu name from the app, or a phrase the manual marks in bold. */
export function Ui({ children }: { children: ReactNode }) {
    return <span className="font-semibold text-gray-200">{children}</span>;
}
