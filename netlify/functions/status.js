const { OPENAI_MODEL, json } = require("./_shared");

exports.handler = async () => json(200, {
  ok: true,
  model: OPENAI_MODEL,
  openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
  supabaseConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
});
