const {
  ADVISER_INSTRUCTIONS,
  OPENAI_MODEL,
  getOutputText,
  json,
  normalizeMessages,
} = require("./_shared");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return json(500, {
      error: "ยังไม่ได้ตั้งค่า OPENAI_API_KEY บน Netlify Environment Variables",
    });
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const input = normalizeMessages(body.messages);

    if (!input.length) {
      return json(400, { error: "ไม่มีข้อความสำหรับส่งให้ AI" });
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
      return json(apiResponse.status, {
        error: data.error?.message || "OpenAI API ตอบกลับไม่สำเร็จ",
      });
    }

    const reply = getOutputText(data);
    return json(200, {
      reply: reply || "ขอโทษครับ ตอนนี้ฉันยังสรุปคำตอบไม่ได้ ลองเล่าให้สั้นลงอีกนิดได้ไหม",
    });
  } catch (error) {
    return json(500, {
      error: "Netlify Function คุยกับ OpenAI ไม่สำเร็จ",
      detail: error.message,
    });
  }
};
