const config = require('../config/config');

let embedder = null;

async function loadModel() {
  if (!embedder) {
    console.log('Loading embedding model...');
    const { pipeline } = await import('@xenova/transformers');
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('Model loaded.');
  }
}

async function encodeText(text) {
  await loadModel();

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

  if (!Array.isArray(vec) || vec.length !== config.qdrant.vectorSize) {
    throw new Error(
      `Embedding dimension mismatch: expected ${config.qdrant.vectorSize}, got ${vec.length}`
    );
  }

  return vec;
}

module.exports = {
  loadModel,
  encodeText,
}; 