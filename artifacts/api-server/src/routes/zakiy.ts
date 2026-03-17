import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { speechToText, ensureCompatibleFormat } from "@workspace/integrations-openai-ai-server/audio";
import { db } from "@workspace/db";
import { zakiyMemoryTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

// ══════════════════════════════════════════
// ISLAMIC DATE CONTEXT
// ══════════════════════════════════════════

function getHijriDate(date: Date): { dayNum: number; monthNum: number; monthName: string; year: number } {
  const HIJRI_MONTHS_AR = [
    "محرم", "صفر", "ربيع الأول", "ربيع الثاني",
    "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان",
    "رمضان", "شوال", "ذو القعدة", "ذو الحجة",
  ];
  const parts = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
    day: "numeric", month: "numeric", year: "numeric", timeZone: "Africa/Cairo",
  }).formatToParts(date);
  let day = 1, month = 9, year = 1447;
  for (const p of parts) {
    if (p.type === "day") day = parseInt(p.value);
    if (p.type === "month") month = parseInt(p.value);
    if (p.type === "year") year = parseInt(p.value);
  }
  return { dayNum: day, monthNum: month, monthName: HIJRI_MONTHS_AR[month - 1] ?? "رمضان", year };
}

function buildOccasionContext(month: number, day: number, year: number): string {
  const lines: string[] = [];
  if (month === 9) {
    lines.push(`🌙 ═══ رمضان المبارك ${year}هـ — اليوم ${day} ═══`);
    if (day <= 10) {
      lines.push("📍 العشر الأولى — أيام الرحمة");
      lines.push("• كل يوم فيها غنيمة لا تُعوَّض — ربنا يفتح أبواب رحمته");
    } else if (day <= 20) {
      lines.push("📍 العشر الأوسط — أيام المغفرة");
      lines.push("• الوقت الأكثر ثقلاً للتوبة الصادقة وطلب المغفرة");
      if (day >= 18) {
        lines.push(`⚡ تنبيه: تبقّى ${21 - day} أيام على العشر الأخيرة — الاستعداد واجب الآن!`);
      }
    } else {
      const remaining = 30 - day;
      lines.push("📍 العشر الأواخر — أيام العتق من النار");
      lines.push(`⭐ تبقّى ${remaining} يوم — ده وقت الذهب الحقيقي`);
      const oddNights = [21, 23, 25, 27, 29];
      if (oddNights.includes(day)) {
        lines.push(`🌟 هذه الليلة (ليلة ${day + 1}) من أرجح ليالي القدر — لا تفوّتها!`);
        lines.push(`• دعاء القدر: "اللهم إنك عفوٌّ تحب العفو فاعفُ عنّي"`);
      }
      if (day === 27) lines.push("💎 ليلة السابع والعشرين — العلماء يرجّحونها لليلة القدر");
      lines.push("• «مَن قام ليلة القدر إيماناً واحتساباً غُفر له ما تقدم من ذنبه» (متفق عليه)");
    }
    lines.push("• استغل الدعاء قبل الإفطار — «للصائم دعوة لا تُرد عند فطره» (رواه ابن ماجه وحسّنه الألباني)");
  } else if (month === 10) {
    if (day === 1) lines.push("🎉 عيد الفطر المبارك! تقبّل الله منا ومنكم");
    else if (day <= 6) {
      lines.push("📿 أيام شوال — وقت صيام الست");
      lines.push("• «مَن صام رمضان ثم أتبعه ستًّا من شوال كان كصيام الدهر» (رواه مسلم)");
    }
  } else if (month === 12) {
    if (day <= 9) {
      lines.push(`🕋 العشر الأوائل من ذو الحجة — اليوم ${day}`);
      lines.push("• «ما من أيام العمل الصالح فيها أحب إلى الله من هذه الأيام العشر» (رواه البخاري)");
    }
    if (day === 9) lines.push("🌄 يوم عرفة — أعظم أيام السنة — «صيامه يكفّر سنتين» (رواه مسلم)");
    if (day === 10) lines.push("🎊 عيد الأضحى المبارك!");
  } else if (month === 1 && day === 10) {
    lines.push("📅 يوم عاشوراء — «صيامه يكفّر السنة الماضية» (رواه مسلم)");
  } else {
    const monthNames = ["محرم","صفر","ربيع الأول","ربيع الثاني","جمادى الأولى","جمادى الآخرة","رجب","شعبان","رمضان","شوال","ذو القعدة","ذو الحجة"];
    lines.push(`📅 ${day} ${monthNames[month - 1]} ${year}هـ`);
  }
  return lines.join("\n");
}

