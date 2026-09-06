// Handles talking to OpenRouter (openrouter.ai) — gives you access to many
// different vision-capable models (GPT-4o, Claude, Gemini, Llama, etc.)
// through one API key, useful for testing which model gives the best replies.
// Exports one function: getSuggestions({ image, promptText, contextText }) -> array of 3 strings

async function getSuggestions({ image, promptText, contextText }) {
  // .replace strips any stray whitespace-like characters (including invisible
  // ones like narrow no-break spaces that sometimes tag along when copy-pasting
  // a key from a website) that would otherwise break the request header.
  const apiKey = (process.env.OPENROUTER_API_KEY || '').replace(/\s+/g, '');
  // Pick any vision-capable model from https://openrouter.ai/models
  // Examples: "openai/gpt-4o", "google/gemini-2.5-flash", "anthropic/claude-3.5-sonnet"
  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o';

  if (!apiKey) throw new Error('Missing OPENROUTER_API_KEY in .env');

  const instructionWithFormat = `${promptText}\n\nRespond with ONLY a JSON object in this exact shape, nothing else: {"suggestions": ["line 1", "line 2", "line 3"]}`;

  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: contextText },
        {
          role: 'user',
          content: [
            { type: 'text', text: instructionWithFormat },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${image}` } }
          ]
        }
      ]
    })
  });

  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(data?.error?.message || 'OpenRouter API error');
  }

  const raw = data?.choices?.[0]?.message?.content;
  if (!raw) throw new Error('No suggestions came back from OpenRouter');

  const parsed = JSON.parse(raw);
  return parsed.suggestions;
}

module.exports = { getSuggestions };
