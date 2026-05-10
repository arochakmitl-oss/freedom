const {
  ADVISER_INSTRUCTIONS,
  GEMINI_MAX_OUTPUT_TOKENS,
  GEMINI_MODEL,
  getGeminiApiKey,
  getGeminiOutputText,
  json,
  normalizeMessages,
  toGeminiContents,
} = require("./_shared");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const geminiApiKey = getGeminiApiKey();
  if (!geminiApiKey) {
    return json(500, {
      error: "ยังไม่ได้ตั้งค่า GEMINI_API_KEY บน Netlify Environment Variables",
    });
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const input = normalizeMessages(body.messages);

    if (!input.length) {
      return json(400, { error: "ไม่มีข้อความสำหรับส่งให้ AI" });
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
      return json(apiResponse.status, {
        error: data.error?.message || "Gemini API ตอบกลับไม่สำเร็จ",
      });
    }

    const reply = getGeminiOutputText(data);
    const finishReason = data.candidates?.[0]?.finishReason || "";
    return json(200, {
      reply: reply || "ขอโทษครับ ตอนนี้ฉันยังสรุปคำตอบไม่ได้ ลองเล่าให้สั้นลงอีกนิดได้ไหม",
      finishReason,
    });
  } catch (error) {
    return json(500, {
      error: "Netlify Function คุยกับ Gemini ไม่สำเร็จ",
      detail: error.message,
    });
  }
};