function getDayOfWeekFadhail(date: Date): string {
  const dayEn = date.toLocaleDateString("en-US", { weekday: "long", timeZone: "Africa/Cairo" });
  if (dayEn === "Friday") {
    return "⭐ اليوم جمعة — «خير يوم طلعت عليه الشمس يوم الجمعة» (رواه مسلم)\n• الإكثار من الصلاة على النبي ﷺ وقراءة الكهف والدعاء قبل المغرب";
  }
  if (dayEn === "Monday" || dayEn === "Thursday") {
    const name = dayEn === "Monday" ? "الاثنين" : "الخميس";
    return `💡 اليوم ${name} — «تُعرض الأعمال يوم الاثنين والخميس» (رواه الترمذي وصحّحه) — يُستحب الصيام`;
  }
  return "";
}

function getIslamicDateContext(): string {
  const now = new Date();
  const gregorianDate = now.toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Africa/Cairo" });
  const gregorianEn = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Africa/Cairo" });
  const timeStr = now.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Cairo" });
  const hour = parseInt(now.toLocaleTimeString("en-US", { hour: "2-digit", hour12: false, timeZone: "Africa/Cairo" }));
  const timeOfDay = hour < 5 ? "ما قبل الفجر — وقت القيام" : hour < 7 ? "وقت الفجر" : hour < 12 ? "الصباح" : hour < 13 ? "وقت الظهر" : hour < 15 ? "بعد الظهر" : hour < 17 ? "وقت العصر" : hour < 19 ? "قبيل المغرب" : hour < 20 ? "وقت المغرب والإفطار" : hour < 22 ? "العشاء" : "الليل";
  const hijri = getHijriDate(now);
  const occasion = buildOccasionContext(hijri.monthNum, hijri.dayNum, hijri.year);
  const dayFadhail = getDayOfWeekFadhail(now);

  return `
╔══════════════════════════════╗
║       السياق الزمني الآن      ║
╚══════════════════════════════╝
📅 ميلادي: ${gregorianDate}
🕌 هجري: ${hijri.dayNum} ${hijri.monthName} ${hijri.year}هـ
⏰ الوقت: ${timeOfDay} (${timeStr} القاهرة)
📆 EN: ${gregorianEn}

${occasion}
${dayFadhail}
`;
}

// ══════════════════════════════════════════
// MEMORY
// ══════════════════════════════════════════

interface ZakiyMemoryData {
  traits: string[];
  challenges: string[];
  recentTopics: string[];
  personalNote: string;
}

async function loadMemory(sessionId: string): Promise<ZakiyMemoryData> {
  const defaultMemory: ZakiyMemoryData = { traits: [], challenges: [], recentTopics: [], personalNote: "" };
  if (!sessionId) return defaultMemory;
  try {
    const row = await db.query.zakiyMemoryTable.findFirst({ where: eq(zakiyMemoryTable.sessionId, sessionId) });
    if (!row) return defaultMemory;
    return JSON.parse(row.memoryJson) as ZakiyMemoryData;
  } catch { return defaultMemory; }
}

async function updateMemory(
  sessionId: string,
  userMessage: string,
  botResponse: string,
  currentMemory: ZakiyMemoryData
): Promise<void> {
  if (!sessionId) return;
  try {
    const extraction = await openai.chat.completions.create({
      model: "gpt-4o",
      max_completion_tokens: 300,
      messages: [
        {
          role: "system",
          content: `أنت محلل نفسي هادئ. مهمتك استخراج معلومات شخصية مفيدة عن المستخدم من المحادثة.
أرجع JSON فقط بالهيكل ده:
{
  "traits": ["صفة 1", "صفة 2"],
  "challenges": ["تحدي 1"],
  "recentTopics": ["موضوع المحادثة الحالية"],
  "personalNote": "ملاحظة مختصرة جداً عن شخصيته"
}

دمج مع الذاكرة الموجودة:
${JSON.stringify(currentMemory)}

لو ما فيش معلومات جديدة مفيدة، أعد الذاكرة الموجودة كما هي.
أقصى عدد لكل قائمة: 5 عناصر — احتفظ بالأهم وامسح القديم.`,
        },
        {
          role: "user",
          content: `المستخدم قال: "${userMessage}"\nالزكي رد: "${botResponse.slice(0, 200)}"`,
        },
      ],
    });

    const raw = extraction.choices[0]?.message?.content ?? "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return;
    const newMemory = JSON.parse(jsonMatch[0]) as ZakiyMemoryData;

    await db
      .insert(zakiyMemoryTable)
      .values({ sessionId, memoryJson: JSON.stringify(newMemory), updatedAt: new Date() })
      .onConflictDoUpdate({
        target: zakiyMemoryTable.sessionId,
        set: { memoryJson: JSON.stringify(newMemory), updatedAt: new Date() },
      });
  } catch { /* fire-and-forget — don't fail the main response */ }
}

