# Reply Suggest

Upload a dating profile screenshot, get 3 opening lines back, each with its own Copy button.

## What's in here

```
server.js              <- backend: routes requests to whichever AI provider you pick
providers/
  gemini.js             <- talks to Google Gemini
  openrouter.js          <- talks to OpenRouter (access to many other models)
prompts/
  prompt.txt             <- EDIT THIS to change the actual instruction
  context.txt             <- EDIT THIS to add standing style rules & examples
package.json
.env.example             <- copy this to .env and fill in your real keys
public/                   <- the web page itself
README.md
```

## Run it locally

1. Install [Node.js](https://nodejs.org) if you don't have it (v18+).
2. In this folder:
   ```
   npm install
   ```
3. Copy `.env.example` to `.env`, and fill in your real key(s).
4. Start it:
   ```
   npm start
   ```
5. Open `http://localhost:3000`.

## Editing the prompt (no code needed)

Open **`prompts/prompt.txt`** — this is the actual instruction sent with every request. Just edit the text and save. The server re-reads this file on every single request, so changes take effect immediately, even while the server is running.

## Teaching it your style (`context.txt`)

Open **`prompts/context.txt`**. This is sent alongside the prompt on every request as standing background — rules, tone guidance, and (most effective) real examples of good replies.

This is **not** the same as fine-tuning a model — it doesn't change the model itself, it just gives it consistent context every time, which works very well for a task like this. The file has a template already — the more real "profile detail → good reply" examples you add as you find ones that land well, the better your results get over time. This is the file to keep improving as you use the app.

If you ever do want true fine-tuning later (actually training a custom model on hundreds of examples), that's a bigger, separate project — worth considering only once you have a large set of proven-good examples and want to bake the style in permanently. Not needed at this stage.

## Switching between Gemini and OpenRouter

In your `.env` file:
```
AI_PROVIDER=gemini
```
or
```
AI_PROVIDER=openrouter
```

**Gemini** — needs `GEMINI_API_KEY` (free tier at https://aistudio.google.com/apikey)

**OpenRouter** — needs `OPENROUTER_API_KEY` (from https://openrouter.ai/keys). This gives you access to many different vision-capable models (GPT-4o, Claude, Gemini, Llama, etc.) through one account, which is handy for testing which model gives the best dating-reply suggestions. Pick the model with:
```
OPENROUTER_MODEL=openai/gpt-4o
```
(or any other vision-capable model slug from https://openrouter.ai/models — look for "image" in the model's supported input types)

No code changes needed to switch — both providers read the same `prompt.txt` and `context.txt` files, so your prompt engineering carries over regardless of which one you're testing.

## Look and feel

Colors and fonts are in `public/style.css`, defined as CSS variables at the top.

## Putting this online (real HTTPS link for friends)

1. Push this folder to a GitHub repo (don't commit your real `.env` — only `.env.example`).
2. Sign up free at [render.com](https://render.com), sign in with GitHub.
3. New → Web Service → connect your repo.
4. Build Command: `npm install`, Start Command: `npm start`.
5. Under Environment Variables, add whichever keys/settings from `.env.example` you're actually using.
6. Create Web Service — you'll get a live `https://...onrender.com` link.

## A cost note

Since your key is shared across everyone using the app, usage (and any cost) adds up on your account regardless of which provider you use. Keep an eye on usage if the group grows.
