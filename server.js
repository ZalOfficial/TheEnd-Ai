const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const OPENROUTER_API_KEY = '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';

app.post('/api/ask', async (req, res) => {
  const { message, style } = req.body;

  const systemPrompt = {
    default: "Kamu adalah AI assistant profesional seputar hosting dan script.",
    ramah: "Jawab dengan gaya ramah dan santai, bantu user seputar hosting dan bot.",
    sarkas: "Jawab dengan gaya sarkas tapi tetap bantu, tentang hosting atau bot.",
    bocil: "Jawab seperti bocil, lebay dan nyebelin, tapi tetap bantu seputar hosting.",
    toxic: "Jawaban agak toxic, nyolot, tapi masih ngasih solusi buat masalah hosting/script."
  }[style] || style;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct:free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content || "❌ Gagal dapat jawaban dari AI.";
    res.json({ response: reply.trim() });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ response: "❌ Gagal terhubung ke OpenRouter API." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ AI Backend aktif di http://localhost:${PORT}`);
});
