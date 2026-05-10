const http = require("node:http");
const fsSync = require("node:fs");
const fs = require("node:fs/promises");
const path = require("node:path");

loadEnvFile();

const PORT = Number(process.env.PORT || 4176);
const HOST = process.env.HOST || "127.0.0.1";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_MAX_OUTPUT_TOKENS = Number(process.env.GEMINI_MAX_OUTPUT_TOKENS || 1024);
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

function writeEnvValue(key, value) {
  const envPath = path.join(__dirname, ".env");
  const lines = fsSync.existsSync(envPath)
    ? fsSync.readFileSync(envPath, "utf8").split(/\r?\n/)
    : [];
  let found = false;
  const nextLines = lines.map((line) => {
    if (!line.trim().startsWith(`${key}=`)) return line;
    found = true;
    return `${key}=${value}`;
  });
  if (!found) nextLines.push(`${key}=${value}`);
  fsSync.writeFileSync(envPath, `${nextLines.filter(Boolean).join("\n")}\n`);
  process.env[key] = value;
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
- ตอบให้จบความทุกครั้ง อย่าจบกลางประโยคหรือกลางรายการ ถ้าคำตอบยาวให้สรุปเป็น 3-5 ข้อแทน
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

function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY
    || process.env.GOOGLE_API_KEY
    || process.env.GOOGLE_GENERATIVE_AI_API_KEY
    || "";
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

function sendGeminiSetupPage(response, message = "") {
  response.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(`<!doctype html>
<html lang="th">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>ตั้งค่า Gemini</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #030512; color: #f5f8ff; font-family: system-ui, sans-serif; }
      form { width: min(560px, calc(100% - 32px)); display: grid; gap: 14px; padding: 22px; border: 1px solid rgba(255,255,255,.18); border-radius: 14px; background: rgba(255,255,255,.08); }
      input, button { min-height: 46px; border-radius: 999px; font: inherit; }
      input { border: 1px solid rgba(255,255,255,.18); padding: 0 16px; background: rgba(0,0,0,.3); color: white; }
      button { border: 0; background: linear-gradient(135deg, #50f0ad, #49e8ff); color: #041018; font-weight: 700; }
      p { color: #a8b3cd; line-height: 1.5; }
      .ok { color: #50f0ad; }
    </style>
  </head>
  <body>
    <form method="post" action="/api/setup/gemini">
      <h1>ตั้งค่า Gemini API Key</h1>
      <p>วาง key ในช่องนี้ ระบบจะบันทึกลงไฟล์ .env ในเครื่องนี้เท่านั้น และไม่แสดง key กลับมาในหน้าเว็บ</p>
      ${message ? `<p class="ok">${message}</p>` : ""}
      <input name="geminiApiKey" type="password" autocomplete="off" placeholder="AIza..." required />
      <button type="submit">บันทึกและเปิดใช้งาน</button>
      <p><a href="/" style="color:#49e8ff">กลับไปที่แอป Freedom</a></p>
    </form>
  </body>
</html>`);
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

async function handleChat(request, response) {
  const geminiApiKey = getGeminiApiKey();
  if (!geminiApiKey) {
    sendJson(response, 500, {
      error: "ยังไม่ได้ตั้งค่า GEMINI_API_KEY บน backend",
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

    const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`, {
      method: "POST",
      headers: {
        "x-goog-api-key": geminiApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: ADVISER_INSTRUCTIONS }],
        },
        contents: toGeminiContents(input),
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
        },
      }),
    });

    const data = await apiResponse.json();
    if (!apiResponse.ok) {
      sendJson(response, apiResponse.status, {
        error: data.error?.message || "Gemini API ตอบกลับไม่สำเร็จ",
      });
      return;
    }

    const reply = getGeminiOutputText(data);
    const finishReason = data.candidates?.[0]?.finishReason || "";
    sendJson(response, 200, {
      reply: reply || "ขอโทษครับ ตอนนี้ฉันยังสรุปคำตอบไม่ได้ ลองเล่าให้สั้นลงอีกนิดได้ไหม",
      finishReason,
    });
  } catch (error) {
    sendJson(response, 500, {
      error: "backend คุยกับ Gemini ไม่สำเร็จ",
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
  if (request.method === "GET" && (request.url === "/setup-gemini" || request.url === "/setup-openai")) {
    sendGeminiSetupPage(response);
    return;
  }

  if (request.method === "POST" && (request.url === "/api/setup/gemini" || request.url === "/api/setup/openai")) {
    try {
      const rawBody = await readBody(request);
      const params = new URLSearchParams(rawBody);
      const key = String(params.get("geminiApiKey") || params.get("openaiApiKey") || "").trim();
      if (!key) {
        sendGeminiSetupPage(response, "กรุณาใส่ Gemini API key ก่อนบันทึก");
        return;
      }
      writeEnvValue("GEMINI_API_KEY", key);
      sendGeminiSetupPage(response, "บันทึกสำเร็จแล้ว ตอนนี้ backend ใช้ Gemini key นี้ได้ทันที");
    } catch (error) {
      sendJson(response, 500, {
        error: "บันทึก GEMINI_API_KEY ไม่สำเร็จ",
        detail: error.message,
      });
    }
    return;
  }

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
      model: GEMINI_MODEL,
      provider: "gemini",
      openaiConfigured: Boolean(getGeminiApiKey()),
      geminiConfigured: Boolean(getGeminiApiKey()),
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
