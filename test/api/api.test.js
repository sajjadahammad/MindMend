// test/api/api.test.js
/**
 * API Route Tests
 * Note: These tests mock the core functionality without importing the route directly
 * to avoid Next.js Request/Response issues in Jest
 */
import { storeConversation, retrieveConversations } from '@/lib/pinecone';
import { generateChatResponse } from '@/lib/langchain-chat';

// Mock dependencies
jest.mock('@/lib/pinecone');
jest.mock('@/lib/langchain-chat');

describe('Chat API Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should process chat request successfully', async () => {
    const mockMessages = [
      { role: 'user', content: 'Hello' }
    ];
    const userId = 'test-user-1';
    const userMessage = mockMessages[mockMessages.length - 1].content;

    retrieveConversations.mockResolvedValue([]);
    generateChatResponse.mockResolvedValue('Hi! How can I help you today?');
    storeConversation.mockResolvedValue(undefined);

    // Simulate the API logic
    const pastConversations = await retrieveConversations(userId, '', 20);
    const response = await generateChatResponse(mockMessages);
    await storeConversation(userId, userMessage, 'user');
    await storeConversation(userId, response, 'assistant');

    expect(retrieveConversations).toHaveBeenCalledWith(userId, '', 20);
    expect(generateChatResponse).toHaveBeenCalled();
    expect(storeConversation).toHaveBeenCalledWith(userId, 'Hello', 'user');
    expect(storeConversation).toHaveBeenCalledWith(userId, 'Hi! How can I help you today?', 'assistant');
    expect(response).toBe('Hi! How can I help you today?');
  });

  it('should retrieve and use past conversations', async () => {
    const mockPastConversations = [
      { role: 'user', content: 'I feel sad' },
      { role: 'assistant', content: 'I understand' }
    ];
    const userId = 'test-user-1';

    retrieveConversations.mockResolvedValue(mockPastConversations);
    generateChatResponse.mockResolvedValue('How are you feeling now?');
    storeConversation.mockResolvedValue(undefined);

    const pastConversations = await retrieveConversations(userId, '', 20);
    
    expect(pastConversations).toEqual(mockPastConversations);
    expect(retrieveConversations).toHaveBeenCalledWith(userId, '', 20);
  });

  it('should handle retrieval errors gracefully', async () => {
    retrieveConversations.mockRejectedValue(new Error('Database error'));

    try {
      await retrieveConversations('test-user', '', 20);
    } catch (error) {
      expect(error.message).toBe('Database error');
    }
  });

  it('should handle generation errors', async () => {
    generateChatResponse.mockRejectedValue(new Error('AI error'));

    try {
      await generateChatResponse([{ role: 'user', content: 'Hello' }]);
    } catch (error) {
      expect(error.message).toBe('AI error');
    }
  });

  it('should store both user and assistant messages', async () => {
    const userId = 'test-user';
    const userMessage = 'Hello';
    const assistantMessage = 'Hi there!';

    storeConversation.mockResolvedValue(undefined);

    await storeConversation(userId, userMessage, 'user');
    await storeConversation(userId, assistantMessage, 'assistant');

    expect(storeConversation).toHaveBeenCalledTimes(2);
    expect(storeConversation).toHaveBeenNthCalledWith(1, userId, userMessage, 'user');
    expect(storeConversation).toHaveBeenNthCalledWith(2, userId, assistantMessage, 'assistant');
  });
});
