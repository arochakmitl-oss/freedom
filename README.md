# Freedom

แอปแชทภาษาไทยสำหรับผู้ช่วยการเงินส่วนตัว โดยหน้าเว็บเรียก backend local ที่ `/api/chat` และ backend เป็นคนเชื่อมต่อ OpenAI Responses API

## ตั้งค่า

สร้างไฟล์ `.env` ในโฟลเดอร์นี้ แล้วใส่ค่า:

```bash
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4.1-mini
PORT=4176
HOST=127.0.0.1
```

## รัน

```bash
npm start
```

จากนั้นเปิด:

```text
http://127.0.0.1:4176
```

อย่าเปิดด้วย `file://` หากต้องการใช้ AI จริง เพราะ browser ต้องเรียก backend ผ่าน `/api/chat`
