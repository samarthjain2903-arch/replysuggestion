require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const geminiProvider = require('./providers/gemini');
const openrouterProvider = require('./providers/openrouter');

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

const PORT = process.env.PORT || 3000;

const providers = { gemini: geminiProvider, openrouter: openrouterProvider };

const priorityList = (process.env.PROVIDER_PRIORITY || process.env.AI_PROVIDER || 'gemini')
  .split(',')
  .map(p => p.trim().toLowerCase())
  .filter(p => providers[p]);

const PROMPT_PATH = path.join(__dirname, 'prompts', 'prompt.txt');
const CONTEXT_PATH = path.join(__dirname, 'prompts', 'context.txt');

app.post('/api/suggest', async (req, res) => {
  let images = req.body.images;
  if (!images && req.body.image) images = [req.body.image];
  if (!images || !images.length) return res.status(400).json({ error: 'No image(s) provided' });

  const promptText = fs.readFileSync(PROMPT_PATH, 'utf8').trim();
  const contextText = fs.readFileSync(CONTEXT_PATH, 'utf8').trim();

  const errors = [];

  for (const name of priorityList) {
    try {
      const { suggestions, model } = await providers[name].getSuggestions({ images, promptText, contextText });
      return res.json({
        suggestions,
        usedProvider: name,
        usedModel: model,
        // if earlier providers in the list failed before this one succeeded,
        // show why — so failures aren't silently hidden by a working fallback
        fallbackNote: errors.length ? errors.join(' | ') : null
      });
    } catch (err) {
      console.error(`[${name}] failed:`, err.message);
      errors.push(`${name}: ${err.message}`);
    }
  }

  res.status(500).json({ error: `All providers failed. ${errors.join(' | ')}` });
});

app.use(express.static('public'));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT} (priority: ${priorityList.join(' -> ')})`));