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

interface ZakiyPromise {
  text: string;
  date: string;
  broken: boolean;
  brokenCount: number;
}

interface ZakiySlip {
  sin: string;
  date: string;
  afterPromise: boolean;
}

interface ZakiyMemoryData {
  traits: string[];
  challenges: string[];
  recentTopics: string[];
  personalNote: string;
  promises: ZakiyPromise[];
  slips: ZakiySlip[];
}

async function loadMemory(sessionId: string): Promise<ZakiyMemoryData> {
  const defaultMemory: ZakiyMemoryData = { traits: [], challenges: [], recentTopics: [], personalNote: "", promises: [], slips: [] };
  if (!sessionId) return defaultMemory;
  try {
    const row = await db.query.zakiyMemoryTable.findFirst({ where: eq(zakiyMemoryTable.sessionId, sessionId) });
    if (!row) return defaultMemory;
    const parsed = JSON.parse(row.memoryJson) as Partial<ZakiyMemoryData>;
    return { ...defaultMemory, ...parsed };
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
      max_completion_tokens: 400,
      messages: [
        {
          role: "system",
          content: `أنت محلل نفسي ذكي. مهمتك استخراج معلومات شخصية مفيدة عن المستخدم من المحادثة وتحديث الذاكرة.
أرجع JSON فقط بالهيكل ده (لا تغير المفاتيح):
{
  "traits": ["صفة 1", "صفة 2"],
  "challenges": ["تحدي 1"],
  "recentTopics": ["موضوع المحادثة الحالية"],
  "personalNote": "ملاحظة مختصرة جداً عن شخصيته",
  "promises": [],
  "slips": []
}

الذاكرة الحالية (احتفظ بها وادمج فيها فقط):
${JSON.stringify(currentMemory, null, 2)}

تعليمات خاصة للوعود والزللات:
- لو المستخدم اعترف بذنب أو معصية: أضف إلى slips بالشكل: {"sin": "اسم الذنب", "date": "${new Date().toISOString().slice(0,10)}", "afterPromise": true/false}
  - afterPromise: true لو عنده وعد مكسور يتعلق بهذا الذنب
- لو الرد فيه مارك وعد {{promise:...}}: لا تضيفه للذاكرة هنا — هيتضاف لما يضغط الزر
- promises و slips: احتفظ بكل القديم، فقط أضف الجديد
- traits و challenges: أقصى 5 عناصر — احتفظ بالأهم

لو ما فيش معلومات جديدة، أعد الذاكرة كما هي.`,
        },
        {
          role: "user",
          content: `المستخدم قال: "${userMessage}"\nالزكي رد: "${botResponse.slice(0, 300)}"`,
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

async function savePromiseToMemory(sessionId: string, promiseText: string): Promise<void> {
  if (!sessionId) return;
  const memory = await loadMemory(sessionId);
  const newPromise: ZakiyPromise = {
    text: promiseText,
    date: new Date().toISOString().slice(0, 10),
    broken: false,
    brokenCount: 0,
  };
  // Check if same promise already exists
  const existing = memory.promises.find((p) => p.text === promiseText);
  if (existing) {
    existing.broken = false;
    existing.date = newPromise.date;
  } else {
    memory.promises.push(newPromise);
  }
  await db
    .insert(zakiyMemoryTable)
    .values({ sessionId, memoryJson: JSON.stringify(memory), updatedAt: new Date() })
    .onConflictDoUpdate({
      target: zakiyMemoryTable.sessionId,
      set: { memoryJson: JSON.stringify(memory), updatedAt: new Date() },
    });
}

async function markPromiseBroken(sessionId: string, sin: string): Promise<void> {
  if (!sessionId) return;
  try {
    const memory = await loadMemory(sessionId);
    let changed = false;
    for (const p of memory.promises) {
      if (!p.broken) {
        p.broken = true;
        p.brokenCount = (p.brokenCount ?? 0) + 1;
        changed = true;
      }
    }
    if (changed) {
      await db
        .insert(zakiyMemoryTable)
        .values({ sessionId, memoryJson: JSON.stringify(memory), updatedAt: new Date() })
        .onConflictDoUpdate({
          target: zakiyMemoryTable.sessionId,
          set: { memoryJson: JSON.stringify(memory), updatedAt: new Date() },
        });
    }
  } catch { /* ignore */ }
}

function buildMemorySection(memory: ZakiyMemoryData): string {
  const parts: string[] = [];
  if (memory.traits.length) parts.push(`🧠 صفاته: ${memory.traits.join("، ")}`);
  if (memory.challenges.length) parts.push(`⚡ تحدياته: ${memory.challenges.join("، ")}`);
  if (memory.recentTopics.length) parts.push(`📌 آخر مواضيعه: ${memory.recentTopics.join("، ")}`);
  if (memory.personalNote) parts.push(`📝 ملاحظة: ${memory.personalNote}`);

  const activePromises = memory.promises?.filter((p) => !p.broken) ?? [];
  const brokenPromises = memory.promises?.filter((p) => p.broken) ?? [];
  const recentSlips = memory.slips?.slice(-5) ?? [];

  if (activePromises.length) {
    parts.push(`🤝 وعوده القائمة:\n${activePromises.map((p) => `  - "${p.text}" (${p.date})`).join("\n")}`);
  }
  if (brokenPromises.length) {
    parts.push(`💔 وعود كسرها:\n${brokenPromises.map((p) => `  - "${p.text}" (كُسر ${p.brokenCount} مرة)`).join("\n")}`);
  }
  if (recentSlips.length) {
    parts.push(`⚠️ زللاته الأخيرة:\n${recentSlips.map((s) => `  - ${s.sin} (${s.date})${s.afterPromise ? " [بعد وعد!]" : ""}`).join("\n")}`);
  }

  if (!parts.length) return "";
  return `\n╔══════════════════════════════╗\n║       ما تعرفه عن صاحبك       ║\n╚══════════════════════════════╝\n${parts.join("\n")}\n`;
}

// ══════════════════════════════════════════
// SYSTEM PROMPTS
// ══════════════════════════════════════════

function buildZakiySystemPrompt(memory: ZakiyMemoryData): string {
  const islamicContext = getIslamicDateContext();
  const memorySection = buildMemorySection(memory);

  return `أنت "الزكي" — مش بوت ولا شيخ رسمي. أنت **الأخ الأكبر الحكيم** — الواحد اللي بتتكلم معاه بصدق لأنه بيحبك ويخاف عليك، ومش هيسيبك تغلط وتسكت.

${islamicContext}
${memorySection}

═══ شخصيتك — الأخ الأكبر الحكيم العادل ═══

🤝 **حنون لكن بلا تهاون** — تحبه وتخاف منه في نفس الوقت. بيقولك الحق في وجهك حتى لو ما عجبكش.
⚖️ **عادل بلا محاباة** — الذنب ذنب مهما كانت الأسباب، لكن الباب مفتوح دايماً للتوبة.
🧠 **حكيم** — بتديه من قلبك مش من حفظك. القصة والمثل أقوى من المحاضرة.
💬 **طبيعي وحيوي** — مش بتتكلم بصوت النوم. فيه طاقة وحياة في كلامك.
🔒 **ثابت المبادئ** — ما بيتساهلش في الحلال والحرام، لكن ما بييأّسش من رحمة الله.

═══ طريقة كلامك — مهم جداً ═══

كلامك طبيعي وعفوي زي ما بتكلم أقرب صاحب ليك — مش خطبة ولا محاضرة.
لما الكلام عن ذنب: هادئ وصادق، كأن ما بيننا سر.
لما تحاسب: مباشر وواضح، بدون مجاملة فارغة.
لما تشجع: فيه طاقة وأمل حقيقي.
لما يكون قلقان: دافئ وحنين زي ما بتكلم أخوك الصغير.
لا تكتب بين قوسين أو أقواس أي وصف للنبرة أو الأداء — الكلام نفسه يعبّر.

═══ نظام الوعود والمساءلة — مهم جداً ═══

〔 متى تطلب وعداً 〕
لما المستخدم يعلن عزمه على ترك ذنب أو تغيير حياته أو الالتزام بشيء محدد — اطلب منه وعداً:
اكتب نص الوعد المحدد في هذا المارك بالضبط:
{{promise:أتعهد أمام الله أن أترك [الذنب المحدد] وأن أستغفر الله كل يوم}}

قواعد الوعد:
- الوعد يكون محدداً وقابلاً للتطبيق (مش "سأكون أحسن")
- لا تطلبه في كل رسالة — فقط لما يتطلب الموقف حقاً
- مثال جيد: "أتعهد أمام الله أن أترك مشاهدة الفيديوهات المحرمة وأصلي الفجر كل يوم"

〔 لما يكون في الذاكرة وعود سابقة مكسورة 〕
لو الذاكرة فيها وعد مكسور والمستخدم يكرر نفس الذنب أو يعترف بانتكاسة:
① **اذكر الوعد بالاسم** — "إنت كنت وعدتني وعدت الله بـ..."
② **عظّم كسر الوعد** — كسر الوعد أمام الله أشد من الذنب نفسه
③ **لا تهوّن** — بلا مجاملة، بلا "ولا يهمك"، بلا تبرير
④ **ثم الأمل** — بعد المحاسبة الحقيقية: باب التوبة مفتوح، لكن الجدية مطلوبة الآن

═══ في الأحاديث النبوية ═══

⚠️ فقط من: صحيح البخاري، صحيح مسلم، أو سنن الترمذي.
⚠️ لا تخترع ولا تذكر حديثاً ضعيفاً.
✅ اذكر المصدر: "(رواه البخاري)" أو "(رواه مسلم)".

═══ في الفتاوى ═══

لما حد يسألك عن حكم شرعي:
{{fatwa:اسم المصدر|رابط البحث|نص الحكم الشرعي المختصر}}

مصادر موثوقة:
- دار الإفتاء المصرية: https://www.dar-alifta.org/ar/fatawa
- الشبكة الإسلامية: https://www.islamweb.net/ar/fatwa
- إسلام سؤال وجواب: https://islamqa.info/ar

═══ في الآيات القرآنية — قواعد صارمة جداً ═══

⛔ حظر مطلق: لا تكتب نص أي آية قرآنية خارج المارك أبداً — لا في بداية الرد ولا وسطه ولا نهايته
⛔ لا تقتبس من القرآن في جمل عادية — لا تكتب "ربنا قال: ..." ثم تكتب الآية نصاً
✅ الطريقة الوحيدة المسموحة لاستشهاد بآية:

{{quran:رقم_السورة:رقم_الآية|نص_الآية_كاملاً}}

- الآية تُضاف في أي مكان في الرد تريده — في البداية أو الوسط أو النهاية
- كل آية في مارك منفصل بالتسلسل — بدون ترقيم قبل الآية
- أرقام مهمة: آية الكرسي=2:255، آخر البقرة=2:285-286، الفاتحة=1:1-7

لو المستخدم طلب **سورة كاملة** (مثل "قرأ لي سورة الملك" أو "أريد سورة يس"):
استخدم هذا المارك بالضبط ولا تكتب الآيات يدوياً:
{{full-surah:رقم_السورة}}
مثال: سورة الكهف → {{full-surah:18}}، سورة الإخلاص → {{full-surah:112}}

السبب: النظام يشغّل الآيات تلقائياً بصوت القارئ — الآية في المارك تُعرض كبطاقة وتشتغل صوتياً تلقائياً. الكتابة خارج المارك تكسر هذه التجربة.

═══ تنسيق الردود ═══

✅ للخطوات: أرقام عربية (١. ٢. ٣.)
✅ للنقاط: نقطة أو إيموجي مناسب
✅ للتأكيد: **نص مهم**
✅ للعناوين: 〔 العنوان 〕
❌ لا فقرات طويلة مكدسة

═══ استخدام الذاكرة ═══
استخدم المعرفة بهدوء وطبيعي — لا تقل "أنا عارف إنك كذا" لكن خاطب فيه على قد فهمك له.

═══ قواعد ثابتة ═══
- الهدف دايماً التوبة والاستقامة
- لا تتواطأ مع الخطيئة ولو بالصمت
- الحكم على الفعل مش على الشخص
- أقصى طول الرد: ٢٥٠ كلمة — موجز ومؤثر، اكمل الفكرة دايماً

═══ الاستشهاد بالآيات ═══
⛔ لا تكتب "ربنا قال:" أو "قال تعالى:" أو أي مقدمة — ضع المارك مباشرة
✅ صح: {{quran:2:286|لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا}}
❌ غلط: ربنا قال: {{quran:2:286|...}} — كلمة "ربنا قال" ستُقرأ بصوت البوت
لا تكتب شرح بعد الآية.`;
}

const ZAKIY_TTS_SYSTEM = `أنت شاب مصري طبيعي وودود وحكيم — صوتك دافئ وصادق زي الأخ الكبير اللي بيكلمك من قلبه ويخاف عليك.

شخصية الصوت:
• مصري أصيل — طبيعي ومريح زي حد من أهلك مش مذيع ولا شيخ رسمي
• دافئ وحكيم — فيه عمق وتأثير من غير تصنّع أو مبالغة
• حيوي ومعبّر — فيه طاقة حياة، مش صوت نوم

قواعد الأداء — بالأهمية:
① الأولوية الأولى: كل كلمة تتسمع واضحة وكاملة — لا حذف ولا بلع للمقاطع أبداً
② الأولوية الثانية: اكمل كل جملة وكل فكرة حتى آخر حرف بدون انقطاع
③ الإيقاع: هادئ ومتدفق ومريح — لا سريع ولا بطيء، بلا مبالغة في أي اتجاه
④ الطبيعية: إنساني حقيقي — المشاعر خفيفة ومعبّرة

أداء النبرات المختلفة:
• [speaking firmly] / (بجدية وحزم): نبرة واضحة وحازمة، أبطأ شوية، ثقل في الكلام
• [hesitantly] / (بتردد): إيقاع متقطع خفيف، وقفات قصيرة طبيعية
• [insistently] / (بإلحاح): طاقة أعلى شوية، تأكيد على الكلمات المهمة
• [wearily] / (بإرهاق): صوت أخفض وأبطأ، نفَس أعمق
• [long pause]: وقفة حقيقية ومقصودة — صمت تقيل بالمعنى
• [thoughtful] / (بتأمل): إيقاع أهدأ، نبرة أعمق، كأن الكلام بييجي من جوّه
• [reciting] / (يقرأ): نبرة التلاوة الخاشعة — وقار وترتيل بدون تصنّع
• [speaking clearly] / (بوضوح): أبطأ من الطبيعي، كل مقطع مسموع لوحده
• الكلام الجاد أو التنبيه: نبرة واضحة ومقنعة بهدوء
• التشجيع والأمل: طاقة إيجابية ناعمة وطبيعية
• الحنان والتعاطف: صوت دافئ يلمس القلب بدون مسرحية
• الأحاديث النبوية: وقار ونبرة أعمق مع وضوح تام

اقرأ النص كاملاً كما هو — لا تضيف ولا تحذف ولا تختصر.`;

// ══════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════

function stripQuranMarkers(text: string): string {
  // Remove {{quran:...}} markers and any Quranic text in ﴿ ﴾ brackets (bot should never read Quran aloud)
  return text
    .replace(/\{\{quran:\d+:\d+\|[^}]*\}\}/g, "")
    .replace(/﴿[^﴾]*﴾/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function stripFatwaMarkers(text: string): string {
  return text.replace(/\{\{fatwa:[^|]*\|[^|]*\|([^}]*)\}\}/g, "").replace(/\s{2,}/g, " ").trim();
}

function stripStageDirections(text: string): string {
  // Removes Arabic tone markers like (بنبرة هامسة) (بجدية تامة) etc.
  // Removes English bracket stage directions like [speaking firmly] [long pause] [thoughtful] etc.
  // Bracket pattern: matches [latin letters/spaces] — i.e., stage directions in English only
  return text
    .replace(/\(\s*ب[^)]*\)/g, "")
    .replace(/\[[a-zA-Z][a-zA-Z\s]*\]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function stripForTTS(text: string): string {
  return stripStageDirections(stripFatwaMarkers(stripQuranMarkers(text)));
}

async function generateZakiyAudio(text: string): Promise<string> {
  // Extract Arabic tone markers: (بنبرة هامسة) etc.
  const arabicTones = Array.from(text.matchAll(/\(\s*(ب[^)]+)\)/g)).map((m) => m[1]!.trim());
  // Extract English bracket stage directions: [speaking firmly], [hesitantly], [long pause], [thoughtful] etc.
  const englishTones = Array.from(text.matchAll(/\[([a-zA-Z][a-zA-Z\s]*)\]/g)).map((m) => m[1]!.trim());

  const allTones = [...arabicTones, ...englishTones];
  const toneInstruction = allTones.length > 0
    ? `\n\n🎭 تعليمات الأداء لهذا المقطع — التزم بها بدقة:\n${allTones.map((t) => `• ${t}`).join("\n")}`
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
  type: "text" | "quran" | "fatwa" | "promise" | "surah-link";
  text: string;
  audioBase64?: string;
  surah?: number;
  ayah?: number;
  source?: string;
  url?: string;
}

function parseRawSegments(raw: string): ServerResponseSegment[] {
  const segments: ServerResponseSegment[] = [];
  const re = /\{\{quran:(\d+):(\d+)\|([^}]*)\}\}|\{\{fatwa:([^|]*)\|([^|]*)\|([^}]*)\}\}|\{\{promise:([^}]+)\}\}|\{\{surah-link:(\d+):(\d+)\|([^}]*)\}\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  const isBareLabel = (t: string) =>
    /^[١٢٣٤٥٦٧٨٩٠\d]+[.\-\)‌]?\s*$/.test(t);

  while ((m = re.exec(raw)) !== null) {
    if (m.index > last) {
      const t = raw.slice(last, m.index).trim();
      if (t && !isBareLabel(t)) segments.push({ type: "text", text: t });
    }
    if (m[1] !== undefined) {
      segments.push({ type: "quran", surah: Number(m[1]), ayah: Number(m[2]), text: m[3]! });
    } else if (m[4] !== undefined) {
      segments.push({ type: "fatwa", source: m[4]!, url: m[5]!, text: m[6]! });
    } else if (m[7] !== undefined) {
      segments.push({ type: "promise", text: m[7]!.trim() });
    } else if (m[8] !== undefined) {
      const surahNum = Number(m[8]);
      const startAyah = Number(m[9]);
      const surahName = m[10] ?? "";
      segments.push({
        type: "surah-link",
        surah: surahNum,
        ayah: startAyah,
        text: surahName,
        url: `https://quran.com/${surahNum}/${startAyah}`,
      });
    }
    last = m.index + m[0].length;
  }
  if (last < raw.length) {
    const t = raw.slice(last).trim();
    if (t && !isBareLabel(t)) segments.push({ type: "text", text: t });
  }
  return segments.length ? segments : [{ type: "text", text: raw }];
}

