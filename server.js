require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const geminiProvider = require('./providers/gemini');
const openrouterProvider = require('./providers/openrouter');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // screenshots as base64 can be a few MB

const PORT = process.env.PORT || 3000;

const providers = { gemini: geminiProvider, openrouter: openrouterProvider };

// Order to try providers in. Set PROVIDER_PRIORITY in .env as a comma-separated
// list, e.g. "openrouter,gemini" — if the first one fails (credits, downtime,
// bad key, etc.) it automatically falls through to the next one.
// Falls back to just AI_PROVIDER (single provider, no fallback) if not set.
const priorityList = (process.env.PROVIDER_PRIORITY || process.env.AI_PROVIDER || 'gemini')
  .split(',')
  .map(p => p.trim().toLowerCase())
  .filter(p => providers[p]);

const PROMPT_PATH = path.join(__dirname, 'prompts', 'prompt.txt');
const CONTEXT_PATH = path.join(__dirname, 'prompts', 'context.txt');

app.post('/api/suggest', async (req, res) => {
  const { image } = req.body; // base64 string, no "data:image/png;base64," prefix
  if (!image) return res.status(400).json({ error: 'No image provided' });

  const promptText = fs.readFileSync(PROMPT_PATH, 'utf8').trim();
  const contextText = fs.readFileSync(CONTEXT_PATH, 'utf8').trim();

  const errors = [];

  for (const name of priorityList) {
    try {
      const suggestions = await providers[name].getSuggestions({ image, promptText, contextText });
      return res.json({ suggestions, usedProvider: name }); // success — stop here
    } catch (err) {
      console.error(`[${name}] failed:`, err.message);
      errors.push(`${name}: ${err.message}`);
      // continue to next provider in the list
    }
  }

  // every provider in the list failed
  res.status(500).json({ error: `All providers failed. ${errors.join(' | ')}` });
});

app.use(express.static('public'));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT} (priority: ${priorityList.join(' -> ')})`));