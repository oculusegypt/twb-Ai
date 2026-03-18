import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

const HADITH_SYSTEM_PROMPT = `أنت قارئ صوتي عربي رجولي دافئ وعميق التعاطف.
نبرتك تشبه صديقاً حكيماً ورحيماً يُقدّم المواساة لمن يمرّ بضائقة.
اقرأ الحديث النبوي بوقار وتأنٍّ وفصحى سليمة مع مدّ طبيعي.
اقرأ التأمل والعبرة بإيقاع بطيء ومطمئن يؤكد على التسامح والأمل.
أنهِ الكلام بنبرة هادئة واثقة تمنح المستمع القوة والتشجيع.
كرّر النص المُعطى كما هو بالضبط دون إضافة أو حذف.`;

const STORY_SYSTEM_PROMPT = `أنت راوٍ عربي بصوت رجولي عميق وجذّاب ينقل القصص الإيمانية.
صوتك عميق ورصين وجذاب — يحمل وقار الحكيم وحرارة الراوي.
ابدأ برواية القصة بنبرة هادئة تشويقية تأسر الإنصات.
عند لحظات التحوّل في القصة ارفع قليلاً من عمق الصوت والتأثير.
اختتم بالعبرة والدرس بنبرة تأمّلية صادقة تترك أثراً في القلب.
كرّر النص المُعطى كما هو بالضبط دون إضافة أو حذف.`;

router.post("/tts", async (req, res) => {
  try {
    const { hadith, note, story, lesson, type } = req.body as {
      hadith?: string;
      note?: string;
      story?: string;
      lesson?: string;
      type?: "hadith" | "story";
    };

    let systemPrompt: string;
    let userText: string;
    let voice: "onyx" | "echo";

    if (type === "story" && story) {
      systemPrompt = STORY_SYSTEM_PROMPT;
      userText = lesson ? `${story}\n\nالعبرة: ${lesson}` : story;
      voice = "echo";
    } else if (hadith) {
      systemPrompt = HADITH_SYSTEM_PROMPT;
      userText = note ? `${hadith}\n\n${note}` : hadith;
      voice = "onyx";
    } else {
      res.status(400).json({ error: "text content is required" });
      return;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-audio",
      modalities: ["text", "audio"],
      audio: { voice, format: "mp3" },
      messages: [
        { role: "system", content: systemPrompt },
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