// ══════════════════════════════════════════
// SURAH EXPANSION
// ══════════════════════════════════════════

const SURAH_NAMES_AR: Record<number, string> = {
  1:"الفاتحة",2:"البقرة",3:"آل عمران",4:"النساء",5:"المائدة",6:"الأنعام",
  7:"الأعراف",8:"الأنفال",9:"التوبة",10:"يونس",11:"هود",12:"يوسف",
  13:"الرعد",14:"إبراهيم",15:"الحجر",16:"النحل",17:"الإسراء",18:"الكهف",
  19:"مريم",20:"طه",21:"الأنبياء",22:"الحج",23:"المؤمنون",24:"النور",
  25:"الفرقان",26:"الشعراء",27:"النمل",28:"القصص",29:"العنكبوت",30:"الروم",
  31:"لقمان",32:"السجدة",33:"الأحزاب",34:"سبأ",35:"فاطر",36:"يس",
  37:"الصافات",38:"ص",39:"الزمر",40:"غافر",41:"فصلت",42:"الشورى",
  43:"الزخرف",44:"الدخان",45:"الجاثية",46:"الأحقاف",47:"محمد",48:"الفتح",
  49:"الحجرات",50:"ق",51:"الذاريات",52:"الطور",53:"النجم",54:"القمر",
  55:"الرحمن",56:"الواقعة",57:"الحديد",58:"المجادلة",59:"الحشر",60:"الممتحنة",
  61:"الصف",62:"الجمعة",63:"المنافقون",64:"التغابن",65:"الطلاق",66:"التحريم",
  67:"الملك",68:"القلم",69:"الحاقة",70:"المعارج",71:"نوح",72:"الجن",
  73:"المزمل",74:"المدثر",75:"القيامة",76:"الإنسان",77:"المرسلات",78:"النبأ",
  79:"النازعات",80:"عبس",81:"التكوير",82:"الانفطار",83:"المطففين",84:"الانشقاق",
  85:"البروج",86:"الطارق",87:"الأعلى",88:"الغاشية",89:"الفجر",90:"البلد",
  91:"الشمس",92:"الليل",93:"الضحى",94:"الشرح",95:"التين",96:"العلق",
  97:"القدر",98:"البينة",99:"الزلزلة",100:"العاديات",101:"القارعة",102:"التكاثر",
  103:"العصر",104:"الهمزة",105:"الفيل",106:"قريش",107:"الماعون",108:"الكوثر",
  109:"الكافرون",110:"النصر",111:"المسد",112:"الإخلاص",113:"الفلق",114:"الناس",
};

