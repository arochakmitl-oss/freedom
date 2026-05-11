const crypto = require("node:crypto");

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_MAX_OUTPUT_TOKENS = Number(process.env.GEMINI_MAX_OUTPUT_TOKENS || 2048);
const GEMINI_THINKING_BUDGET = Number(process.env.GEMINI_THINKING_BUDGET || 0);
const SUPABASE_TABLE = process.env.SUPABASE_TABLE || "freedom_profiles";

const ADVISER_INSTRUCTIONS = `
คุณคือ Freedom ผู้ช่วยการเงินส่วนตัวภาษาไทย
บุคลิก: ใจเย็น ฉลาด ไม่ตัดสินผู้ใช้ ชัดเจน สมจริง และให้กำลังใจ
ขอบเขต: ช่วยจัดความคิดเรื่องเงินสด รายจ่าย หนี้ ดอกเบี้ย เงินสำรอง การเริ่มลงทุน รายได้เสริม และก้าวถัดไป
วิธีตอบ:
- ตอบเป็นภาษาไทยเสมอ
- สั้น กระชับ และเป็นบทสนทนาธรรมชาติ
- หลีกเลี่ยงการยัดตัวเลข ตาราง หรือแดชบอร์ดเข้าไปในคำตอบ เว้นแต่ผู้ใช้ขอชัดเจน
- ให้หนึ่งก้าวถัดไปที่ทำได้จริง
- ตอบให้จบความทุกครั้ง อย่าจบกลางประโยคหรือกลางรายการ ถ้าคำตอบยาวให้สรุปเป็น 3-5 ข้อแทน
- ไม่กล่าวโทษ ไม่ทำให้กลัว และไม่สัญญาผลลัพธ์ทางการเงินแน่นอน
- ถ้าผู้ใช้มีหนี้ ให้เริ่มจากการช่วยจัดลำดับแผนปลดหนี้ก่อน แล้วค่อยต่อยอดเรื่องเงินสำรองและลงทุน
- ถ้าเป็นสถานการณ์เสี่ยงสูง เช่น ค้างชำระรุนแรง ถูกฟ้อง หรือไม่มีเงินจ่ายค่าใช้จ่ายจำเป็น ให้แนะนำให้คุยกับผู้เชี่ยวชาญทางการเงิน/เจ้าหนี้/หน่วยงานช่วยเหลือที่เหมาะสม
`;

function json(statusCode, payload) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(payload),
  };
}

function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY
    || process.env.GOOGLE_API_KEY
    || process.env.GOOGLE_GENERATIVE_AI_API_KEY
    || "";
}

function normalizeUsername(username) {
  return String(username || "").trim().replace(/\s+/g, "_").slice(0, 24);
}

function normalizeProfileForStorage(profile) {
  const safeProfile = profile && typeof profile === "object" ? profile : {};
  return {
    ...safeProfile,
    known: Boolean(safeProfile.known),
    onboarding: safeProfile.onboarding && typeof safeProfile.onboarding === "object" ? safeProfile.onboarding : {},
    debts: Array.isArray(safeProfile.debts) ? safeProfile.debts : [],
    checkpoints: safeProfile.checkpoints && typeof safeProfile.checkpoints === "object" ? safeProfile.checkpoints : {},
  };
}

function publicProfile(profile) {
  const nextProfile = normalizeProfileForStorage(profile);
  delete nextProfile.pin;
  delete nextProfile.auth;
  return nextProfile;
}

function createPinAuth(pin) {
  const salt = crypto.randomBytes(16).toString("hex");
  const pinHash = crypto.scryptSync(String(pin), salt, 32).toString("hex");
  return { salt, pinHash };
}

function verifyPin(profile, pin) {
  if (profile?.auth?.salt && profile?.auth?.pinHash) {
    const expected = Buffer.from(profile.auth.pinHash, "hex");
    const actual = crypto.scryptSync(String(pin), profile.auth.salt, expected.length);
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  }
  return Boolean(profile?.pin && String(profile.pin) === String(pin));
}

function isSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

function supabaseHeaders(extra = {}) {
  return {
    apikey: process.env.SUPABASE_ANON_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function getStoredProfile(username) {
  if (!isSupabaseConfigured()) {
    const error = new Error("ยังไม่ได้ตั้งค่า Supabase สำหรับ backend auth");
    error.statusCode = 503;
    throw error;
  }

  const url = `${process.env.SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?username=eq.${encodeURIComponent(username)}&select=username,profile&limit=1`;
  const response = await fetch(url, {
    headers: supabaseHeaders({ Accept: "application/json" }),
  });
  if (!response.ok) throw new Error(`Supabase profile lookup failed (${response.status})`);
  const rows = await response.json();
  return rows?.[0]?.profile ? normalizeProfileForStorage(rows[0].profile) : null;
}

async function upsertStoredProfile(username, profile) {
  if (!isSupabaseConfigured()) {
    const error = new Error("ยังไม่ได้ตั้งค่า Supabase สำหรับ backend auth");
    error.statusCode = 503;
    throw error;
  }

  const url = `${process.env.SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?on_conflict=username`;
  const response = await fetch(url, {
    method: "POST",
    headers: supabaseHeaders({ Prefer: "resolution=merge-duplicates" }),
    body: JSON.stringify({
      username,
      profile: normalizeProfileForStorage(profile),
      updated_at: new Date().toISOString(),
    }),
  });
  if (!response.ok) throw new Error(`Supabase profile upsert failed (${response.status})`);
  return normalizeProfileForStorage(profile);
}

function normalizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((message) => message && typeof message.text === "string")
    .slice(-12)
    .map((message) => ({
      role: message.role === "ai" ? "model" : "user",
      content: message.text.slice(0, 1800),
    }));
}

function toGeminiContents(messages) {
  return messages.map((message) => ({
    role: message.role,
    parts: [{ text: message.content }],
  }));
}

function getGeminiOutputText(data) {
  const parts = data.candidates?.[0]?.content?.parts || [];
  return parts
    .map((part) => part.text || "")
    .join("")
    .trim();
}

module.exports = {
  ADVISER_INSTRUCTIONS,
  GEMINI_MAX_OUTPUT_TOKENS,
  GEMINI_MODEL,
  GEMINI_THINKING_BUDGET,
  SUPABASE_TABLE,
  getGeminiOutputText,
  getGeminiApiKey,
  createPinAuth,
  getStoredProfile,
  isSupabaseConfigured,
  json,
  normalizeMessages,
  normalizeProfileForStorage,
  normalizeUsername,
  publicProfile,
  toGeminiContents,
  upsertStoredProfile,
  verifyPin,
};
