#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { initCollection, indexDocuments } = require('./src/services/qdrantService');

async function main() {
  try {
    console.log('Starting Qdrant indexing...');

    const docsPath = path.resolve(__dirname, 'documents.json');
    const raw = fs.readFileSync(docsPath, 'utf-8');
    const docs = JSON.parse(raw);
    if (!Array.isArray(docs)) {
      throw new Error('documents.json should export an array of documents');
    }

    await initCollection();

    await indexDocuments(docs);

    console.log('Indexing complete.');
    process.exit(0);
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

main(); 