const { GEMINI_MODEL, getGeminiApiKey, json } = require("./_shared");

const hasGeminiKey = Boolean(getGeminiApiKey());

exports.handler = async () => json(200, {
  ok: true,
  model: GEMINI_MODEL,
  provider: "gemini",
  openaiConfigured: hasGeminiKey,
  geminiConfigured: hasGeminiKey,
  supabaseConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
});
