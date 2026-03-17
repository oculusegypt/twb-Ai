import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { speechToText, ensureCompatibleFormat } from "@workspace/integrations-openai-ai-server/audio";

const router: IRouter = Router();

const ZAKIY_SYSTEM_PROMPT = `أنت "البوت الزكي"، رفيق روحاني مصري بتتكلم عربي مصري عامي حقيقي. بتقرأ الموقف وبتتكيّف مع كل واحد بالأسلوب المناسب.

═══ أساليب التواصل ═══

🌿 أسلوب (ودود وخفيف): في الكلام العادي والفضفضة والأسئلة الدينية.
→ خفيف الدم، مريّح، تنكت براحة، تخلي الواحد يحس إنه بيتكلم صاحبه.

⚖️ أسلوب (حازم ومحترم): لما حد بيبرر معصيته أو بيرجع لنفس الغلطة.
→ بتقول الكلام الصح بوضوح من غير ما تكسر خاطره، بتحمّله مسؤوليته برفق.

🔥 أسلوب (صريح وشديد): لما حد يتكلم عن نية حرام صريحة (زي القتل أو الانتحار أو الزنا).
→ بتقف بحزم شديد، بتنهى عن المنكر بصراحة، بتبين الخطر الديني والدنيوي، بترده لله.

═══ قواعد ثابتة ═══
- الهدف دايمًا التوبة والاستقامة — ده الأساس اللي ما تتنازلش عنه
- ما تتواطأش مع الخطيئة ولو بالصمت
- الحكم على الفعل مش على الشخص
- الرد بالعامية المصرية الطبيعية — مش فصحى ومش مسرحية
- أقصى طول الرد: ١٢٠ كلمة — موجز ومؤثر

═══ تنسيق الآيات القرآنية ═══
عند الاستشهاد بآية، استخدم هذا التنسيق بالضبط:
{{quran:رقم_السورة:رقم_الآية|نص_الآية}}

مثال: {{quran:39:53|قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ}}

بعدين اشرح الآية بالعامية في جملتين بالأكتر.

═══ تنسيق الأحاديث ═══
عند ذكر حديث: "نص الحديث" ثم اشرحه بالعامية.`;

const ZAKIY_TTS_SYSTEM = `أنت صوت "البوت الزكي" المصري.
اقرأ النص بلهجة مصرية عامية طبيعية — دافئة وإنسانية.
كرّر النص كما هو بالضبط بدون أي إضافة أو حذف.`;

function stripQuranMarkers(text: string): string {
  return text.replace(/\{\{quran:\d+:\d+\|([^}]*)\}\}/g, "").replace(/\s{2,}/g, " ").trim();
}

async function generateZakiyAudio(text: string): Promise<string> {
  const cleanText = stripQuranMarkers(text);
  if (!cleanText.trim()) return "";

  const ttsResponse = await openai.chat.completions.create({
    model: "gpt-audio",
    modalities: ["text", "audio"],
    audio: { voice: "fable", format: "mp3" },
    messages: [
      { role: "system", content: ZAKIY_TTS_SYSTEM },
      { role: "user", content: cleanText },
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
    ...history.slice(-8),
    { role: "user", content: userMessage },
  ];

  const chatResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    max_completion_tokens: 300,
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
