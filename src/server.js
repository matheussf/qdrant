#!/usr/bin/env node

const express = require('express');
const config = require('./config/config');
const { encodeText } = require('./services/embedder');
const { searchDocuments } = require('./services/qdrantService');
const path = require('path');

const app = express();
app.use(express.static(path.resolve(__dirname, '../public')));

app.get('/search', async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) {
      return res.status(400).json({ error: 'Missing "q" query parameter' });
    }
    const vector = await encodeText(q);
    const hits = await searchDocuments(vector);
    res.json(hits);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: err.message });
  }
});

const port = config.port;
app.listen(port, () => {
  console.log(`Search API server running on port ${port}`);
}); 