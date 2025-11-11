# LangChain + Pinecone Setup Guide

## Overview
This project uses the latest LangChain patterns with HuggingFace and Pinecone for intelligent conversation management.

## Architecture
- **LangChain**: Modern conversation patterns and message handling
- **HuggingFace**: Text generation and embeddings via latest SDK
- **Pinecone**: Vector database for semantic conversation search

## Prerequisites
1. Create a Pinecone account at https://www.pinecone.io/
2. Get your API key from the Pinecone dashboard
3. Ensure you have a HuggingFace API key

## Setup Steps

### 1. Create a Pinecone Index
In your Pinecone dashboard:
- Click "Create Index"
- Name: `chat-conversations` (or update PINECONE_INDEX_NAME in .env)
- Dimensions: `384` (for sentence-transformers/all-MiniLM-L6-v2 embeddings)
- Metric: `cosine`
- Cloud: Choose your preferred cloud provider
- Region: Choose closest to your users

### 2. Configure Environment Variables
Update your `.env` file with:
```env
HF_API_KEY='your-huggingface-api-key'
PINECONE_API_KEY='your-actual-pinecone-api-key'
PINECONE_INDEX_NAME='chat-conversations'
```

### 3. How It Works

#### LangChain Integration
- Uses `@langchain/core` for message handling (HumanMessage, AIMessage, SystemMessage)
- Implements ChatPromptTemplate for structured prompts
- Custom HuggingFaceEmbeddings class following latest LangChain patterns

#### Conversation Flow
1. User sends message
2. Emotion analysis via HuggingFace emotion detection model
3. Semantic search in Pinecone for relevant past conversations
4. LangChain formats messages and context
5. HuggingFace generates response
6. Response enhanced based on detected emotion
7. Conversation stored in Pinecone with embeddings

#### Storage & Retrieval
- **Storage**: Every message stored with HuggingFace embeddings (384 dimensions)
- **Retrieval**: Semantic similarity search finds relevant past conversations
- **Context**: Top 3 most relevant past conversations included in prompt
- **Metadata**: userId, role, timestamp, emotion label, emotion score

### 4. API Usage
The chat API accepts an optional `userId` parameter:
```javascript
fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'Hello!' }
    ],
    userId: 'user-123' // Optional, defaults to 'default-user'
  })
})
```

### 5. Features
- ✅ Latest LangChain patterns for conversation management
- ✅ HuggingFace embeddings for semantic search
- ✅ Pinecone vector storage for conversation history
- ✅ Emotion detection and response enhancement
- ✅ Graceful fallback when Pinecone not configured
- ✅ Conversation continuity across sessions
- ✅ Personalized responses based on history

### 6. File Structure
```
src/
├── app/api/chat/route.js       # Main chat API endpoint
├── lib/
│   ├── pinecone.js             # Pinecone + LangChain vector store
│   └── langchain-chat.js       # LangChain conversation helpers
```

### 7. Optional: Running Without Pinecone
The system works without Pinecone configured. It will:
- Skip conversation storage
- Skip past conversation retrieval
- Still provide emotion-aware responses
- Still use LangChain message formatting
