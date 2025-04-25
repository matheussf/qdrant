require('dotenv').config();
const path              = require('path');
const fs                = require('fs');
const express           = require('express');
const { QdrantClient }  = require('@qdrant/js-client-rest');

const COLLECTION_NAME = 'documents';
const qdrantClient = new QdrantClient({
  url:    process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

const documents = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'documents.json'), 'utf8')
);

let embedder;
async function loadModel() {
  console.log('Loading embedding model...');
  const { pipeline } = await import('@xenova/transformers');
  embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  console.log('Model loaded.');
}

async function encodeText(text) {
  if (!embedder) await loadModel();

  const out = await embedder(text, { pooling: 'mean', normalize: true });

  let vec;
  if (out.data && Array.isArray(out.data) && Array.isArray(out.data[0])) {
    vec = out.data[0];
  } else if (Array.isArray(out) && Array.isArray(out[0])) {
    vec = out[0];
  } else if (ArrayBuffer.isView(out)) {
    vec = Array.from(out);
  } else if (out.data && ArrayBuffer.isView(out.data)) {
    vec = Array.from(out.data);
  } else {
    throw new Error(`Unexpected embedding output shape: ${JSON.stringify(out).slice(0,200)}`);
  }

  if (!Array.isArray(vec) || vec.length !== 384) {
    throw new Error(`Embedding dimension mismatch: expected 384, got ${vec.length}`);
  }

  return vec;
}

async function initCollection() {
  const vectorSize = 384, distance = 'Dot';
  console.log(`Initializing Qdrant collection "${COLLECTION_NAME}"…`);
  await qdrantClient.recreateCollection(COLLECTION_NAME, {
    vectors: { size: vectorSize, distance }
  });
  console.log(`Collection "${COLLECTION_NAME}" ready (size=${vectorSize}, distance=${distance}).`);
}

async function indexDocuments(docs) {
  console.log(`Indexing ${docs.length} documents…`);
  const points = [];

  for (const doc of docs) {
    const vector = await encodeText(doc.text);
    points.push({
      id:      doc.id,
      vector,
      payload: {
        title: doc.title,
        text:  doc.text
      }
    });
  }

  await qdrantClient.upsert(COLLECTION_NAME, { points });
  console.log('Documents uploaded.');
}

const app = express();
app.use(express.json());

app.get('/search', async (req, res) => {
  try {
    const query = req.query.q || req.body.query;
    if (!query) return res.status(400).json({ error: 'No query provided' });

    console.log('Search for:', query);
    const qVec = await encodeText(query);
    const hits = await qdrantClient.search(COLLECTION_NAME, {
      vector:       qVec,
      limit:        5,
      with_payload: true,
    });

    const results = hits.map(p => ({
      id:      p.id,
      score:   p.score,
      title:   p.payload.title,
      snippet: p.payload.text.slice(0, 100) + '…'
    }));

    res.json(results);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('*splat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
  initCollection()
    .then(() => indexDocuments(documents))
    .catch(e => console.error('Qdrant setup failed:', e));
});
