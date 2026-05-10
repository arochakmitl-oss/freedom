const http = require("node:http");
const fsSync = require("node:fs");
const fs = require("node:fs/promises");
const path = require("node:path");

loadEnvFile();

const PORT = Number(process.env.PORT || 4176);
const HOST = process.env.HOST || "127.0.0.1";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const SUPABASE_TABLE = process.env.SUPABASE_TABLE || "freedom_profiles";
const ROOT = __dirname;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
};

function loadEnvFile() {
  const envPath = path.join(__dirname, ".env");
  if (!fsSync.existsSync(envPath)) return;

  const lines = fsSync.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [rawKey, ...rawValue] = trimmed.split("=");
    const key = rawKey.trim();
    const value = rawValue.join("=").trim().replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

const ADVISER_INSTRUCTIONS = `
คุณคือ Freedom ผู้ช่วยการเงินส่วนตัวภาษาไทย
บุคลิก: ใจเย็น ฉลาด ไม่ตัดสินผู้ใช้ ชัดเจน สมจริง และให้กำลังใจ
ขอบเขต: ช่วยจัดความคิดเรื่องเงินสด รายจ่าย หนี้ ดอกเบี้ย เงินสำรอง การเริ่มลงทุน รายได้เสริม และก้าวถัดไป
วิธีตอบ:
- ตอบเป็นภาษาไทยเสมอ
- สั้น กระชับ และเป็นบทสนทนาธรรมชาติ
- หลีกเลี่ยงการยัดตัวเลข ตาราง หรือแดชบอร์ดเข้าไปในคำตอบ เว้นแต่ผู้ใช้ขอชัดเจน
- ให้หนึ่งก้าวถัดไปที่ทำได้จริง
- ไม่กล่าวโทษ ไม่ทำให้กลัว และไม่สัญญาผลลัพธ์ทางการเงินแน่นอน
- ถ้าผู้ใช้มีหนี้ ให้เริ่มจากการช่วยจัดลำดับแผนปลดหนี้ก่อน แล้วค่อยต่อยอดเรื่องเงินสำรองและลงทุน
- ถ้าเป็นสถานการณ์เสี่ยงสูง เช่น ค้างชำระรุนแรง ถูกฟ้อง หรือไม่มีเงินจ่ายค่าใช้จ่ายจำเป็น ให้แนะนำให้คุยกับผู้เชี่ยวชาญทางการเงิน/เจ้าหนี้/หน่วยงานช่วยเหลือที่เหมาะสม
`;

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

function normalizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((message) => message && typeof message.text === "string")
    .slice(-12)
    .map((message) => ({
      role: message.role === "ai" ? "assistant" : "user",
      content: message.text.slice(0, 1800),
    }));
}

function getOutputText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const message = data.output?.find((item) => item.type === "message");
  const text = message?.content?.find((item) => item.type === "output_text")?.text;
  return typeof text === "string" ? text.trim() : "";
}

async function handleChat(request, response) {
  if (!process.env.OPENAI_API_KEY) {
    sendJson(response, 500, {
      error: "ยังไม่ได้ตั้งค่า OPENAI_API_KEY บน backend",
    });
    return;
  }

  try {
    const body = JSON.parse(await readBody(request));
    const input = normalizeMessages(body.messages);

    if (!input.length) {
      sendJson(response, 400, { error: "ไม่มีข้อความสำหรับส่งให้ AI" });
      return;
    }

    const apiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        instructions: ADVISER_INSTRUCTIONS,
        input,
        temperature: 0.7,
        max_output_tokens: 420,
      }),
    });

    const data = await apiResponse.json();
    if (!apiResponse.ok) {
      sendJson(response, apiResponse.status, {
        error: data.error?.message || "OpenAI API ตอบกลับไม่สำเร็จ",
      });
      return;
    }

    const reply = getOutputText(data);
    sendJson(response, 200, {
      reply: reply || "ขอโทษครับ ตอนนี้ฉันยังสรุปคำตอบไม่ได้ ลองเล่าให้สั้นลงอีกนิดได้ไหม",
    });
  } catch (error) {
    sendJson(response, 500, {
      error: "backend คุยกับ OpenAI ไม่สำเร็จ",
      detail: error.message,
    });
  }
}

async function serveStatic(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const safePath = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(ROOT, safePath);

  if (!filePath.startsWith(ROOT)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const file = await fs.readFile(filePath);
    response.writeHead(200, {
      "Content-Type": MIME_TYPES[path.extname(filePath)] || "application/octet-stream",
    });
    response.end(file);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}

const server = http.createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/api/config") {
    sendJson(response, 200, {
      supabaseConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
      supabaseUrl: process.env.SUPABASE_URL || "",
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
      supabaseTable: SUPABASE_TABLE,
    });
    return;
  }

  if (request.method === "GET" && request.url === "/api/status") {
    sendJson(response, 200, {
      ok: true,
      model: OPENAI_MODEL,
      openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
      supabaseConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
    });
    return;
  }

  if (request.method === "POST" && request.url === "/api/chat") {
    await handleChat(request, response);
    return;
  }

  if (request.method === "GET" || request.method === "HEAD") {
    await serveStatic(request, response);
    return;
  }

  response.writeHead(405);
  response.end("Method not allowed");
});

server.listen(PORT, HOST, () => {
  console.log(`Freedom backend running at http://${HOST}:${PORT}`);
});
