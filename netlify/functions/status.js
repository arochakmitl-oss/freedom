const { GEMINI_MODEL, json } = require("./_shared");

exports.handler = async () => json(200, {
  ok: true,
  model: GEMINI_MODEL,
  provider: "gemini",
  openaiConfigured: Boolean(process.env.GEMINI_API_KEY),
  geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  supabaseConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
});
