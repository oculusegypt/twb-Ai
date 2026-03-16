import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

const ARABIC_VOICE_SYSTEM_PROMPT = `أنت قارئ صوتي عربي دافئ ولطيف وعميق التعاطف.
نبرتك تشبه صديقاً حكيماً ورحيماً يُقدّم المواساة.
اقرأ الحديث النبوي بوقار وفصحى سليمة.
اقرأ التأمل والعبرة بإيقاع بطيء ومطمئن يؤكد على التسامح والأمل.
أنهِ الكلام بنبرة تمنح القوة والتشجيع.
كرّر النص المُعطى كما هو بالضبط دون إضافة أو حذف.`;

router.post("/tts", async (req, res) => {
  try {
    const { hadith, note } = req.body as { hadith?: string; note?: string };
    if (!hadith) {
      res.status(400).json({ error: "hadith text is required" });
      return;
    }

    const userText = note
      ? `${hadith}\n\n${note}`
      : hadith;

    const response = await openai.chat.completions.create({
      model: "gpt-audio",
      modalities: ["text", "audio"],
      audio: { voice: "onyx", format: "mp3" },
      messages: [
        { role: "system", content: ARABIC_VOICE_SYSTEM_PROMPT },
        { role: "user", content: userText },
      ],
    });

    const audioData = (response.choices[0]?.message as any)?.audio?.data ?? "";
    const audioBuffer = Buffer.from(audioData, "base64");

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", audioBuffer.length);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(audioBuffer);
  } catch (err) {
    console.error("TTS error:", err);
    res.status(500).json({ error: "Failed to generate audio" });
  }
});

export default router;