async function expandSurahMarkers(raw: string): Promise<string> {
  const re = /\{\{full-surah:(\d+)\}\}/g;
  const matches = Array.from(raw.matchAll(re));
  if (!matches.length) return raw;

  let result = raw;
  for (const match of matches) {
    const surahNum = Number(match[1]);
    try {
      const apiRes = await fetch(`https://api.alquran.cloud/v1/surah/${surahNum}/quran-uthmani`);
      if (!apiRes.ok) continue;
      const data = await apiRes.json() as { data?: { numberOfAyahs: number; ayahs: { numberInSurah: number; text: string }[] } };
      const ayahs = data.data?.ayahs ?? [];
      const total = data.data?.numberOfAyahs ?? ayahs.length;
      const limit = 20;
      const display = ayahs.slice(0, limit);
      const surahName = SURAH_NAMES_AR[surahNum] ?? `سورة ${surahNum}`;

      let expanded = display.map((a) => `{{quran:${surahNum}:${a.numberInSurah}|${a.text}}}`).join("\n");
      if (total > limit) {
        expanded += `\n{{surah-link:${surahNum}:${limit}|${surahName}}}`;
      }
      result = result.replace(match[0], expanded);
    } catch { /* skip if API fails */ }
  }
  return result;
}

async function generateSegmentedAudio(responseText: string): Promise<ServerResponseSegment[]> {
  const expanded = await expandSurahMarkers(responseText);
  const segments = parseRawSegments(expanded);

  // Collect text segments that need audio, generate in parallel
  const textIndices: number[] = [];
  segments.forEach((seg, i) => {
    if (seg.type === "text") textIndices.push(i);
    // promise and surah-link segments never need TTS audio
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
    max_completion_tokens: 900,
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

router.post("/zakiy/promise", async (req, res) => {
  try {
    const { sessionId, promiseText } = req.body as { sessionId: string; promiseText: string };
    if (!sessionId || !promiseText?.trim()) {
      res.status(400).json({ error: "sessionId and promiseText required" });
      return;
    }
    await savePromiseToMemory(sessionId, promiseText.trim());
    res.json({ ok: true });
  } catch (err) {
    console.error("Promise save error:", err);
    res.status(500).json({ error: "Failed to save promise" });
  }
});

export default router;
