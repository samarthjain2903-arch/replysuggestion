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

// Which AI provider to use — set AI_PROVIDER=openrouter in .env to switch.
// Defaults to gemini.
const PROVIDER_NAME = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
const providers = { gemini: geminiProvider, openrouter: openrouterProvider };
const provider = providers[PROVIDER_NAME];

const PROMPT_PATH = path.join(__dirname, 'prompts', 'prompt.txt');
const CONTEXT_PATH = path.join(__dirname, 'prompts', 'context.txt');

app.post('/api/suggest', async (req, res) => {
  try {
    const { image } = req.body; // base64 string, no "data:image/png;base64," prefix
    if (!image) return res.status(400).json({ error: 'No image provided' });
    if (!provider) return res.status(500).json({ error: `Unknown AI_PROVIDER "${PROVIDER_NAME}"` });

    // Read fresh every request — so editing prompt.txt or context.txt
    // takes effect immediately, no server restart needed.
    const promptText = fs.readFileSync(PROMPT_PATH, 'utf8').trim();
    const contextText = fs.readFileSync(CONTEXT_PATH, 'utf8').trim();

    const suggestions = await provider.getSuggestions({ image, promptText, contextText });

    res.json({ suggestions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Something went wrong on the server' });
  }
});

app.use(express.static('public'));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT} (provider: ${PROVIDER_NAME})`));
