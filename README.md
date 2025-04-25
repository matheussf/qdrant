## 🧠 Qdrant Cloud Document Indexer

This Node.js project demonstrates how to embed and index documents into **Qdrant Cloud** using local embeddings and the [Qdrant REST client](https://www.npmjs.com/package/@qdrant/js-client-rest). Ideal for building AI-powered search, recommendation systems, or RAG pipelines.

---

### 📦 Tech Stack

- **Node.js**
- **Qdrant Cloud**
- **@xenova/transformers** – Local embedding pipeline
- **dotenv** – For environment variable management

---

### 🚀 Getting Started

#### 1. Clone and install dependencies

```bash
git clone https://github.com/matheussf/qdrant.git
cd qdrant
npm install
```

#### 2. Set up environment variables

Create a `.env` file in the root of the `qdrant/` directory:

```
QDRANT_URL=https://your-cluster-name.cloud.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key
```

> 🔐 You can find both in your [Qdrant Cloud dashboard](https://cloud.qdrant.io/).

---

### 📂 Project Structure

```
qdrant/
├── index.js            # Main script: loads model, embeds & indexes docs
├── documents.json      # List of example documents
├── .env                # Your Qdrant credentials
├── package.json        # Project metadata and dependencies
└── README.md           # You're here!
```

---

### 📄 Sample Document Format

The `documents.json` file should look like:

```json
[
  {
    "id": "doc1",
    "title": "First Document",
    "text": "This is the content of the first document about AI."
  }
]
```

---

### ⚙️ Running the Indexer

```bash
node index.js
```

This will:

1. Load the local embedding model (`all-MiniLM-L6-v2`)
2. Embed all documents
3. Push them to your Qdrant Cloud collection

---

### 📌 Notes

- The embedding model runs locally via [@xenova/transformers](https://www.npmjs.com/package/@xenova/transformers), no Python needed.
- Be sure your `QDRANT_API_KEY` has write access to the collection.

---