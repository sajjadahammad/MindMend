// src/lib/pinecone.js
import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from '@langchain/pinecone';
import { Document } from '@langchain/core/documents';
import { InferenceClient } from '@huggingface/inference';

const hf = new InferenceClient(process.env.HF_API_KEY,{
  defaultProvider: 'hf-inference',
});
const EMBEDDING_MODEL = 'BAAI/bge-large-en-v1.5'; // 1024 dimensions

// === EMBEDDING FUNCTIONS ===
export async function embedText(text) {
  try {
    const result = await hf.featureExtraction({
      model: EMBEDDING_MODEL,
      inputs: text,
    });
    return Array.from(result);
  } catch (error) {
    console.error('Embedding error:', error);
    throw error;
  }
}

export async function embedTexts(texts) {
  const embeddings = [];
  for (const text of texts) {
    const vec = await embedText(text);
    embeddings.push(vec);
  }
  return embeddings;
}

// === CREATE EMBEDDINGS OBJECT ===
const createEmbeddings = () => ({
  embedQuery: async (text) => await embedText(text),
  embedDocuments: async (texts) => await embedTexts(texts),
});

// === PINECONE SETUP ===
let pineconeClient = null;
let vectorStore = null;

export async function initPinecone() {
  if (!process.env.PINECONE_API_KEY || process.env.PINECONE_API_KEY.includes('your-key')) {
    throw new Error('Set PINECONE_API_KEY in .env');
  }

  if (pineconeClient) return pineconeClient;

  pineconeClient = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });

  return pineconeClient;
}

// === VECTOR STORE ===
export async function getVectorStore() {
  if (vectorStore) return vectorStore;

  await initPinecone();
  const index = pineconeClient.index(process.env.PINECONE_INDEX_NAME || 'chat-conversations');

  // Create embeddings object with required methods
  const embeddings = createEmbeddings();

  vectorStore = new PineconeStore(embeddings, {
    pineconeIndex: index,
    namespace: 'conversations',
  });

  return vectorStore;
}

// === CONFIG CHECK ===
export function isPineconeConfigured() {
  return !!(process.env.PINECONE_API_KEY && !process.env.PINECONE_API_KEY.includes('your-key'));
}

// === STORE CONVERSATION ===
export async function storeConversation(userId, message, role, emotion = null) {
  try {
    const store = await getVectorStore();

    const metadata = {
      userId: userId,
      role,
      timestamp: Date.now(),
      ...(emotion && { emotion: emotion.label, emotionScore: emotion.score }),
    };

    const doc = new Document({
      pageContent: message,
      metadata,
    });

    await store.addDocuments([doc]);
    console.log('✓ Stored:', role, message.slice(0, 50) + '...');
  } catch (error) {
    console.error('Failed to store in Pinecone:', error.message);
  }
}

// === RETRIEVE CONVERSATIONS ===
// src/lib/pinecone.js
export async function retrieveConversations(userId, query, limit = 10) {
  try {
    const store = await getVectorStore();

    // console.log('Searching Pinecone for user:', userId); // DEBUG

    const results = await store.similaritySearch(query, limit, {
      userId: { $eq: userId } // EXACT MATCH
    });

    // console.log('Pinecone returned:', results.length, 'messages'); // SEE THE TRUTH

    return results.map(doc => {
      console.log('→', doc.pageContent); // SEE EVERY MESSAGE
      return {
        content: doc.pageContent,
        role: doc.metadata.role,
      };
    });
  } catch (error) {
    console.error('Pinecone FAILED:', error.message);
    return [];
  }
}