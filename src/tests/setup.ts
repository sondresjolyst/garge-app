// The `/vitest` entry point registers the matchers and augments vitest's
// `Assertion` type, so `toBeInTheDocument` and friends typecheck as well as run.
import '@testing-library/jest-dom/vitest'
