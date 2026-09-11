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
  // Each image is now { data: base64string, mimeType: 'image/jpeg' | 'image/png' | ... }
  let images = req.body.images;

  // backward compatibility: old plain-string format, assume png
  if (images && typeof images[0] === 'string') {
    images = images.map(data => ({ data, mimeType: 'image/png' }));
  }
  if (!images && req.body.image) images = [{ data: req.body.image, mimeType: 'image/png' }];

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