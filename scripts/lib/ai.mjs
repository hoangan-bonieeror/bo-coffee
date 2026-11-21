// Optional: ask Google Gemini to write short bilingual summaries for the selected items.
// Enabled only when GEMINI_API_KEY is set; otherwise the bot uses original descriptions.
//
// Get a free key at https://aistudio.google.com/apikey
// GEMINI_MODEL defaults to the "gemini-flash-latest" alias (always the newest Flash model);
// pin a specific model id (e.g. from https://ai.google.dev/gemini-api/docs/models) for stable output.

const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
/** Tried in order when the main model is overloaded (503) or unavailable. Comma-separated. */
const FALLBACK_MODELS = (process.env.GEMINI_FALLBACK_MODELS ?? 'gemini-flash-lite-latest')
  .split(',')
  .map((m) => m.trim())
  .filter((m) => m && m !== MODEL);
const RETRY_DELAYS_MS = [5000, 15000]; // per model, for 429/500/503
/** Thinking level for Gemini 3.x models (minimal | low | medium | high); empty = model default. */
const THINKING_LEVEL = (process.env.GEMINI_THINKING_LEVEL ?? 'low').trim().toUpperCase();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Outcome of the last Gemini run, printed in the bot log for troubleshooting. */
export const aiStatus = { enabled: false, ok: false, model: MODEL, summarized: 0, error: null };

/**
 * Call Gemini with structured JSON output, retrying transient errors and falling back to other
 * models when the main one is overloaded. Records the model used in aiStatus.model.
 * Used by the weekly coffee-news bot.
 * @returns {Promise<any>} the parsed JSON object (throws on failure)
 */
export async function geminiJSON(
  prompt,
  schema,
  { maxOutputTokens = 16384, temperature = 0.4, timeoutMs = 180000 } = {},
) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not set');
  const generationConfig = {
    temperature,
    maxOutputTokens,
    responseMimeType: 'application/json',
    responseSchema: schema,
  };
  // Summaries don't need deep reasoning; low thinking keeps calls fast. Models that don't
  // support thinking levels answer 400, and we retry once without it.
  if (THINKING_LEVEL) generationConfig.thinkingConfig = { thinkingLevel: THINKING_LEVEL };
  const bodyFor = (withThinking) => {
    const cfg = { ...generationConfig };
    if (!withThinking) delete cfg.thinkingConfig;
    return JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: cfg,
    });
  };

  /** Call one model, retrying transient errors (overloaded / rate-limited / 5xx). */
  async function call(model) {
    let withThinking = !!generationConfig.thinkingConfig;
    for (let attempt = 0; ; attempt++) {
      let res;
      try {
        res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
            body: bodyFor(withThinking),
            signal: AbortSignal.timeout(timeoutMs),
          },
        );
      } catch (e) {
        // A timeout usually means the model is slow right now: move on to the next model
        // instead of waiting again on the same one.
        const err = new Error(
          `Gemini ${model}: ${e.name === 'TimeoutError' ? `no answer within ${timeoutMs / 1000}s` : e.message}`,
        );
        err.fallback = true;
        throw err;
      }
      if (res.ok) return res;
      const detail = (await res.text()).replace(/\s+/g, ' ').slice(0, 240);
      if (res.status === 400 && withThinking && /thinking/i.test(detail)) {
        console.warn(`⚠ Gemini ${model} does not accept thinkingLevel, retrying without it`);
        withThinking = false;
        continue;
      }
      const transient = [429, 500, 502, 503, 504].includes(res.status);
      if (transient && attempt < RETRY_DELAYS_MS.length) {
        console.warn(
          `⚠ Gemini ${model} ${res.status}, retrying in ${RETRY_DELAYS_MS[attempt] / 1000}s…`,
        );
        await sleep(RETRY_DELAYS_MS[attempt]);
        continue;
      }
      const err = new Error(`Gemini API ${res.status} (${model}): ${detail}`);
      err.fallback = transient || res.status === 404; // overloaded or model not found → try another model
      throw err;
    }
  }

  let res;
  let lastError;
  for (const model of [MODEL, ...FALLBACK_MODELS]) {
    try {
      res = await call(model);
      aiStatus.model = model;
      break;
    } catch (e) {
      lastError = e;
      if (!e.fallback) break; // e.g. invalid key: other models won't help
      console.warn(`⚠ ${e.message} — trying next model`);
    }
  }
  if (!res) throw lastError;

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  if (!text)
    throw new Error(
      `Empty response (finishReason: ${data.candidates?.[0]?.finishReason ?? 'unknown'})`,
    );
  return JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
}

/**
 * @param {Array<{key:string,title:string,description:string,source:string,category:string}>} items
 * @returns {Promise<null | { intro: {vi:string,en:string}, items: Record<string,{vi:string,en:string}> }>}
 */
