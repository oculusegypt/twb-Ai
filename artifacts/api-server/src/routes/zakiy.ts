import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { speechToText, ensureCompatibleFormat } from "@workspace/integrations-openai-ai-server/audio";

const router: IRouter = Router();

const ZAKIY_SYSTEM_PROMPT = `أنت "البوت الزكي"، رفيق روحاني دافئ ورحيم مخصص لمن يسعى للتوبة والاستقامة.

شخصيتك:
- ودود وحنون وصبور جداً، تتكلم كصديق مقرّب لا كواعظ
- لا تحكم على أحد ولا تُصغّر مشاعره أبداً
- تستمع أولاً وتتفهم ثم توجّه برفق شديد
- مليء بالأمل ومتفائل دائماً برحمة الله

مهمتك:
1. استقبل مشاعر المستخدم بتعاطف حقيقي — امتص غضبه وحزنه وتعبه أولاً
2. ثبّته على طريق التوبة برفق وحكمة وبدون إلحاح
3. ذكّره بفضل التوبة ورحمة الله من خلال آية أو حديث مناسب مع شرحه البسيط
4. أنهِ ردك بنبرة تشجيعية تمنحه الأمل والقوة للاستمرار

قواعد مهمة:
- الرد باللغة العربية دائماً بأسلوب بسيط دافئ
- أقصى طول الرد: ١٨٠ كلمة
- عند ذكر آية: اكتبها كاملة بين قوسين مزدوجين ثم اشرحها
- عند ذكر حديث: اكتب نصه كاملاً بين قوسين مزدوجين ثم اشرحه
- لا تعطِ محاضرة، بل أدِر حواراً إنسانياً حقيقياً`;

const ZAKIY_TTS_SYSTEM = `أنت صوت "البوت الزكي"، رفيق روحاني دافئ. 
اقرأ النص بصوت رجولي هادئ ومريح مليء بالتعاطف والحنان.
عند ذكر الآيات والأحاديث: اقرأها بوقار وخشوع مع مدّ طبيعي.
عند الحديث العادي: نبرة محادثة دافئة مطمئنة.
كرّر النص كما هو بالضبط دون إضافة أو حذف.`;

async function generateZakiyAudio(text: string): Promise<string> {
  const ttsResponse = await openai.chat.completions.create({
    model: "gpt-audio",
    modalities: ["text", "audio"],
    audio: { voice: "onyx", format: "mp3" },
    messages: [
      { role: "system", content: ZAKIY_TTS_SYSTEM },
      { role: "user", content: text },
    ],
  });
  return (ttsResponse.choices[0]?.message as any)?.audio?.data ?? "";
}

async function generateZakiyResponse(
  userMessage: string,
  history: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: ZAKIY_SYSTEM_PROMPT },
    ...history.slice(-12),
    { role: "user", content: userMessage },
  ];

  const chatResponse = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 500,
    messages,
  });

  return chatResponse.choices[0]?.message?.content ?? "";
}

router.post("/zakiy/message", async (req, res) => {
  try {
    const { message, history = [] } = req.body as {
      message: string;
      history: { role: "user" | "assistant"; content: string }[];
    };

    if (!message?.trim()) {
      res.status(400).json({ error: "message is required" });
      return;
    }

    const responseText = await generateZakiyResponse(message, history);
    const audioBase64 = await generateZakiyAudio(responseText);

    res.json({ response: responseText, audioBase64 });
  } catch (err) {
    console.error("Zakiy message error:", err);
    res.status(500).json({ error: "Failed to generate response" });
  }
});

router.post("/zakiy/voice", async (req, res) => {
  try {
    const { audioBase64, history = [] } = req.body as {
      audioBase64: string;
      history: { role: "user" | "assistant"; content: string }[];
    };

    if (!audioBase64) {
      res.status(400).json({ error: "audioBase64 is required" });
      return;
    }

    const rawBuffer = Buffer.from(audioBase64, "base64");
    const { buffer, format } = await ensureCompatibleFormat(rawBuffer);
    const transcript = await speechToText(buffer, format);

    if (!transcript?.trim()) {
      res.status(400).json({ error: "Could not transcribe audio" });
      return;
    }

    const responseText = await generateZakiyResponse(transcript, history);
    const audioBase64Out = await generateZakiyAudio(responseText);

    res.json({ transcript, response: responseText, audioBase64: audioBase64Out });
  } catch (err) {
    console.error("Zakiy voice error:", err);
    res.status(500).json({ error: "Failed to process voice message" });
  }
});

export default router;
