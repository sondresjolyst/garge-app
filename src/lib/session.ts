import { defineSessionConfig } from '@sjolystinnovation/app-kit';

export const sessionConfig = defineSessionConfig({
    jwtSecretEnvVar: 'GARGE_API_JWT_SECRET',
    loginRoute: '/login',
    draftStoragePrefix: 'garge',
});
