// src/lib/pinecone.js
import { Pinecone } from '@pinecone-database/pinecone';
import { generateEmbedding } from './langchain-chat';

// Initialize Pinecone
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const indexName = process.env.PINECONE_INDEX_NAME || 'therapy-chat';
const index = pinecone.index(indexName);

/**
 * Store conversation with STRICT user isolation
 */
export async function storeConversation(userId, content, role, metadata = {}) {
  try {
    // Validate inputs
    if (!userId || !content || !role) {
      throw new Error('Missing required fields: userId, content, or role');
    }

    // Generate embedding
    const embedding = await generateEmbedding(content);
    
    // Create unique ID with userId prefix for guaranteed isolation
    const recordId = `${userId}::${Date.now()}::${role}`;
    
    // Store with userId in MULTIPLE places for defense in depth
    await index.upsert([{
      id: recordId,
      values: embedding,
      metadata: {
        userId,           // PRIMARY: Filter field
        content,
        role,
        timestamp: new Date().toISOString(),
        createdAt: Date.now(),
        recordType: 'conversation',
        ...metadata,
        // Store userId again in a prefixed field as backup
        user_id_backup: userId,
      }
    }]);

    console.log(`✓ Stored conversation for user ${userId.substring(0, 8)}...`);
    return recordId;

  } catch (error) {
    console.error('❌ Store conversation error:', error);
    throw new Error(`Failed to store conversation: ${error.message}`);
  }
}

/**
 * Retrieve conversations with STRICT user isolation
 */
export async function retrieveConversations(userId, query, topK = 5) {
  try {
    // Validate userId
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid userId provided');
    }

    // Generate query embedding
    const queryEmbedding = await generateEmbedding(
      query || "recent conversation context"
    );
    
    // Query with STRICT user filter
    const results = await index.query({
      vector: queryEmbedding,
      topK: topK * 3, // Over-fetch to ensure we have enough after filtering
      includeMetadata: true,
      // CRITICAL: Only return this user's data
      filter: {
        userId: { $eq: userId },
        recordType: { $eq: 'conversation' }
      }
    });

    if (!results.matches || results.matches.length === 0) {
      console.log(`ℹ️  No conversations found for user ${userId.substring(0, 8)}...`);
      return [];
    }

    // Defense in depth: Double-check userId in results
    const userConversations = results.matches
      .filter(match => {
        // Ensure metadata exists and userId matches
        if (!match.metadata) return false;
        
        // Check both primary and backup userId fields
        const primaryMatch = match.metadata.userId === userId;
        const backupMatch = match.metadata.user_id_backup === userId;
        
        return primaryMatch || backupMatch;
      })
      .slice(0, topK) // Limit to requested amount
      .map(match => ({
        id: match.id,
        score: match.score,
        ...match.metadata
      }))
      // Sort by timestamp (most recent first)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    console.log(`✓ Retrieved ${userConversations.length} conversations for user ${userId.substring(0, 8)}...`);
    return userConversations;

  } catch (error) {
    console.error('❌ Retrieve conversations error:', error);
    // Return empty array instead of throwing to prevent app crashes
    return [];
  }
}

/**
 * Get recent conversations (chronological, not semantic)
 */
export async function getRecentConversations(userId, limit = 10) {
  try {
    // For recent conversations, we need to query with a dummy vector
    // and rely on metadata filtering
    const dummyEmbedding = await generateEmbedding("recent messages");
    
    const results = await index.query({
      vector: dummyEmbedding,
      topK: limit * 2,
      includeMetadata: true,
      filter: {
        userId: { $eq: userId }
      }
    });

    return results.matches
      .filter(match => match.metadata?.userId === userId)
      .sort((a, b) => {
        const timeA = new Date(a.metadata.timestamp).getTime();
        const timeB = new Date(b.metadata.timestamp).getTime();
        return timeB - timeA; // Most recent first
      })
      .slice(0, limit)
      .map(match => match.metadata);

  } catch (error) {
    console.error('Get recent conversations error:', error);
    return [];
  }
}

/**
 * Delete user's conversation history (for privacy/GDPR)
 */
export async function deleteUserConversations(userId) {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    // Pinecone doesn't support delete by metadata filter directly
    // We need to fetch all IDs first, then delete them
    const conversations = await getRecentConversations(userId, 1000);
    
    if (conversations.length === 0) {
      console.log(`No conversations to delete for user ${userId}`);
      return 0;
    }

    const idsToDelete = conversations
      .map(conv => conv.id)
      .filter(id => id && id.startsWith(userId));

    if (idsToDelete.length > 0) {
      await index.deleteMany(idsToDelete);
      console.log(`✓ Deleted ${idsToDelete.length} conversations for user ${userId}`);
    }

    return idsToDelete.length;

  } catch (error) {
    console.error('Delete user conversations error:', error);
    throw error;
  }
}

/**
 * Get user statistics (for debugging/monitoring)
 */
export async function getUserStats(userId) {
  try {
    const recent = await getRecentConversations(userId, 100);
    
    return {
      userId,
      totalMessages: recent.length,
      userMessages: recent.filter(m => m.role === 'user').length,
      assistantMessages: recent.filter(m => m.role === 'assistant').length,
      firstMessage: recent[recent.length - 1]?.timestamp,
      lastMessage: recent[0]?.timestamp,
    };
  } catch (error) {
    console.error('Get user stats error:', error);
    return null;
  }
}

/**
 * Initialize index with proper schema (run once)
 */
export async function initializePineconeIndex() {
  try {
    const indexList = await pinecone.listIndexes();
    const indexExists = indexList.indexes?.some(idx => idx.name === indexName);

    if (!indexExists) {
      await pinecone.createIndex({
        name: indexName,
        dimension: 384, // all-MiniLM-L6-v2 dimension
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1'
          }
        }
      });
      console.log(`✓ Created Pinecone index: ${indexName}`);
    } else {
      console.log(`✓ Pinecone index already exists: ${indexName}`);
    }
  } catch (error) {
    console.error('Initialize Pinecone error:', error);
    throw error;
  }
}

export { index };