import { HfInference } from '@huggingface/inference';
import { NextResponse } from 'next/server';

const hf = new HfInference('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');

export async function POST(req) {
    try {
        const { userMessage } =  await req.json();

        const sentiment = await hf.request({
            model: 'distilbert-base-uncased-finetuned-sst-2-english',
            inputs: userMessage,
        });

        // Text generation
        const response = await hf.textGeneration({
            model: 'EleutherAI/gpt-neo-1.3B',
            inputs: userMessage,
            parameters: { 
                max_new_tokens: 100,  
                do_sample: true,     
                temperature: 0.7     
            }});

        // Return results
        return NextResponse.json({
            response: response.generated_text,
            sentiment,
        });
    } catch (error) {
        // Error handling
        return NextResponse.json({ 
            error: error.message || 'An unknown error occurred' 
        }, { status: 500 });
    }
}