// The `/vitest` entry point registers the matchers and augments vitest's
// `Assertion` type, so `toBeInTheDocument` and friends typecheck as well as run.
import '@testing-library/jest-dom/vitest'
import { configure } from '@testing-library/react'

// The API client refuses to start without it, as it does in a real build.
process.env.NEXT_PUBLIC_API_URL = 'http://api.test/api'

// The device drawer is a large component. On a busy test runner it can take longer than the
// default second to render, so the findBy and waitFor queries wait up to five seconds for it.
configure({ asyncUtilTimeout: 5000 })
