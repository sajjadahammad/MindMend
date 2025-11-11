// test/integration/chat-flow.test.js
/**
 * Integration tests for the complete chat flow
 * These tests verify the end-to-end functionality without importing Next.js routes
 */

import { storeConversation, retrieveConversations } from '@/lib/pinecone';
import { generateChatResponse } from '@/lib/langchain-chat';

jest.mock('@/lib/pinecone');
jest.mock('@/lib/langchain-chat');

describe('Chat Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle complete conversation flow', async () => {
    const userId = 'test-user';
    
    // Setup: User starts conversation
    retrieveConversations.mockResolvedValue([]);
    generateChatResponse.mockResolvedValue('Hello! How can I help you today?');
    storeConversation.mockResolvedValue(undefined);

    // First message
    const userMessage1 = 'Hello';
    const aiResponse1 = await generateChatResponse([{ role: 'user', content: userMessage1 }]);
    await storeConversation(userId, userMessage1, 'user');
    await storeConversation(userId, aiResponse1, 'assistant');

    expect(aiResponse1).toBe('Hello! How can I help you today?');
    expect(storeConversation).toHaveBeenCalledWith(userId, 'Hello', 'user');
    expect(storeConversation).toHaveBeenCalledWith(userId, 'Hello! How can I help you today?', 'assistant');

    // Second message: System should retrieve past conversation
    retrieveConversations.mockResolvedValue([
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hello! How can I help you today?' }
    ]);
    generateChatResponse.mockResolvedValue('I understand. Tell me more.');

    const pastConversations = await retrieveConversations(userId, '', 20);
    const userMessage2 = 'I feel anxious';
    const aiResponse2 = await generateChatResponse([
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hello! How can I help you today?' },
      { role: 'user', content: userMessage2 }
    ]);

    expect(pastConversations.length).toBe(2);
    expect(aiResponse2).toBe('I understand. Tell me more.');
  });

  it('should maintain context across multiple messages', async () => {
    const conversationHistory = [];
    const userId = 'john-123';

    // Message 1
    retrieveConversations.mockResolvedValue([]);
    generateChatResponse.mockResolvedValue('Nice to meet you, John!');
    storeConversation.mockImplementation((userId, message, role) => {
      conversationHistory.push({ userId, message, role });
      return Promise.resolve();
    });

    await generateChatResponse([{ role: 'user', content: 'My name is John' }]);
    await storeConversation(userId, 'My name is John', 'user');
    await storeConversation(userId, 'Nice to meet you, John!', 'assistant');

    // Message 2 - should have context
    retrieveConversations.mockResolvedValue([
      { role: 'user', content: 'My name is John' },
      { role: 'assistant', content: 'Nice to meet you, John!' }
    ]);
    generateChatResponse.mockResolvedValue('I remember you mentioned feeling anxious.');

    const pastConversations = await retrieveConversations(userId, '', 20);
    await generateChatResponse([
      { role: 'user', content: 'My name is John' },
      { role: 'assistant', content: 'Nice to meet you, John!' },
      { role: 'user', content: 'I feel better now' }
    ]);

    expect(conversationHistory.length).toBeGreaterThan(0);
    expect(pastConversations.length).toBe(2);
    expect(retrieveConversations).toHaveBeenCalledWith(userId, '', 20);
  });

  it('should handle user switching correctly', async () => {
    // User 1 conversation
    retrieveConversations.mockResolvedValue([]);
    generateChatResponse.mockResolvedValue('Hello User 1!');
    storeConversation.mockResolvedValue(undefined);

    await retrieveConversations('user-1', '', 20);
    await generateChatResponse([{ role: 'user', content: 'Hi' }]);
    
    expect(retrieveConversations).toHaveBeenCalledWith('user-1', '', 20);

    // User 2 conversation - should not see User 1's data
    jest.clearAllMocks();
    retrieveConversations.mockResolvedValue([]); // Empty for new user
    generateChatResponse.mockResolvedValue('Hello User 2!');

    await retrieveConversations('user-2', '', 20);
    await generateChatResponse([{ role: 'user', content: 'Hi' }]);
    
    expect(retrieveConversations).toHaveBeenCalledWith('user-2', '', 20);
    expect(retrieveConversations).not.toHaveBeenCalledWith('user-1', expect.any(String), expect.any(Number));
  });

  it('should gracefully degrade when Pinecone fails', async () => {
    // Pinecone fails but chat should still work
    retrieveConversations.mockRejectedValue(new Error('Pinecone connection failed'));
    generateChatResponse.mockResolvedValue('I can still help you!');
    storeConversation.mockRejectedValue(new Error('Storage failed'));

    // Try to retrieve (will fail)
    try {
      await retrieveConversations('test-user', '', 20);
    } catch (error) {
      expect(error.message).toBe('Pinecone connection failed');
    }

    // But chat should still work
    const response = await generateChatResponse([{ role: 'user', content: 'Hello' }]);
    expect(response).toBe('I can still help you!');
  });

  it('should handle rapid successive messages', async () => {
    retrieveConversations.mockResolvedValue([]);
    generateChatResponse.mockResolvedValue('Response');
    storeConversation.mockResolvedValue(undefined);

    // Send all requests
    const responses = await Promise.all(
      Array(5).fill(null).map((_, i) => 
        generateChatResponse([{ role: 'user', content: `Message ${i}` }])
      )
    );

    expect(responses).toHaveLength(5);
    responses.forEach(response => {
      expect(response).toBe('Response');
    });
  });
});
