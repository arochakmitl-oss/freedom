const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_MAX_OUTPUT_TOKENS = Number(process.env.GEMINI_MAX_OUTPUT_TOKENS || 1024);
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
  SUPABASE_TABLE,
  getGeminiOutputText,
  getGeminiApiKey,
  json,
  normalizeMessages,
  toGeminiContents,
};
