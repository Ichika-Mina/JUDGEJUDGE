import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

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
Your role is to arbitrate card interactions and rules questions with absolute precision, grounded strictly in the official Magic: The Gathering Comprehensive Rules (CR).

When answering:
1. DIRECT RULING: State the immediate, definitive outcome in 1-2 clear sentences (e.g., "Urza's Saga is put into the graveyard as a state-based action immediately after Blood Moon resolves.").
2. STEP-BY-STEP RULES BREAKDOWN: Explain exactly how the interaction unfolds chronologically. Detail priority passes, zone changes, triggered abilities (Rule 603), replacement effects (Rule 614), or state-based actions (Rule 704).
3. CONTINUOUS EFFECTS & LAYERS (if applicable):
   - Always break down Layer 1 through Layer 7 (Layer 1 Copy, Layer 2 Control, Layer 3 Text, Layer 4 Type, Layer 5 Color, Layer 6 Ability, Layer 7a-7e P/T).
   - Address dependencies (CR 613.8) and timestamps clearly.
4. CITATIONS: Always cite specific Comprehensive Rules numbers (e.g. "CR 613.1d", "CR 704.5s", "CR 614.12", "CR 117.3b").
5. TOURNAMENT JUDGE TIP: Provide practical guidance on how a judge explains this ruling clearly at the table during a timed tournament round.

Format your response cleanly with clear markdown headings, bold card names, and blockquotes for critical rule citations.`;

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
