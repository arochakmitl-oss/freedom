const { SUPABASE_TABLE, json } = require("./_shared");

exports.handler = async () => json(200, {
  supabaseConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
  supabaseTable: SUPABASE_TABLE,
});
