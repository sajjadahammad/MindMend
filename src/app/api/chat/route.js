import { HfInference } from "@huggingface/inference";
import { NextResponse } from "next/server";

const hf = new HfInference(process.env.HF_API_KEY);

export async function POST(req) {
  try {
    const { messages } = await req.json();
    const userMessage = messages[messages.length - 1].content;

    const sentiment = await hf.request({
      model: "distilbert-base-uncased-finetuned-sst-2-english",
      inputs: userMessage,
    });

    const response = await hf.textGeneration({
      model: "EleutherAI/gpt-neo-1.3B",
      inputs: userMessage,
      parameters: {
        max_new_tokens: 100,
        do_sample: true,
        temperature: 0.7,
      },
    });

    return NextResponse.json({
      role: "assistant",
      content: response.generated_text,
      data: { sentiment },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "An unknown error occurred" },
      { status: 500 }
    );
  }
}
