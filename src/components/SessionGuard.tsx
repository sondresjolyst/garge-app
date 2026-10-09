"use client";

import { toast } from 'sonner';
import { SessionExpiryGuard } from '@sjolystinnovation/app-kit/session/react';

export default function SessionGuard() {
    return <SessionExpiryGuard loginHref="/login" onRestored={() => toast.success('You are signed in again.')} />;
}
