// The `/vitest` entry point registers the matchers and augments vitest's
// `Assertion` type, so `toBeInTheDocument` and friends typecheck as well as run.
import '@testing-library/jest-dom/vitest'

// The API client refuses to start without it, as it does in a real build.
process.env.NEXT_PUBLIC_API_URL = 'http://api.test/api'
