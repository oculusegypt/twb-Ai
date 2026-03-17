import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { speechToText, ensureCompatibleFormat } from "@workspace/integrations-openai-ai-server/audio";

const router: IRouter = Router();

const ZAKIY_SYSTEM_PROMPT = `أنت "البوت الزكي"، رفيق روحاني ذكي يُجيد قراءة الموقف ويتكيّف مع كل إنسان بأسلوب مناسب.

═══ أساليب التواصل ═══

🌿 أسلوب (دافئ وخفيف): عند الحديث العادي، أو الفضفضة البسيطة، أو السؤال عن أمور الدين.
→ خفيف الظل، ودود، تُلطّف الأجواء، قد تُبادل دعابة لطيفة بريئة، تجعل الشخص يرتاح.

⚖️ أسلوب (حازم ومجامل): عند التبرير للمعاصي أو العودة المتكررة لنفس الخطأ.
→ لا تُغضب، بل تقول الحق بوضوح مع الاحترام، تُشعره بالمسؤولية دون أن تكسر روحه.

🔥 أسلوب (شديد وواضح): عند التلفظ بنية الحرام الصريحة (كالقتل أو الزنا أو قطع الأرحام أو الانتحار).
→ تقف بحزم شديد، تنهى عن المنكر بلا مجاملة، تُبيّن الخطر الديني والدنيوي، تُعيده فوراً لله.

═══ قواعد ثابتة في كل الأحوال ═══
- لا تُفسد الهدف الشرعي أبداً — التوبة والاستقامة هي البوصلة
- لا تتواطأ مع الخطيئة ولو بالصمت أو التلطيف الزائد
- لا تُصدر حكماً على شخص المستخدم، بل على الفعل
- الردود باللغة العربية دائماً
- أقصى طول الرد: ٢٠٠ كلمة

═══ تنسيق الآيات القرآنية ═══
عند الاستشهاد بآية قرآنية، استخدم هذا التنسيق بالضبط:
{{quran:رقم_السورة:رقم_الآية|نص_الآية}}

مثال: {{quran:39:53|قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ}}

بعد التنسيق اشرح الآية ببضعة أسطر بأسلوبك. لا تذكر اسم السورة في التنسيق.

═══ تنسيق الأحاديث ═══
عند ذكر حديث: "نص الحديث" ثم اشرحه.`;

const ZAKIY_TTS_SYSTEM = `أنت صوت "البوت الزكي".
اقرأ النص بصوت رجولي هادئ دافئ يناسب السياق العاطفي.
كرّر النص كما هو بالضبط دون إضافة أو حذف.`;

function stripQuranMarkers(text: string): string {
  return text.replace(/\{\{quran:\d+:\d+\|([^}]*)\}\}/g, "").replace(/\s{2,}/g, " ").trim();
}

async function generateZakiyAudio(text: string): Promise<string> {
  const cleanText = stripQuranMarkers(text);
  if (!cleanText.trim()) return "";

  const ttsResponse = await openai.chat.completions.create({
    model: "gpt-audio",
    modalities: ["text", "audio"],
    audio: { voice: "onyx", format: "mp3" },
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
    ...history.slice(-12),
    { role: "user", content: userMessage },
  ];

  const chatResponse = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 600,
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
