# Test Suite

This directory contains comprehensive test cases for the MindMend AI Therapist Chatbot.

## Test Structure

```
test/
├── api/
│   └── api.test.js          # API route tests
├── components/
│   └── chatbot.test.js      # React component tests
└── lib/
    ├── utils.test.js        # Utility function tests
    ├── pinecone.test.js     # Pinecone integration tests
    └── langchain-chat.test.js # LangChain chat tests
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- test/lib/utils.test.js
```

## Test Coverage

### 1. **API Tests** (`test/api/api.test.js`)
- POST request handling
- Past conversation retrieval from Pinecone
- Error handling
- Default userId behavior

### 2. **Component Tests** (`test/components/chatbot.test.js`)
- Welcome message rendering
- User message submission
- Loading states
- User name extraction and storage
- API error handling
- Input disable/enable states

### 3. **Utility Tests** (`test/lib/utils.test.js`)
- Name extraction from various patterns
- Emotion color mapping
- Welcome message generation
- Context prefix building
- localStorage operations
- className merging

### 4. **Pinecone Tests** (`test/lib/pinecone.test.js`)
- Text embedding (single and batch)
- Pinecone client initialization
- Configuration validation
- Conversation storage
- Conversation retrieval

### 5. **LangChain Tests** (`test/lib/langchain-chat.test.js`)
- Chat response generation
- Emotion analysis
- Response enhancement with emotions
- Past context building
- Message format conversion

## Mocking Strategy

Tests use Jest mocks for external dependencies:
- `@huggingface/inference` - HuggingFace API calls
- `@pinecone-database/pinecone` - Pinecone vector database
- `@langchain/pinecone` - LangChain Pinecone integration
- `fetch` - API calls in components

## Environment Setup

Tests automatically use the Jest environment configured in `jest.config.js`:
- `jsdom` environment for React component tests
- Module path aliases (`@/`) are resolved correctly
- Setup file (`jest.setup.js`) loads testing library extensions

## Writing New Tests

When adding new tests:

1. Place them in the appropriate directory (`api/`, `components/`, or `lib/`)
2. Use descriptive test names with `it('should...')`
3. Mock external dependencies
4. Clean up mocks in `beforeEach()`
5. Test both success and error cases

Example:
```javascript
describe('MyFeature', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle success case', () => {
    // Test implementation
  });

  it('should handle error case', () => {
    // Test implementation
  });
});
```

## CI/CD Integration

These tests can be integrated into your CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Run tests
  run: npm test

- name: Generate coverage
  run: npm run test:coverage
```