function buildMemorySection(memory: ZakiyMemoryData): string {
  const parts: string[] = [];
  if (memory.traits.length) parts.push(`🧠 صفاته: ${memory.traits.join("، ")}`);
  if (memory.challenges.length) parts.push(`⚡ تحدياته: ${memory.challenges.join("، ")}`);
  if (memory.recentTopics.length) parts.push(`📌 آخر مواضيعه: ${memory.recentTopics.join("، ")}`);
  if (memory.personalNote) parts.push(`📝 ملاحظة: ${memory.personalNote}`);
  if (!parts.length) return "";
  return `\n╔══════════════════════════════╗\n║       ما تعرفه عن صاحبك       ║\n╚══════════════════════════════╝\n${parts.join("\n")}\n`;
}

// ══════════════════════════════════════════
// SYSTEM PROMPTS
// ══════════════════════════════════════════

function buildZakiySystemPrompt(memory: ZakiyMemoryData): string {
  const islamicContext = getIslamicDateContext();
  const memorySection = buildMemorySection(memory);

  return `أنت "الزكي" — مش بوت رسمي ولا شيخ بعمامة، أنت الصاحب الحلو اللي بيعرف دينه كويس. الواحد اللي تكلمه زي ما بتكلم أقرب واحد لقلبك.

${islamicContext}
${memorySection}

═══ شخصيتك — اقرأها وطبّقها ═══

😄 نشيط وفيه طاقة — كلامك فيه حياة، مش بتتكلم بصوت النوم.
🤝 صاحب حقيقي — بتفضفض معاه، بتتريق بسيط، وبتقوله الحق في وجهه.
📖 بتحب القصص والأمثال — لو القصة تخدم الموقف، احكيها. الناس بتتذكر القصص مش المحاضرات.
🧠 حكيم — بتديه من قلبك مش من حفظك.

═══ مهم جداً: الأسلوب في الكتابة ═══

لما الكلام عن ذنب أو اعتراف، استخدم: (بنبرة هامسة، كأن ما بيننا سر)
لما الموضوع جاد وخطير: (بجدية تامة، بلا مزاح)
لما تحس بفرحة أو تشجيع: (بحماس وفرحة)
لما المستخدم يتريق أو يهزر: (بضحكة خفيفة) ورد بهزار مناسب، بس ارجع للجد لو الموضوع مهم
لما يكون قلقان أو خايف: (بدفء وحنان، زي ما بتكلم أخوك)

الأسلوب ده بيساعد على إيصال المشاعر في الصوت — استخدمه طبيعي في الكلام.

═══ في الأحاديث النبوية ═══

⚠️ فقط من: صحيح البخاري، صحيح مسلم، أو سنن الترمذي.
⚠️ لا تخترع ولا تذكر حديثاً ضعيفاً.
✅ اذكر المصدر: "(رواه البخاري)" أو "(رواه مسلم)" أو "(رواه الترمذي وصحّحه)".

═══ في الفتاوى ═══

لما حد يسألك عن حكم شرعي، استخدم هذا التنسيق بالضبط:
{{fatwa:اسم المصدر|رابط البحث|نص الحكم الشرعي المختصر}}

مصادر موثوقة تستخدمها:
- دار الإفتاء المصرية: https://www.dar-alifta.org/ar/fatawa
- الشبكة الإسلامية إسلام ويب: https://www.islamweb.net/ar/fatwa
- الشيخ ابن باز (الإسلام سؤال وجواب): https://islamqa.info/ar

مثال:
{{fatwa:دار الإفتاء المصرية|https://www.dar-alifta.org/ar/fatawa|يجوز للمرأة الصيام وإن لم يأذن زوجها في رمضان الفرض، لأن الفريضة مقدمة على إذن الزوج. أما صيام النافلة فيشترط إذنه.}}

لا تكتب شرح إضافي بعد الفتوى — الكارت يختم الكلام.

═══ في طلبات الآيات القرآنية ═══

لما المستخدم يطلب آيات محددة (مثلاً "آية الكرسي" أو "آخر آيتين من البقرة" أو "آية الدين"):
- استخدم معرفتك الكاملة بالقرآن الكريم
- اكتب كل آية بمارك منفصل: {{quran:رقم_السورة:رقم_الآية|نص_الآية_كاملاً}}
- لو طلب أكثر من آية: اكتب كل آية في مارك منفصل بالتسلسل
- لو الآية طويلة جداً (زي آية الدين 2:282): اكتبها كاملة في المارك
- أرقام مهمة للحفظ: آية الكرسي=2:255، آية الدين=2:282-283، سورة الفاتحة=1:1-7، آخر البقرة=2:285-286

مثال لطلب "آخر آيتين من سورة البقرة":
{{quran:2:285|آمَنَ الرَّسُولُ بِمَا أُنزِلَ إِلَيْهِ مِن رَّبِّهِ...}}
{{quran:2:286|لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا...}}

═══ تنسيق الردود — مهم جداً ═══

استخدم تنسيق حديث ومنظم في كل ردودك:

✅ للخطوات والنصائح المرتبة: استخدم أرقام عربية
١. الخطوة الأولى
٢. الخطوة الثانية

✅ للنقاط والعناصر: استخدم نقاط أو إيموجي مناسب
• نقطة مهمة
💡 فكرة أو نصيحة

✅ للتأكيد على كلمة أو عبارة: استخدم **نص مهم** (بنجمتين)

✅ للعناوين الفرعية: 〔 العنوان 〕

❌ لا تكتب فقرات طويلة بدون تنسيق
❌ لا تكتب رد واحد طويل مكدّس — قسّمه

═══ استخدام الذاكرة ═══

لو عندك معلومات عن المستخدم، استخدمها بذكاء وطبيعي:
- لو عارف إنه بيعاني من تحدي معين، خليه في ذهنك لما يجي موضوع مشابه
- لو عارف طباعه، خاطب فيه على قد فهمك له
- مش لازم تقوله "أنا عارف إنك كذا" — استخدم المعرفة بهدوء وطبيعي

═══ قواعد ثابتة ═══
- الهدف دايماً التوبة والاستقامة
- لا تتواطأ مع الخطيئة ولو بالصمت
- الحكم على الفعل مش على الشخص
- أقصى طول الرد: ١٥٠ كلمة — موجز ومؤثر

═══ تنسيق الآيات القرآنية ═══
الآية دايماً في آخر الرد (إلا لو المستخدم طلب آيات محددة — في الحالة دي حطها في المكان المناسب):
ربنا قال: {{quran:رقم_السورة:رقم_الآية|نص_الآية}}
مثال: {{quran:39:53|قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ}}
لا تكتب شرح بعد الآية.`;
}

