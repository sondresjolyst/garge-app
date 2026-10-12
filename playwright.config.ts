import { defineConfig, devices } from '@playwright/test'
import { NEXTAUTH_SECRET } from './tests/e2e/helpers/auth'

// Its own port, so a dev server already running on 3000 with other settings is never reused.
const PORT = 3100

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: `http://localhost:${PORT}`,
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: {
        command: `npx next dev --port ${PORT}`,
        url: `http://localhost:${PORT}`,
        // Sessions in the specs are signed with this secret. NEXTAUTH_URL keeps next-auth on this port.
        // The API URL points at a closed port, so a call a spec does not mock fails instead of reaching an API.
        env: { NEXTAUTH_SECRET, NEXTAUTH_URL: `http://localhost:${PORT}`, NEXT_PUBLIC_API_URL: 'http://localhost:5999/api' },
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
    },
})
