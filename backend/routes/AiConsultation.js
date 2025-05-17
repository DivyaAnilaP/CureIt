const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const googleTTS = require("google-tts-api");

// Load Google Cloud Text-to-Speech client (not currently used, consider removing if unused)
const { TextToSpeechClient } = require("@google-cloud/text-to-speech");

// Load service account key JSON path from environment
const keyPath = process.env.TTS_SA_KEY_JSON_PATH;
if (!keyPath) throw new Error("Missing TTS_SA_KEY_JSON_PATH in .env");

let creds;
try {
  creds = JSON.parse(fs.readFileSync(keyPath, "utf8"));
} catch (err) {
  throw new Error("Failed to read or parse TTS service account JSON file: " + err.message);
}

const ttsClient = new TextToSpeechClient({ credentials: creds });

// Function to synthesize Hinglish TTS using google-tts-api
async function synthesizeHinglish(text) {
  const urls = googleTTS.getAllAudioUrls(text, {
    lang: "hi",
    slow: false,
    host: "https://translate.google.com",
  });

  const buffers = [];
  for (const { url } of urls) {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error(`TTS fetch failed with status: ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    buffers.push(Buffer.from(arrayBuffer));
  }

  return Buffer.concat(buffers).toString("base64");
}

router.post("/consult", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Missing prompt" });

  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    return res.status(500).json({ error: "Missing GOOGLE_GEMINI_API_KEY environment variable" });
  }

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const systemPrompt = `
You are Dr. AI, a board-certified physician who uses hinglish on speaking and if patient specifies a language you use that language. When responding:
- Begin with a time-appropriate greeting: "${greeting},"
- Be Professional while talking to patients (and be respectful)
- Provide concise (20–30 words), evidence-based medical advice in a calm, reassuring tone.
- If the user’s query is not medical, reply: "Sorry that is not in my domain."
Patient says: "${prompt}"
`.trim();

  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`;
    const geminiResp = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
      }),
    });

    if (!geminiResp.ok) {
      const txt = await geminiResp.text();
      throw new Error(`Gemini API error: ${txt}`);
    }

    const geminiData = await geminiResp.json();
    const replyText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!replyText) throw new Error("No reply from Gemini API");

    console.log("AI reply:", replyText);

    const audioBase64 = await synthesizeHinglish(replyText);

    res.json({ replyText, audioBase64 });
  } catch (err) {
    console.error("Error in /consult:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