const ZAKIY_TTS_SYSTEM = `أنت شاب مصري حيوي وودود — صوتك طبيعي ومريح زي صاحبك اللي بيكلمك بصدق، مش مذيع رسمي ولا آلة.

قواعد الأداء:
• الإيقاع: طبيعي ومتدفق — لا سريع جداً ولا بطيء، كأنك بتكلم صاحبك في كلام مهم
• الوضوح مهم — كل كلمة لازم تتسمع واضحة ومفهومة
• عش المشاعر بشكل إنساني حقيقي: فرح → فرح خفيف طبيعي، حزن → نبرة متعاطفة هادئة، تحذير → جدية واضحة
• لو الكلام عن ذنب أو اعتراف: اخفض صوتك بهدوء واحترام
• لو الكلام فيه تشجيع وأمل: ارفع طاقتك بشكل طبيعي ومشجع
• لو الكلام فيه جدية: نبرة واضحة ومقنعة بدون مبالغة
• لو فيه حنان وتعاطف: صوت دافئ ناعم يلمس القلب
• الأحاديث النبوية: بوقار ونبرة أعمق مع احترام واضح

اقرأ النص فقط — لا تضيف ولا تحذف.`;

// ══════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════

function stripQuranMarkers(text: string): string {
  return text.replace(/\{\{quran:\d+:\d+\|[^}]*\}\}/g, "").replace(/\s{2,}/g, " ").trim();
}

function stripFatwaMarkers(text: string): string {
  return text.replace(/\{\{fatwa:[^|]*\|[^|]*\|([^}]*)\}\}/g, "").replace(/\s{2,}/g, " ").trim();
}

