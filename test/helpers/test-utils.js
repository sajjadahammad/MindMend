// test/helpers/test-utils.js
import { vi } from 'vitest';

/**
 * Test utilities and helpers for consistent testing
 */

/**
 * Create a mock request object for API route testing
 */
export function createMockRequest(body) {
  return {
    json: vi.fn().mockResolvedValue(body),
    headers: new Map(),
  };
}

/**
 * Create mock messages for chat testing
 */
export function createMockMessages(count = 3) {
  const messages = [];
  for (let i = 0; i < count; i++) {
    messages.push({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Test message ${i + 1}`
    });
  }
  return messages;
}

/**
 * Create mock conversation history
 */
export function createMockConversationHistory(userId = 'test-user', count = 5) {
  return Array(count).fill(null).map((_, i) => ({
    userId,
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: `Message ${i + 1}`,
    timestamp: Date.now() - (count - i) * 60000, // 1 minute apart
  }));
}

/**
 * Create mock emotion data
 */
export function createMockEmotion(label = 'joy', score = 0.85) {
  return { label, score };
}

/**
 * Wait for async operations
 */
export function waitFor(ms = 100) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mock localStorage for testing
 */
export function mockLocalStorage() {
  const store = {};
  
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
  };
}

/**
 * Mock fetch responses
 */
export function mockFetchSuccess(data) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => data,
  });
}

export function mockFetchError(error = 'Network error') {
  return vi.fn().mockRejectedValue(new Error(error));
}

/**
 * Create mock HuggingFace response
 */
export function createMockHFResponse(content = 'Test response') {
  return {
    choices: [
      {
        message: {
          content,
        },
      },
    ],
  };
}

/**
 * Create mock embedding vector
 */
export function createMockEmbedding(dimensions = 1024) {
  return Array(dimensions).fill(0).map(() => Math.random());
}

/**
 * Assert error was logged
 */
export function expectErrorLogged(consoleSpy, message) {
  expect(consoleSpy).toHaveBeenCalledWith(
    expect.stringContaining(message),
    expect.anything()
  );
}

/**
 * Clean up all mocks
 */
export function cleanupMocks() {
  vi.clearAllMocks();
  vi.restoreAllMocks();
}
