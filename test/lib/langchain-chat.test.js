// test/lib/langchain-chat.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateChatResponse,
  analyzeEmotion,
  enhanceResponseWithEmotion,
  buildPastContext,
  convertToLangChainMessages
} from '@/lib/langchain-chat';
import { InferenceClient } from '@huggingface/inference';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

vi.mock('@huggingface/inference');

describe('LangChain Chat - generateChatResponse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate chat response successfully', async () => {
    const mockResponse = {
      choices: [
        { message: { content: 'Hello! How can I help you?' } }
      ]
    };

    InferenceClient.prototype.chatCompletion = vi.fn().mockResolvedValue(mockResponse);

    const messages = [new HumanMessage('Hello')];
    const response = await generateChatResponse(messages);

    expect(response).toBe('Hello! How can I help you?');
    expect(InferenceClient.prototype.chatCompletion).toHaveBeenCalled();
  });

  it('should use custom model and temperature', async () => {
    const mockResponse = {
      choices: [{ message: { content: 'Response' } }]
    };

    InferenceClient.prototype.chatCompletion = vi.fn().mockResolvedValue(mockResponse);

    const messages = [new HumanMessage('Test')];
    await generateChatResponse(messages, {
      model: 'custom-model',
      temperature: 0.5,
      maxTokens: 500
    });

    expect(InferenceClient.prototype.chatCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'custom-model',
        temperature: 0.5,
        max_tokens: 500
      })
    );
  });

  it('should handle API errors', async () => {
    InferenceClient.prototype.chatCompletion = vi.fn().mockRejectedValue(
      new Error('API error')
    );

    const messages = [new HumanMessage('Hello')];
    
    await expect(generateChatResponse(messages)).rejects.toThrow(
      'AI is busy — try again in 10s'
    );
  });
});

describe('LangChain Chat - analyzeEmotion', () => {
  it('should analyze emotion successfully', async () => {
    const mockResult = [
      { label: 'joy', score: 0.85 }
    ];

    InferenceClient.prototype.textClassification = vi.fn().mockResolvedValue(mockResult);

    const result = await analyzeEmotion('I am so happy today!');

    expect(result).toEqual({ label: 'joy', score: 0.85 });
  });

  it('should return neutral on error', async () => {
    InferenceClient.prototype.textClassification = vi.fn().mockRejectedValue(
      new Error('API error')
    );

    const result = await analyzeEmotion('test');

    expect(result).toEqual({ label: 'neutral', score: 0 });
  });
});

describe('LangChain Chat - enhanceResponseWithEmotion', () => {
  it('should enhance response for high-confidence sadness', () => {
    const response = 'I understand.';
    const emotion = { label: 'sadness', score: 0.8 };

    const enhanced = enhanceResponseWithEmotion(response, emotion);

    expect(enhanced).toContain("I'm really sorry");
    expect(enhanced).toContain(response);
  });

  it('should enhance response for anger', () => {
    const response = 'Let me help.';
    const emotion = { label: 'anger', score: 0.7 };

    const enhanced = enhanceResponseWithEmotion(response, emotion);

    expect(enhanced).toContain('frustrated');
    expect(enhanced).toContain(response);
  });

  it('should not enhance for low confidence', () => {
    const response = 'I understand.';
    const emotion = { label: 'sadness', score: 0.3 };

    const enhanced = enhanceResponseWithEmotion(response, emotion);

    expect(enhanced).toBe(response);
  });

  it('should not enhance for unknown emotions', () => {
    const response = 'I understand.';
    const emotion = { label: 'unknown', score: 0.9 };

    const enhanced = enhanceResponseWithEmotion(response, emotion);

    expect(enhanced).toBe(response);
  });
});

describe('LangChain Chat - buildPastContext', () => {
  it('should build context from past conversations', () => {
    const pastConversations = [
      { role: 'user', content: 'I feel sad', timestamp: Date.now() },
      { role: 'assistant', content: 'I understand', timestamp: Date.now() }
    ];

    const context = buildPastContext(pastConversations);

    expect(context).toContain('Relevant past moments');
    expect(context).toContain('I feel sad');
  });

  it('should return empty string for no conversations', () => {
    expect(buildPastContext([])).toBe('');
    expect(buildPastContext(null)).toBe('');
  });

  it('should limit to 3 conversations', () => {
    const pastConversations = Array(10).fill(null).map((_, i) => ({
      role: 'user',
      content: `Message ${i}`,
      timestamp: Date.now()
    }));

    const context = buildPastContext(pastConversations);
    const messageCount = (context.match(/Message/g) || []).length;

    expect(messageCount).toBe(3);
  });
});

describe('LangChain Chat - convertToLangChainMessages', () => {
  it('should convert user messages to HumanMessage', () => {
    const messages = [
      { role: 'user', content: 'Hello' }
    ];

    const converted = convertToLangChainMessages(messages);

    expect(converted[0]).toBeInstanceOf(HumanMessage);
    expect(converted[0].content).toBe('Hello');
  });

  it('should convert assistant messages to AIMessage', () => {
    const messages = [
      { role: 'assistant', content: 'Hi there' }
    ];

    const converted = convertToLangChainMessages(messages);

    expect(converted[0]).toBeInstanceOf(AIMessage);
    expect(converted[0].content).toBe('Hi there');
  });

  it('should handle mixed messages', () => {
    const messages = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi' },
      { role: 'user', content: 'How are you?' }
    ];

    const converted = convertToLangChainMessages(messages);

    expect(converted).toHaveLength(3);
    expect(converted[0]).toBeInstanceOf(HumanMessage);
    expect(converted[1]).toBeInstanceOf(AIMessage);
    expect(converted[2]).toBeInstanceOf(HumanMessage);
  });
});
