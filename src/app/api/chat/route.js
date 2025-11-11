// src/app/api/chat/route.js
import { NextResponse } from 'next/server';
import { storeConversation, retrieveConversations } from '@/lib/pinecone';
import { analyzeEmotion, generateChatResponse } from '@/lib/langchain-chat';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

// src/app/api/chat/route.js
export async function POST(req) {
  try {
    const { messages, userId = 'user-1' } = await req.json();
    const userMessage = messages[messages.length - 1].content;

    // === 1. GET REAL PAST MESSAGES FROM PINECONE ===
    let pastSummary = '';
    try {
      const past = await retrieveConversations(userId, "", 20); // GET ALL
      if (past.length > 0) {
        const userMsgs = past
          .filter(m => m.role === 'user')
          .slice(-5)
          .map(m => m.content)
          .join(' | ');

        pastSummary = `REAL PAST MESSAGES FROM THIS USER: "${userMsgs}"`;
        console.log('USING REAL MEMORY:', pastSummary);
      }
    } catch (e) {
      console.error('Memory failed');
    }

    // === 2. BUILD BULLETPROOF PROMPT ===
    const systemPrompt = `You are a compassionate, professional therapist AI assistant. Your role is to provide emotional support and guidance.

CORE PRINCIPLES:
- Listen actively and validate the user's feelings
- Ask clarifying, open-ended questions when helpful
- Never make assumptions about what wasn't explicitly said
- Stay focused on the user's emotional well-being
- Use therapeutic techniques: reflection, reframing, empathy
- Maintain professional boundaries

RESPONSE GUIDELINES:
- Be warm but professional in tone
- Use natural, conversational language with proper line breaks
- When the user mentions specific topics, engage directly with those topics
- If the conversation shifts, acknowledge it and follow their lead
- Format responses clearly - use line breaks between thoughts

STRICT RULES:
- You are speaking with ONE individual user (User ID: ${userId.substring(0, 8)}...)
- NEVER mention other users or reference conversations from other people
- If you don't recall something the user mentioned, say: "I don't remember that - could you remind me?"
- NEVER fabricate memories or details that weren't shared
- Stay in your role as a therapist - if asked about unrelated topics, gently redirect: "I'm here to support your emotional wellbeing. How are you feeling about that?"

${pastSummary}

Remember: Focus entirely on THIS user's unique experience and emotions.`.trim();


    const langchainMessages = [
      new SystemMessage(systemPrompt),
      ...messages.map(m => new HumanMessage(m.content)),
      new HumanMessage(userMessage)
    ];

    // === 3. GENERATE ===
    const response = await generateChatResponse(langchainMessages, {
      model: 'Qwen/Qwen2.5-7B-Instruct',
      temperature: 0.7,
    });

    // === 4. STORE ===
    await storeConversation(userId, userMessage, 'user');
    await storeConversation(userId, response, 'assistant');

    return NextResponse.json({
      id: Date.now().toString(),
      role: 'assistant',
      content: response.trim(),
    });

  } catch (error) {
    console.error('API ERROR:', error);
    return NextResponse.json({ error: 'I got stuck' }, { status: 500 });
  }
}