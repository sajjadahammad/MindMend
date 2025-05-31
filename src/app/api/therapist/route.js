import { ConversationChain } from 'langchain/chains';
import { HuggingFaceInference } from '@langchain/community/llms/hf';
import { BufferMemory } from 'langchain/memory';
import { PromptTemplate } from '@langchain/core/prompts';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req) {
  try {
    // Step 1: Transcribe audio using direct API call
    const formData = await req.formData();
    const audio = formData.get('audio');
    
    if (!audio) {
      return NextResponse.json(
        { error: 'No audio file provided' }, 
        { status: 400 }
      );
    }
    
    console.log('Audio file type:', audio.type);
    console.log('Audio file name:', audio.name);
    console.log('Audio file size:', audio.size);
    
    // Check if audio format is supported
    const supportedFormats = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-wav'];
    const isSupported = supportedFormats.some(format => audio.type.includes(format));
    
    if (!isSupported) {
      return NextResponse.json(
        { 
          error: 'Unsupported audio format', 
          details: `Received: ${audio.type}. Supported formats: ${supportedFormats.join(', ')}`,
          suggestion: 'Please convert your audio to WAV, MP3, or MP4 format before uploading.'
        },
        { status: 400 }
      );
    }
    
    // Direct API call to HuggingFace
    let transcription;
    try {
      const audioBuffer = await audio.arrayBuffer();
      
      const response = await fetch(
        'https://api-inference.huggingface.co/models/openai/whisper-small',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.HF_TOKEN}`,
            'Content-Type': audio.type,
          },
          body: audioBuffer,
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const result = await response.json();
      transcription = { text: result.text };
      
      console.log('Transcription result:', transcription);
    } catch (transcriptionError) {
      console.error('Transcription error:', transcriptionError);
      return NextResponse.json(
        { error: 'Transcription failed', details: transcriptionError.message },
        { status: 500 }
      );
    }
    
    // Step 2: Generate therapeutic response using LangChain
    let response;
    try {
      const llm = new HuggingFaceInference({
        model: 'meta-llama/Llama-3.1-8B-Instruct',
        apiKey: process.env.HF_TOKEN,
        temperature: 0.7,
        maxTokens: 200,
      });
      
      const prompt = PromptTemplate.fromTemplate(`
        You are a compassionate AI therapist. Respond empathetically to the user's input, offering support and understanding. User input: {input}
      `);
      
      const memory = new BufferMemory();
      const chain = new ConversationChain({ llm, memory, prompt });
      
      response = await chain.predict({ input: transcription.text });
    } catch (llmError) {
      console.error('LLM generation error:', llmError);
      return NextResponse.json(
        { error: 'Text generation failed', details: llmError.message },
        { status: 500 }
      );
    }
    
    // Step 3: Convert response to audio using direct API call
    let audioUrl;
    try {
      const ttsResponse = await fetch(
        'https://api-inference.huggingface.co/models/facebook/mms-tts-eng',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.HF_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: response,
          }),
        }
      );
      
      if (!ttsResponse.ok) {
        throw new Error(`TTS HTTP error! status: ${ttsResponse.status}`);
      }
      
      const audioArrayBuffer = await ttsResponse.arrayBuffer();
      const audioBuffer = Buffer.from(audioArrayBuffer);
      const audioBase64 = audioBuffer.toString('base64');
      audioUrl = `data:audio/wav;base64,${audioBase64}`;
    } catch (ttsError) {
      console.error('TTS error:', ttsError);
      return NextResponse.json(
        { error: 'Text-to-speech failed', details: ttsError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      transcript: transcription.text, 
      audioUrl 
    });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

