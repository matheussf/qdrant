const dotenv = require('dotenv');
dotenv.config();

// Validate required environment variables
if (!process.env.QDRANT_URL) {
  throw new Error('QDRANT_URL environment variable is required');
}

if (!process.env.QDRANT_API_KEY) {
  throw new Error('QDRANT_API_KEY environment variable is required');
}

const config = {
  port: process.env.PORT || 3005,
  qdrant: {
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
    collectionName: process.env.QDRANT_COLLECTION || 'documents',
    vectorSize: parseInt(process.env.QDRANT_VECTOR_SIZE, 10) || 384,
    distance: process.env.QDRANT_DISTANCE || 'Dot',
    searchLimit: parseInt(process.env.SEARCH_LIMIT, 10) || 5,
  },
};

module.exports = config; 