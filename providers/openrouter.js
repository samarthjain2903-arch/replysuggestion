async function getSuggestions({ images, promptText, contextText }) {
  const apiKey = (process.env.OPENROUTER_API_KEY || '').replace(/\s+/g, '');
  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o';

  if (!apiKey) throw new Error('Missing OPENROUTER_API_KEY in .env');

  const instructionWithFormat = `${promptText}\n\nRespond with ONLY a JSON object in this exact shape, nothing else: {"suggestions": ["line 1", "line 2", "line 3"]}`;

  const imageContentParts = images.map(img => ({
    type: 'image_url',
    image_url: { url: `data:${img.mimeType};base64,${img.data}` }
  }));

  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      max_tokens: 500,
      temperature: 1.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: contextText },
        {
          role: 'user',
          content: [
            { type: 'text', text: instructionWithFormat },
            ...imageContentParts
          ]
        }
      ]
    })
  });

  const data = await resp.json();

  if (!resp.ok) {
    const detail =
      data?.error?.metadata?.raw ||
      data?.error?.metadata?.reason ||
      data?.error?.message ||
      JSON.stringify(data?.error) ||
      'OpenRouter API error';
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }

  const raw = data?.choices?.[0]?.message?.content;
  if (!raw) throw new Error('No suggestions came back from OpenRouter');

  const parsed = JSON.parse(raw);
  return { suggestions: parsed.suggestions, model };
}

module.exports = { getSuggestions };