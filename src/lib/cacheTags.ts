import { defineRevalidateTargets } from '@sjolystinnovation/app-kit/api';

// Sent to POST /api/revalidate, which purges each target's paths and its cache tag. Garge has no
// locale segments, so the pages are purged at their own paths.
const revalidateTargets = defineRevalidateTargets({
    targets: {
        legal: { pages: ['/terms', '/privacy', '/cookies'], root: ['/sitemap.xml'] },
        // Every page renders branding through the layout, and so does /icon. The tag reaches them all.
        branding: {},
    },
});

export const REVALIDATE_TARGETS = revalidateTargets.targets;

export type RevalidateTarget = keyof typeof REVALIDATE_TARGETS;

export const TARGET_PATHS = revalidateTargets.paths;

/** Purges the pages behind `target` after an admin edit. Best effort, it never throws. */
export const revalidateTarget = revalidateTargets.revalidate;