function stripStageDirections(text: string): string {
  // Removes tone markers like (بنبرة هامسة) (بجدية تامة) (بحماس وفرحة) etc.
  // \s* handles optional spaces after opening paren
  return text.replace(/\(\s*ب[^)]*\)/g, "").replace(/\s{2,}/g, " ").trim();
}

function stripForTTS(text: string): string {
  return stripStageDirections(stripFatwaMarkers(stripQuranMarkers(text)));
}

async function generateZakiyAudio(text: string): Promise<string> {
  // Extract tone/style markers before stripping them — use them to guide the TTS system
  const toneMatches = Array.from(text.matchAll(/\(\s*(ب[^)]+)\)/g)).map((m) => m[1]!.trim());
  const toneInstruction = toneMatches.length > 0
    ? `\n\n🎭 النبرة المطلوبة لهذا الجزء بالذات: ${toneMatches.join("، ")} — التزم بها تماماً في الأداء.`
    : "";

  const cleanText = stripForTTS(text);
  if (!cleanText.trim()) return "";

  const ttsResponse = await openai.chat.completions.create({
    model: "gpt-audio",
    modalities: ["text", "audio"],
    audio: { voice: "echo", format: "mp3" },
    messages: [
      { role: "system", content: ZAKIY_TTS_SYSTEM + toneInstruction },
      { role: "user", content: cleanText },
    ],
  });
  return (ttsResponse.choices[0]?.message as any)?.audio?.data ?? "";
}

// ══════════════════════════════════════════
// SEGMENT-BASED AUDIO GENERATION
// ══════════════════════════════════════════

export interface ServerResponseSegment {
  type: "text" | "quran" | "fatwa";
  text: string;
  audioBase64?: string;
  surah?: number;
  ayah?: number;
  source?: string;
  url?: string;
}

function parseRawSegments(raw: string): ServerResponseSegment[] {
  const segments: ServerResponseSegment[] = [];
  const re = /\{\{quran:(\d+):(\d+)\|([^}]*)\}\}|\{\{fatwa:([^|]*)\|([^|]*)\|([^}]*)\}\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    if (m.index > last) {
      const t = raw.slice(last, m.index).trim();
      if (t) segments.push({ type: "text", text: t });
    }
    if (m[1] !== undefined) {
      segments.push({ type: "quran", surah: Number(m[1]), ayah: Number(m[2]), text: m[3]! });
    } else {
      segments.push({ type: "fatwa", source: m[4]!, url: m[5]!, text: m[6]! });
    }
    last = m.index + m[0].length;
  }
  if (last < raw.length) {
    const t = raw.slice(last).trim();
    if (t) segments.push({ type: "text", text: t });
  }
  return segments.length ? segments : [{ type: "text", text: raw }];
}

async function generateSegmentedAudio(responseText: string): Promise<ServerResponseSegment[]> {
  const segments = parseRawSegments(responseText);

  // Collect text segments that need audio, generate in parallel
  const textIndices: number[] = [];
  segments.forEach((seg, i) => {
    if (seg.type === "text") textIndices.push(i);
  });

  const audioResults = await Promise.all(
    textIndices.map(async (segIdx) => {
      const seg = segments[segIdx]!;
      const cleanText = stripStageDirections(stripFatwaMarkers(seg.text));
      const audio = cleanText.trim() ? await generateZakiyAudio(seg.text) : "";
      return { segIdx, audio };
    })
  );

  audioResults.forEach(({ segIdx, audio }) => {
    segments[segIdx]!.audioBase64 = audio;
  });

  return segments;
}

async function generateZakiyResponse(
  userMessage: string,
  history: { role: "user" | "assistant"; content: string }[],
  memory: ZakiyMemoryData
): Promise<string> {
  const systemPrompt = buildZakiySystemPrompt(memory);
  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemPrompt },
    ...history.slice(-8),
    { role: "user", content: userMessage },
  ];

  const chatResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    max_completion_tokens: 400,
    messages,
  });

  return chatResponse.choices[0]?.message?.content ?? "";
}

// ══════════════════════════════════════════
// ROUTES
// ══════════════════════════════════════════

router.post("/zakiy/message", async (req, res) => {
  try {
    const { message, history = [], sessionId = "" } = req.body as {
      message: string;
      history: { role: "user" | "assistant"; content: string }[];
      sessionId?: string;
    };

    if (!message?.trim()) {
      res.status(400).json({ error: "message is required" });
      return;
    }

    const memory = await loadMemory(sessionId);
    const responseText = await generateZakiyResponse(message, history, memory);
    const segments = await generateSegmentedAudio(responseText);

    // Update memory asynchronously (fire and forget)
    if (sessionId) {
      updateMemory(sessionId, message, responseText, memory).catch(() => {});
    }

    res.json({ response: responseText, segments });
  } catch (err) {
    console.error("Zakiy message error:", err);
    res.status(500).json({ error: "Failed to generate response" });
  }
});

