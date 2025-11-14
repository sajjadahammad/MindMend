# Testing with Vitest

This project uses **Vitest** for testing - a blazing fast unit test framework powered by Vite.

## ✅ Test Results

All **60 tests** passing across 6 test suites:

```
✓ test/lib/utils.test.js (19 tests)
✓ test/lib/langchain-chat.test.js (15 tests)
✓ test/components/chatbot.test.jsx (6 tests)
✓ test/api/api.test.js (5 tests)
✓ test/integration/chat-flow.test.js (5 tests)
✓ test/lib/pinecone.test.js (10 tests)
```

## Quick Start

```bash
# Run all tests once
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Open Vitest UI in browser (interactive test runner)
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## Why Vitest?

### Advantages over Jest:
- ⚡ **Faster**: Native ESM support, no transpilation needed
- 🔥 **Hot Module Reload**: Instant feedback in watch mode
- 🎯 **Vite-powered**: Uses your existing Vite config
- 🔄 **Jest-compatible API**: Easy migration from Jest
- 🎨 **Beautiful UI**: Browser-based test interface
- 📦 **Smaller**: Less dependencies, faster installs

### Key Differences from Jest:

| Feature | Jest | Vitest |
|---------|------|--------|
| Mock functions | `jest.fn()` | `vi.fn()` |
| Mock modules | `jest.mock()` | `vi.mock()` |
| Clear mocks | `jest.clearAllMocks()` | `vi.clearAllMocks()` |
| Imports | Globals (optional) | Import from 'vitest' |
| Speed | Slower | 2-10x faster |

## Test Structure

```
test/
├── api/                    # API route tests
│   └── api.test.js
├── components/             # React component tests
│   └── chatbot.test.jsx   # Note: .jsx extension for JSX
├── integration/            # End-to-end tests
│   └── chat-flow.test.js
├── lib/                    # Library/utility tests
│   ├── utils.test.js
│   ├── pinecone.test.js
│   └── langchain-chat.test.js
└── helpers/                # Test utilities
    └── test-utils.js
```

## Writing Tests

### Basic Test Structure

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('MyFeature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should do something', () => {
    expect(true).toBe(true);
  });
});
```

### Mocking with Vitest

```javascript
import { vi } from 'vitest';

// Mock a module
vi.mock('@/lib/myModule');

// Create a mock function
const mockFn = vi.fn();
mockFn.mockReturnValue('mocked value');

// Spy on a method
const spy = vi.spyOn(object, 'method');
```

### Testing React Components

```javascript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from '@/components/MyComponent.jsx';

describe('MyComponent', () => {
  it('should render', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

**Important**: React component test files must use `.jsx` extension!

## Configuration

### vitest.config.js
- Configures test environment (jsdom for React)
- Sets up module aliases (`@/` → `./src/`)
- Enables global test functions
- Configures coverage reporting

### vitest.setup.js
- Loads `@testing-library/jest-dom` matchers
- Adds polyfills (TextEncoder, ReadableStream)
- Mocks browser APIs (scrollIntoView)
- Runs before each test file

## Coverage

Generate a coverage report:

```bash
npm run test:coverage
```

Coverage reports are generated in:
- Terminal (text format)
- `coverage/index.html` (HTML format)
- `coverage/coverage-final.json` (JSON format)

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
```

## Troubleshooting

### Tests not running?
- Make sure test files match pattern: `test/**/*.test.{js,jsx}`
- Component tests with JSX must use `.jsx` extension

### Mocks not working?
- Use `vi.mock()` not `jest.mock()`
- Clear mocks in `beforeEach()` with `vi.clearAllMocks()`

### Import errors?
- Check `@/` alias is configured in `vitest.config.js`
- Ensure file extensions are correct

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Vitest UI](https://vitest.dev/guide/ui.html)
- [Migration from Jest](https://vitest.dev/guide/migration.html)
