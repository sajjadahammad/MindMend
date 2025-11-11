import { InferenceClient } from '@huggingface/inference';

const hf = new InferenceClient(process.env.HF_API_KEY);

/**
 * Analyze emotion from text using HuggingFace
 */
export async function analyzeEmotion(text) {
  try {
    const result = await hf.textClassification({
      model: 'SamLowe/roberta-base-go_emotions',
      inputs: text,
    });

    // Return top emotion
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Emotion analysis error:', error);
    return null;
  }
}

/**
 * Generate embeddings for semantic search
 */
export async function generateEmbedding(text) {
  try {
    const response = await hf.featureExtraction({
      model: 'sentence-transformers/stsb-roberta-large',
      inputs: text,
    });
    
    return Array.isArray(response) ? response : Array.from(response);
  } catch (error) {
    console.error('Embedding generation error:', error);
    throw error;
  }
}

/**
 * Generate chat response using HuggingFace Inference API
 * NOTE: This is for non-streaming responses
 */
export async function generateChatResponse(messages, options = {}) {
  try {
    // Convert LangChain messages to HuggingFace chat format
    const chatMessages = messages.map(msg => {
      const role = msg._getType() === 'system' ? 'system' : 
                   msg._getType() === 'human' ? 'user' : 'assistant';
      return {
        role,
        content: msg.content
      };
    });

    // Use chatCompletion for conversational models
    const response = await hf.chatCompletion({
      model: options.model || 'Qwen/Qwen2.5-7B-Instruct',
      messages: chatMessages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 500,
    });

    return response.choices[0].message.content.trim();
    
  } catch (error) {
    console.error('Chat generation error:', error);
    throw error;
  }
}

/**
 * Build therapeutic system prompt with user context
 */
export function buildTherapistPrompt(userId, userContext = '') {
  return `You are a professional, empathetic therapist AI. 

YOUR IDENTITY:
- You are speaking with ONE specific user (ID: ${userId.substring(0, 8)}...)
- You have access ONLY to this user's conversation history
- NEVER reference or mention other users or their conversations

YOUR APPROACH:
- Use active listening and reflection techniques
- Ask open-ended questions to understand deeper
- Validate feelings without judgment
- Provide gentle insights when appropriate
- Format responses clearly with proper line breaks

BOUNDARIES:
- Stay focused on mental health and emotional support
- If asked about unrelated topics, gently redirect
- Never fabricate memories or make assumptions
- If you don't remember something, acknowledge it honestly

${userContext ? `CONTEXT FROM PAST CONVERSATIONS:\n${userContext}\n` : ''}

Remember: Every user deserves your full, undivided attention. Focus on THEIR unique journey.`;
}

/**
 * Format conversation history for context
 */
export function formatConversationHistory(conversations, maxMessages = 5) {
  if (!conversations || conversations.length === 0) {
    return '';
  }

  return conversations
    .slice(-maxMessages)
    .map(conv => {
      const role = conv.role === 'user' ? 'User' : 'Therapist';
      return `${role}: ${conv.content}`;
    })
    .join('\n\n');
}

/**
 * Sanitize and validate user input
 */
export function sanitizeUserInput(input) {
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid input');
  }

  // Remove potential injection attempts
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .trim()
    .slice(0, 2000); // Limit length
}

/**
 * Create user-specific conversation ID
 */
export function createConversationId(userId, timestamp = Date.now()) {
  return `${userId}-${timestamp}`;
}