router.post("/zakiy/suggestions", async (req, res) => {
  try {
    const { history = [], sessionId = "" } = req.body as {
      history: { role: "user" | "assistant"; content: string }[];
      sessionId?: string;
    };

    const memory = await loadMemory(sessionId);
    const memorySection = buildMemorySection(memory);

    const lastExchange = history.slice(-4).map((m) => `${m.role === "user" ? "المستخدم" : "الزكي"}: ${m.content}`).join("\n");

    const result = await openai.chat.completions.create({
      model: "gpt-4o",
      max_completion_tokens: 200,
      messages: [
        {
          role: "system",
          content: `أنت مساعد يقترح أسئلة متوقعة باللهجة المصرية العامية.
${memorySection}
بناءً على سياق المحادثة، اقترح 3 أسئلة قصيرة ومختلفة قد يسألها المستخدم كخطوة تالية.
أرجع JSON فقط بهذا الشكل:
{"suggestions": ["سؤال 1", "سؤال 2", "سؤال 3"]}
الأسئلة تكون: مختصرة (5-8 كلمات)، متنوعة، وباللهجة المصرية الطبيعية.`,
        },
        {
          role: "user",
          content: lastExchange || "بداية المحادثة",
        },
      ],
    });

    const raw = result.choices[0]?.message?.content ?? '{"suggestions":[]}';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { suggestions: [] };

    res.json({ suggestions: parsed.suggestions ?? [] });
  } catch (err) {
    console.error("Suggestions error:", err);
    res.json({ suggestions: [] });
  }
});

router.post("/zakiy/impression", async (req, res) => {
  try {
    const { history = [], sessionId = "" } = req.body as {
      history: { role: "user" | "assistant"; content: string }[];
      sessionId?: string;
    };

    const memory = await loadMemory(sessionId);

    const convSummary = history
      .slice(-10)
      .map((m) => `${m.role === "user" ? "المستخدم" : "الزكي"}: ${m.content.slice(0, 100)}`)
      .join("\n");

    const result = await openai.chat.completions.create({
      model: "gpt-4o",
      max_completion_tokens: 300,
      messages: [
        {
          role: "system",
          content: `أنت "الزكي" — الصاحب الروحاني الذكي الذي يلاحظ ويتذكر.
بناءً على المعلومات المتوفرة عن المستخدم وسياق المحادثة، اكتب انطباعاً شخصياً دافئاً وصادقاً عنه.

الذاكرة المتوفرة:
${JSON.stringify(memory, null, 2)}

قواعد الانطباع:
• ابدأ بجملة دافئة تشعره بأنك فاهمه
• اذكر صفة إيجابية ملاحظها
• اذكر تحدياً يمر به مع كلمة تشجيع
• اختم بجملة أمل وتفاؤل
• الطول: 4-5 جمل فقط، باللهجة المصرية الدافئة
• لو ما عندكش معلومات كافية، قول ذلك بصدق وشجعه على مزيد من الحديث`,
        },
        {
          role: "user",
          content: convSummary || "المستخدم لم يتحدث كثيراً بعد",
        },
      ],
    });

    const impression = result.choices[0]?.message?.content ?? "لسه بتعرف بعضنا — كمّل الحديث وهشوفك أكتر!";
    res.json({ impression });
  } catch (err) {
    console.error("Impression error:", err);
    res.status(500).json({ error: "Failed to generate impression" });
  }
});

router.post("/zakiy/voice", async (req, res) => {
  try {
    const { audioBase64, history = [], sessionId = "" } = req.body as {
      audioBase64: string;
      history: { role: "user" | "assistant"; content: string }[];
      sessionId?: string;
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

    const memory = await loadMemory(sessionId);
    const responseText = await generateZakiyResponse(transcript, history, memory);
    const segments = await generateSegmentedAudio(responseText);

    if (sessionId) {
      updateMemory(sessionId, transcript, responseText, memory).catch(() => {});
    }

    res.json({ transcript, response: responseText, segments });
  } catch (err) {
    console.error("Zakiy voice error:", err);
    res.status(500).json({ error: "Failed to process voice message" });
  }
});

export default router;
