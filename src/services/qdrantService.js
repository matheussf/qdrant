const { QdrantClient } = require('@qdrant/js-client-rest');
const config = require('../config/config');
const { encodeText } = require('./embedder');

const client = new QdrantClient({
  url: config.qdrant.url,
  apiKey: config.qdrant.apiKey,
});

async function initCollection() {
  console.log(`Initializing Qdrant collection "${config.qdrant.collectionName}"…`);
  await client.recreateCollection(config.qdrant.collectionName, {
    vectors: { size: config.qdrant.vectorSize, distance: config.qdrant.distance },
  });
  console.log(
    `Collection "${config.qdrant.collectionName}" ready (size=${config.qdrant.vectorSize}, distance=${config.qdrant.distance}).`
  );
}

async function indexDocuments(docs) {
  console.log(`Indexing ${docs.length} documents…`);
  const points = [];
  for (const doc of docs) {
    const vector = await encodeText(doc.text);
    points.push({ id: doc.id, vector, payload: { title: doc.title, text: doc.text } });
  }
  await client.upsert(config.qdrant.collectionName, { points });
  console.log('Documents uploaded.');
}

/**
 * Search documents with optional pagination offset.
 * @param {number[]} queryVec - Embedding vector for the search query
 * @param {number} [offset=0] - Number of results to skip
 * @returns {Promise<Array<{id: string, score: number, title: string, snippet: string}>>}
 */
async function searchDocuments(queryVec, offset = 0) {
  const hits = await client.search(config.qdrant.collectionName, {
    vector: queryVec,
    limit: config.qdrant.searchLimit,
    offset,
    with_payload: true,
  });
  return hits.map((p) => ({
    id: p.id,
    score: p.score,
    title: p.payload.title,
    snippet: p.payload.text.slice(0, 100) + '…',
  }));
}

module.exports = {
  initCollection,
  indexDocuments,
  searchDocuments,
}; 