// src/lib/langchain-chat.js
import { InferenceClient } from '@huggingface/inference';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

const hf = new InferenceClient(process.env.HF_API_KEY,{
  defaultProvider: 'hf-inference',
});

// THIS IS THE ONLY MODEL THAT WORKS 100% WITH chatCompletion ON FREE TIER
const DEFAULT_MODEL = 'Qwen/Qwen2.5-7B-Instruct';

export async function generateChatResponse(messages, options = {}) {
  const { model = DEFAULT_MODEL, maxTokens = 300, temperature = 0.7 } = options;

  // Convert LangChain messages → OpenAI format
  const openAIMessages = messages.map(msg => {
    if (msg instanceof HumanMessage || msg.role === 'user') {
      return { role: 'user', content: msg.content };
    }
    if (msg instanceof AIMessage || msg.role === 'assistant') {
      return { role: 'assistant', content: msg.content };
    }
    return { role: 'user', content: msg.content };
  });

  try {
    const result = await hf.chatCompletion({
      model,
      messages: [
        {
          role: 'system',
          content: `You are a warm, empathetic AI therapist. 
Be supportive, never clinical. Validate feelings. Ask gentle questions. 
Never give medical advice. Sound like a caring friend.`
        },
        ...openAIMessages
      ],
      max_tokens: maxTokens,
      temperature,
      stream: false,
    });

    return result.choices[0].message.content.trim();
  } catch (error) {
    console.error('HF Error:', error);
    throw new Error('AI is busy — try again in 10s');
  }
}

// Keep your existing helpers
export async function analyzeEmotion(text) {
  try {
    const result = await hf.textClassification({
      model: 'bhadresh-savani/distilbert-base-uncased-emotion',
      inputs: text,
    });
    const top = result[0];
    return { label: top.label.toLowerCase(), score: top.score };
  } catch {
    return { label: 'neutral', score: 0 };
  }
}

export function enhanceResponseWithEmotion(response, emotion) {
  if (emotion.score < 0.6) return response;
  const prefixes = {
    sadness: "I'm really sorry you're feeling this way... ",
    anger: "I can hear how frustrated you are, and that's completely valid. ",
    fear: "It's okay to feel scared sometimes. You're not alone. ",
    joy: "This makes me smile too! ",
  };
  const prefix = prefixes[emotion.label];
  return prefix ? prefix + response : response;
}

export function buildPastContext(pastConversations) {
  if (!pastConversations?.length) return '';
  return '\nRelevant past moments:\n' + pastConversations
    .slice(0, 3)
    .map(c => `[${new Date(c.timestamp).toLocaleDateString()}] ${c.role}: ${c.content}`)
    .join('\n');
}

export function convertToLangChainMessages(messages) {
  return messages.map(m => 
    m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
  );
}