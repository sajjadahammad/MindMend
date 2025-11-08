// src/app/api/chat/route.js
import { NextResponse } from 'next/server';
import { storeConversation, retrieveConversations, isPineconeConfigured } from '@/lib/pinecone';
import {
  analyzeEmotion,
  generateChatResponse,
  enhanceResponseWithEmotion,
  buildPastContext,
  convertToLangChainMessages,
} from '@/lib/langchain-chat';
import { HumanMessage } from '@langchain/core/messages';

const usePinecone = isPineconeConfigured();

export async function POST(req) {
  try {
    const { messages, userId = 'default-user' } = await req.json();
    const userMessage = messages[messages.length - 1].content;
    const isFirstMessage = messages.length <= 1 || messages.filter(m => m.role === 'user').length === 1;

    // 1. Retrieve past conversations from Pinecone
    let pastConversations = [];
    if (usePinecone) {
      try {
        pastConversations = await retrieveConversations(userId, userMessage, 3);
      } catch (error) {
        console.error('Pinecone retrieval error:', error);
      }
    }

    // 2. Analyze emotion
    const emotion = await analyzeEmotion(userMessage);

    // 3. Build recent conversation history (last 10 messages)
    const recentHistory = messages.slice(-10);
    const langchainMessages = convertToLangChainMessages(recentHistory);

    // 4. Add hidden context (emotion + past convos)
    const pastContext = buildPastContext(pastConversations);
    if (pastContext) {
      langchainMessages.push(new HumanMessage(`[Relevant past: ${pastContext}]`));
    }
    if (emotion.score > 0.5) {
      langchainMessages.push(new HumanMessage(`[Emotion: ${emotion.label} – respond with empathy]`));
    }

    // 5. Add current user message
    langchainMessages.push(new HumanMessage(userMessage));

    // 6. Generate AI response using chatCompletion + Qwen (WORKS 100%)
    let response;
    try {
      response = await generateChatResponse(langchainMessages, {
        model: 'Qwen/Qwen2.5-7B-Instruct',
        maxTokens: 300,
        temperature: 0.75,
      });
    } catch (hfError) {
      console.error('Hugging Face API error:', hfError);
      return NextResponse.json({ error: 'AI is busy – try again in 10s' }, { status: 500 });
    }

    // 7. Enhance with emotion prefix
    const finalResponse = enhanceResponseWithEmotion(response, emotion);

    // 8. Store in Pinecone
    if (usePinecone) {
      try {
        await storeConversation(userId, userMessage, 'user', emotion);
        await storeConversation(userId, finalResponse, 'assistant');
      } catch (storeError) {
        console.error('Pinecone store error:', storeError);
        // Don't break the chat if Pinecone fails
      }
    }

    // 9. Return response
    return NextResponse.json({
      id: Date.now().toString(),
      role: 'assistant',
      content: finalResponse,
      data: {
        emotion: [{ label: emotion.label, score: emotion.score }],
      },
    });

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}