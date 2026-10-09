import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI server-side with required User-Agent header
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const JUDGE_SYSTEM_PROMPT = `You are Judge Gemma, a certified Level 3 Magic: The Gathering Judge and premier rules scholar.
Your role is to arbitrate card interactions and rules questions with absolute precision and clarity, grounded in the MTG Comprehensive Rules (CR).

Keep your response clean, concise, and structured so it is not crowded or overwhelming.

Format strictly as follows:
**Direct Ruling:**
State the immediate, decisive ruling in 1-2 clear, direct sentences.

**Step-by-Step Rules Breakdown:**
1. State the first event chronologically, citing exact rule numbers inline (e.g. CR 613.1d, CR 117.3b).
2. State what layer applies or how priority/triggers/SBAs resolve (e.g. CR 704.5s, CR 603.3).
3. State the final board state clearly.

**Tournament Table Guidance:**
1 brief sentence advising players how to manage this at the table.

IMPORTANT: Keep explanations compact and punchy. Cite exact rule numbers (like CR 613.1d, CR 704.5s, CR 101.4c) directly inline so the interactive UI can enable hoverable tooltips.`;

// API: Judge interaction resolution
app.post('/api/judge', async (req, res) => {
  try {
    const { question, cardNames = [], history = [] } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question is required' });
    }

    if (!aiClient) {
      return res.status(503).json({
        error: 'Gemini API key is not configured on the server. Using local offline rule engine.',
        useFallback: true,
      });
    }

    // Build context
    let promptText = question;
    if (cardNames && cardNames.length > 0) {
      promptText = `[Involved Cards: ${cardNames.join(', ')}]\n\nQuestion: ${question}`;
    }

    // Incorporate recent history if present
    const contents: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const turn of history.slice(-4)) {
        if (turn.role && turn.text) {
          contents.push({
            role: turn.role === 'judge' || turn.role === 'model' ? 'model' : 'user',
            parts: [{ text: turn.text }],
          });
        }
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: promptText }],
    });

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: JUDGE_SYSTEM_PROMPT,
        temperature: 0.2, // Low temperature for high factual accuracy in rules
      },
    });

    const answer = response.text || 'No response generated from rules model.';
    return res.json({
      answer,
      model: 'gemini-3.8-flash (Judge Gemma)',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error generating judge response:', err);
    return res.status(500).json({
      error: err.message || 'Internal server error while resolving ruling',
      useFallback: true,
    });
  }
});

// API: Health & Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!apiKey,
    service: 'Judge Gemma MTG Rules Arbiter',
  });
});

// Proxy for Scryfall search if client requests it
app.get('/api/scryfall/search', async (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }
    const scryfallRes = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}`);
    if (!scryfallRes.ok) {
      return res.status(scryfallRes.status).json({ error: 'Scryfall search failed' });
    }
    const data = await scryfallRes.json();
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Proxy error' });
  }
});

// Setup Vite in Dev or Static files in Production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Judge Gemma Server running on http://0.0.0.0:${PORT} (dev=${isDev})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
