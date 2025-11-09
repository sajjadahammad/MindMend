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
    const systemPrompt = `
You are a caring AI who remembers EVERYTHING the user said.
${pastSummary ? `USE ONLY THIS REAL DATA: ${pastSummary}` : 'This is the first message. Be warm.'}
NEVER make up details. If you don't know, say "I don't remember that — tell me again?"
`.trim();

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