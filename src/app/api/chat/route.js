import { HfInference } from '@huggingface/inference';
import { NextResponse } from 'next/server';

const hf = new HfInference(process.env.HF_API_KEY);

export async function POST(req) {
  try {
    const { messages } = await req.json();
    const userMessage = messages[messages.length - 1].content;

    let sentimentLabel = 'Neutral';
    try {
      const sentimentResponse = await fetch(
        'https://api-inference.huggingface.co/models/bhadresh-savani/distilbert-base-uncased-emotion',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.HF_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inputs: userMessage }),
        }
      );
      if (!sentimentResponse.ok) {
        console.error('Sentiment API error:', sentimentResponse.status, await sentimentResponse.text());
        throw new Error(`Sentiment API request failed with status ${sentimentResponse.status}`);
      }
      const sentimentText = await sentimentResponse.text();
      try {
        const sentiment = JSON.parse(sentimentText);
        sentimentLabel = sentiment[0]?.label || 'Neutral';
      } catch (parseError) {
        console.error('Failed to parse sentiment response:', sentimentText, parseError);
      }
    } catch (sentimentError) {
      console.error('Sentiment analysis error:', sentimentError);
    }

    // Enhanced prompt for empathetic, human-like responses
    const prompt = `You are a compassionate AI therapist designed to provide emotional support and feel like a caring friend. Your tone should be warm, conversational, and empathetic. Follow these guidelines:
- Always start your response with "Hello!" unless the user is continuing a conversation.
- Validate the user's feelings (e.g., "It sounds really tough to feel that way").
- Ask thoughtful follow-up questions to encourage reflection (e.g., "Can you tell me more about what's been going on?").
- Offer practical coping strategies or self-care tips when appropriate (e.g., "Maybe taking a short walk could help clear your mind").
- Avoid clinical or distant language; sound like a supportive friend.
- Never say you’re unable to help; instead, gently encourage the user to share more or seek support if needed.
- Do not provide medical advice, but focus on emotional support.

Example:
User: I'm feeling really sad today.
Assistant: Hello! I'm so sorry to hear you're feeling sad today—it sounds really tough. Can you share a bit more about what's been going on? Sometimes talking it out can help, and I'm here to listen.

User: ${userMessage}
Assistant: Hello!`;

    try {
      const response = await hf.textGeneration({
        model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
        inputs: prompt,
        parameters: {
          max_new_tokens: 200,
          do_sample: true,
          temperature: 0.7,
          return_full_text: false,
          stop: ['User:', 'Human:'],
        },
      });

      // Customize response based on sentiment
      let finalResponse = response.generated_text;
      if (sentimentLabel.toLowerCase() === 'sadness' || sentimentLabel.toLowerCase() === 'anger') {
        finalResponse = `Hello! It sounds like you're going through a really tough time with those feelings. ${finalResponse} Would you like to share more about what's been happening? I'm here to listen.`;
      }

      const assistantMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: finalResponse,
        data: { sentiment: [{ label: sentimentLabel }] },
      };

      return NextResponse.json(assistantMessage);
    } catch (hfError) {
      console.error('Hugging Face API error:', hfError);
      return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message || 'An unknown error occurred' }, { status: 500 });
  }
}