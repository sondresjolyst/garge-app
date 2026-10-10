'use client';

import { ErrorState } from '@sjolystinnovation/app-kit/ui';

/** Shown when a page cannot be rendered. The response is still a 500. */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return <ErrorState reset={reset} homeHref="/" />;
}
