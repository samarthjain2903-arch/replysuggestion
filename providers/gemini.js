// Handles talking to Google's Gemini API.
// Exports one function: getSuggestions({ image, promptText, contextText }) -> array of 3 strings

async function getSuggestions({ image, promptText, contextText }) {
  const apiKey = (process.env.GEMINI_API_KEY || '').replace(/\s+/g, '');
  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

  if (!apiKey) throw new Error('Missing GEMINI_API_KEY in .env');

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: contextText }]
        },
        contents: [{
          parts: [
            { text: promptText },
            { inline_data: { mime_type: 'image/png', data: image } }
          ]
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'ARRAY',
            items: { type: 'STRING' },
            minItems: 3,
            maxItems: 3
          }
        }
      })
    }
  );

  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(data?.error?.message || 'Gemini API error');
  }

  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error('No suggestions came back from Gemini');

  return JSON.parse(raw); // already a clean array thanks to responseSchema
}

module.exports = { getSuggestions };
