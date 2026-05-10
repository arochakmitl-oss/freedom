# Freedom

แอปแชทภาษาไทยสำหรับผู้ช่วยการเงินส่วนตัว โดยหน้าเว็บเรียก backend local ที่ `/api/chat` และ backend เป็นคนเชื่อมต่อ Gemini API

## ตั้งค่า

สร้างไฟล์ `.env` ในโฟลเดอร์นี้ แล้วใส่ค่า:

```bash
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
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

## Deploy บน Netlify

โปรเจกต์นี้รองรับ Netlify Functions แล้ว โดย route ต่อไปนี้จะถูก map อัตโนมัติ:

- `/api/chat` -> `netlify/functions/chat.js`
- `/api/status` -> `netlify/functions/status.js`
- `/api/config` -> `netlify/functions/config.js`

ตั้งค่า Environment Variables ใน Netlify ก่อน deploy:

```text
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_TABLE=freedom_profiles
```

ห้าม commit ค่า secret ลง GitHub ให้ใส่ผ่าน Netlify Site settings เท่านั้น
