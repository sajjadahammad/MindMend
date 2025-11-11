// src/app/api/chat/route.js
import { storeConversation, retrieveConversations } from '@/lib/pinecone';
import { analyzeEmotion, generateChatResponse } from '@/lib/langchain-chat';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

export const maxDuration = 30;

export async function POST(req) {
  try {
    const { messages, userId } = await req.json();
    
    // CRITICAL: Validate userId to prevent cross-user data leaks
    if (!userId || typeof userId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Valid user ID is required' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    const userMessage = lastMessage.parts
      .filter(part => part.type === 'text')
      .map(part => part.text)
      .join('');

    // === 1. ANALYZE EMOTION ===
    let emotionData = null;
    try {
      emotionData = await analyzeEmotion(userMessage);
    } catch (err) {
      console.error('Emotion analysis failed:', err);
    }

    // === 2. GET USER-SPECIFIC PAST MESSAGES FROM PINECONE ===
    let pastSummary = '';
    try {
      // FIXED: Use query-based retrieval for better context
      const past = await retrieveConversations(userId, userMessage, 5);
      
      if (past && past.length > 0) {
        // CRITICAL: Double-check all results belong to this user
        const userSpecificPast = past.filter(
          m => m.userId === userId || m.metadata?.userId === userId
        );

        if (userSpecificPast.length > 0) {
          // Get recent user messages for context
          const userMsgs = userSpecificPast
            .filter(m => m.role === 'user')
            .slice(-3)
            .map(m => m.content)
            .join('\n- ');

          if (userMsgs) {
            pastSummary = `\n\nRELEVANT PAST CONTEXT FROM THIS USER:\n- ${userMsgs}`;
          }
        }
      }
    } catch (e) {
      console.error('Memory retrieval failed:', e);
      // Continue without memory rather than failing
    }

    // === 3. BUILD PROFESSIONAL THERAPIST PROMPT ===
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

    // === 4. BUILD CONVERSATION CONTEXT ===
    const langchainMessages = [
      new SystemMessage(systemPrompt),
      // Include recent conversation history for context
      ...messages.slice(-6).map(m => {
        const content = m.parts
          .filter(part => part.type === 'text')
          .map(part => part.text)
          .join('');
        return new HumanMessage(content);
      })
    ];

    // === 5. GENERATE RESPONSE ===
    const response = await generateChatResponse(langchainMessages, {
      model: 'Qwen/Qwen2.5-7B-Instruct',
      temperature: 0.7,
      maxTokens: 500,
    });

    // === 6. STORE WITH USER ISOLATION ===
    await storeConversation(userId, userMessage, 'user', {
      userId, // CRITICAL: Include in metadata
      timestamp: new Date().toISOString()
    });
    
    // Serialize emotion data for Pinecone (only accepts simple types)
    const emotionMetadata = emotionData ? {
      emotionLabel: emotionData.label,
      emotionScore: emotionData.score
    } : {};
    
    await storeConversation(userId, response, 'assistant', {
      userId, // CRITICAL: Include in metadata
      timestamp: new Date().toISOString(),
      ...emotionMetadata
    });

    // === 7. CREATE STREAMING RESPONSE ===
    // Create a readable stream that sends the response in AI SDK format
    const encoder = new TextEncoder();
    const messageId = Date.now().toString();
    const textPartId = `${messageId}-text`;
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 1. Send message start event
          controller.enqueue(encoder.encode(`0:${JSON.stringify({
            id: messageId,
            role: "assistant",
            parts: []
          })}\n`));
          
          // 2. Send text part start
          controller.enqueue(encoder.encode(`a:${JSON.stringify({
            type: "text",
            id: textPartId,
            text: ""
          })}\n`));
          
          // 3. Send text delta
          controller.enqueue(encoder.encode(`2:${JSON.stringify({
            type: "text-delta",
            id: textPartId,
            textDelta: response
          })}\n`));
          
          // 4. Send metadata if emotion data exists
          if (emotionData) {
            controller.enqueue(encoder.encode(`d:${JSON.stringify({
              emotion: [emotionData]
            })}\n`));
          }
          
          // 5. Send finish event
          controller.enqueue(encoder.encode(`e:${JSON.stringify({
            finishReason: "stop"
          })}\n`));
          
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      }
    });

   return new Response(stream, {
  headers: {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'X-Vercel-AI-Data-Stream': 'v1'
  }
})


  } catch (error) {
    console.error('API ERROR:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'I apologize, but I encountered an issue. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}