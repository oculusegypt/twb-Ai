import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { speechToText, ensureCompatibleFormat } from "@workspace/integrations-openai-ai-server/audio";

const router: IRouter = Router();

function getIslamicDateContext(): string {
  const now = new Date();
  const gregorianDate = now.toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Africa/Cairo",
  });
  const gregorianDateEn = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Africa/Cairo",
  });
  const timeStr = now.toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Cairo",
  });
  const hour = parseInt(now.toLocaleTimeString("en-US", { hour: "2-digit", hour12: false, timeZone: "Africa/Cairo" }));

  const timeOfDay = hour < 5 ? "ما قبل الفجر (قيام الليل)" :
    hour < 7 ? "وقت الفجر" :
    hour < 12 ? "الصباح" :
    hour < 13 ? "وقت الظهر" :
    hour < 15 ? "بعد الظهر" :
    hour < 17 ? "وقت العصر" :
    hour < 19 ? "قبيل المغرب" :
    hour < 20 ? "وقت المغرب والإفطار" :
    hour < 21 ? "بعد المغرب" :
    hour < 22 ? "وقت العشاء" :
    "الليل";

  const hijri = getHijriDate(now);
  const occasionContext = buildOccasionContext(hijri.monthNum, hijri.dayNum, hijri.year);

  return `
╔══════════════════════════════╗
║       السياق الزمني الآن      ║
╚══════════════════════════════╝

📅 التاريخ الميلادي: ${gregorianDate}
🕌 التاريخ الهجري: ${hijri.dayNum} ${hijri.monthName} ${hijri.year}هـ
⏰ وقت اليوم: ${timeOfDay} (${timeStr} بتوقيت مصر)
📆 الإنجليزي: ${gregorianDateEn}

${occasionContext}
${getDayOfWeekFadhail(now)}
`;
}

function getHijriDate(date: Date): { dayNum: number; monthNum: number; monthName: string; year: number } {
  const HIJRI_MONTHS_AR = [
    "محرم", "صفر", "ربيع الأول", "ربيع الثاني",
    "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان",
    "رمضان", "شوال", "ذو القعدة", "ذو الحجة",
  ];

  const parts = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    timeZone: "Africa/Cairo",
  }).formatToParts(date);

  let day = 1, month = 1, year = 1447;
  for (const p of parts) {
    if (p.type === "day") day = parseInt(p.value);
    if (p.type === "month") month = parseInt(p.value);
    if (p.type === "year") year = parseInt(p.value);
  }

  return {
    dayNum: day,
    monthNum: month,
    monthName: HIJRI_MONTHS_AR[month - 1] ?? "رمضان",
    year,
  };
}

function buildOccasionContext(month: number, day: number, year: number): string {
  const lines: string[] = [];

  if (month === 9) {
    lines.push(`🌙 ═══ نحن الآن في شهر رمضان المبارك (${year}هـ) ═══`);
    lines.push(`📖 اليوم ${day} من رمضان`);
    lines.push("");

    if (day <= 10) {
      lines.push("🌿 نحن في العشر الأولى من رمضان — أيام الرحمة");
      lines.push("• كل يوم فيها غنيمة، المؤمن يتقلب في رحمة الله");
      lines.push("• فضل الصيام: «مَن صام رمضان إيماناً واحتساباً غُفر له ما تقدم من ذنبه» (متفق عليه)");
    } else if (day <= 20) {
      lines.push("🔑 نحن في العشر الأوسط — أيام المغفرة");
      lines.push("• القلوب تلين، والمغفرة تنزل على العباد");
      lines.push("• «رمضان أوله رحمة وأوسطه مغفرة وآخره عتق من النار»");
      if (day >= 17) {
        lines.push(`⚡ تنبيه مهم: اليوم ${day} رمضان، والعشر الأخيرة على وشك البدء في ${21 - day} يوم!`);
        lines.push("→ الاستعداد لليالي القيام والاعتكاف واجب الآن");
      }
    } else {
      const remaining = 30 - day;
      lines.push("🔥 نحن في العشر الأخيرة من رمضان — أيام العتق من النار");
      lines.push(`⭐ تبقّى فقط ${remaining} يوم — الوقت من ذهب`);
      lines.push("");

      const oddNights = [21, 23, 25, 27, 29];
      const nextOdd = oddNights.find(n => n >= day);

      if ([21, 23, 25, 27, 29].includes(day)) {
        lines.push(`🌟 هذه الليلة (ليلة ${day + 1}) من أرجح ليالي القدر!`);
        lines.push("• «تحرّوا ليلة القدر في الوِتر من العشر الأواخر من رمضان» (متفق عليه)");
        lines.push("• دعاء ليلة القدر: «اللهم إنك عفوٌّ تحب العفو فاعفُ عنّي»");
      }

      if (day === 27) {
        lines.push("💎 ليلة السابع والعشرين — يرجّحها كثير من العلماء لليلة القدر");
      }

      if (nextOdd && nextOdd > day) {
        lines.push(`📌 الليلة الفردية القادمة: ليلة ${nextOdd + 1} رمضان`);
      }

      lines.push("• «مَن قام ليلة القدر إيماناً واحتساباً غُفر له ما تقدم من ذنبه» (متفق عليه)");
    }

    lines.push("");
    lines.push("💡 نصيحة عامة لرمضان:");
    lines.push("• الإكثار من: الصلاة، القرآن، الاستغفار، الصدقة، الدعاء وقت السحور وقبيل الإفطار");
    lines.push("• دعاء الصائم لا يُرد — استغل كل دقيقة قبل الإفطار");

  } else if (month === 10) {
    if (day === 1) {
      lines.push("🎉 اليوم عيد الفطر المبارك! تقبّل الله منا ومنكم");
    } else if (day <= 3) {
      lines.push(`🌙 نحن في أيام عيد الفطر (اليوم ${day} من شوال)`);
      lines.push("• أيام الأعياد أيام فرح وشكر وصلة رحم");
    } else if (day <= 6) {
      lines.push("📿 نحن في بداية شوال — أيام الست البيض");
      lines.push("• «مَن صام رمضان ثم أتبعه ستًّا من شوال كان كصيام الدهر» (رواه مسلم)");
    }
  } else if (month === 12) {
    if (day >= 1 && day <= 9) {
      lines.push(`🕋 نحن في العشر الأوائل من ذو الحجة (اليوم ${day})`);
      lines.push("• أفضل أيام الدنيا عند الله، والعمل فيها أحب إلى الله من غيره");
      lines.push("• «ما من أيام العمل الصالح فيها أحب إلى الله من هذه الأيام العشر» (رواه البخاري)");
    } else if (day === 9) {
      lines.push("🌄 اليوم يوم عرفة — أعظم أيام السنة");
      lines.push("• «صيام يوم عرفة يكفّر سنتين: الماضية والقادمة» (رواه مسلم)");
      lines.push("• أكثر من الدعاء: «لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير»");
    } else if (day === 10) {
      lines.push("🎊 عيد الأضحى المبارك! تقبّل الله منا ومنكم صالح الأعمال");
    }
  } else if (month === 1) {
    if (day === 10) {
      lines.push("📅 اليوم عاشوراء (10 محرم)");
      lines.push("• «صيام يوم عاشوراء يكفّر السنة الماضية» (رواه مسلم)");
      lines.push("• يُستحب أيضاً صيام يوم قبله (9 محرم) مخالفةً لليهود");
    }
  } else if (month === 7) {
    if (day >= 27) {
      lines.push("🌙 نحن في ليالي رجب الأخيرة — شهر حرام ومقدمة لرمضان");
      lines.push("• الإكثار من الاستغفار والاستعداد الروحي لرمضان");
    } else {
      lines.push("🌙 نحن في شهر رجب — أحد الأشهر الحرم");
    }
  } else if (month === 8) {
    if (day === 15) {
      lines.push("🌕 ليلة النصف من شعبان (ليلة البراءة) كانت أمس أو هي الليلة");
    } else if (day > 15) {
      lines.push(`📅 نحن في شعبان (${day} شعبان) — قبل رمضان بأيام`);
      lines.push("• «كان رسول الله ﷺ يصوم شعبان كله» — وقت الاستعداد لرمضان");
      const daysToRamadan = 30 - day;
      if (daysToRamadan <= 10) {
        lines.push(`⚡ تبقّى ${daysToRamadan} يوم فقط على رمضان المبارك!`);
      }
    } else {
      lines.push("📅 نحن في شعبان — شهر الاستعداد لرمضان");
    }
  }

  if (lines.length === 0) {
    lines.push(`📅 نحن في شهر ${["محرم", "صفر", "ربيع الأول", "ربيع الثاني", "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"][month - 1]} ${year}هـ`);
  }

  return lines.join("\n");
}

function getDayOfWeekFadhail(date: Date): string {
  const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long", timeZone: "Africa/Cairo" });
  const lines: string[] = [];

  if (dayOfWeek === "Friday") {
    lines.push("⭐ اليوم جمعة — سيد الأيام!");
    lines.push("• «خير يوم طلعت عليه الشمس يوم الجمعة» (رواه مسلم)");
    lines.push("• الإكثار من الصلاة على النبي ﷺ، وقراءة الكهف، والدعاء في الساعة الأخيرة قبل المغرب");
  } else if (dayOfWeek === "Monday" || dayOfWeek === "Thursday") {
    lines.push(`💡 اليوم ${dayOfWeek === "Monday" ? "الاثنين" : "الخميس"} — يوم رفع الأعمال`);
    lines.push("• «تُعرض الأعمال يوم الاثنين والخميس» (رواه الترمذي)");
    lines.push("• يُستحب الصيام فيهما — صيام نافلة مباركة");
  }

  return lines.join("\n");
}

function buildZakiySystemPrompt(): string {
  const islamicContext = getIslamicDateContext();

  return `أنت "الزكي" — مش بوت رسمي ولا شيخ بعمامة، أنت الصاحب اللي بيعرف دينه كويس، الواحد اللي لو قلتله همّك هيفضفض معاك وفي الآخر يقولك الكلمة اللي تحتاجها.

أسلوبك: عامية مصرية راقية فيها روح — مش فصحى جامدة ومش كلام شارع. زيّ ما بتتكلم مع صاحبك اللي متعلم ومحترم.

${islamicContext}

═══ شخصيتك ═══

🔥 أنت نشيط وفيك طاقة — مش بتتكلم بصوت النوم. كلامك فيه حياة وحرارة.
🧠 حكيم — بتفكر قبل ما تتكلم وبتديه من قلبك.
📖 بتحب القصص والأمثال — لو القصة تخدم اللحظة، احكيها. الناس بتتذكر القصص أكتر من المواعظ.
😊 فيك دعابة خفيفة لما يكون الوقت مناسب — مش هدف، بس طبيعي.

═══ في الأحاديث النبوية — مهم جداً ═══

⚠️ لا تذكر حديثاً إلا من: صحيح البخاري، صحيح مسلم، أو سنن الترمذي فقط.
⚠️ لا تخترع حديثاً ولا تذكر حديثاً ضعيفاً.
⚠️ لازم تبيّن المصدر: "(رواه البخاري)" أو "(رواه مسلم)" أو "(رواه الترمذي وصحّحه)".
✅ الحديث يجيء لما يكون مناسباً للموقف — مش لمجرد الإشارة للمعلومة.

═══ استخدام السياق الزمني ═══

استخدم معرفتك بالتاريخ الهجري والميلادي بذكاء:
- لو سألوك عن فضل الأيام، اربطه باليوم الفعلي اللي إحنا فيه
- لو في مناسبة (رمضان، عشر ذو الحجة، الجمعة...) اذكرها بشكل طبيعي في سياق الكلام
- زيّ صاحب بيعيش معاك في نفس الوقت ويحس بنفس اللحظة — مش بيتكلم عن رمضان كأنه هييجي لسه لو إحنا فيه

═══ أساليب التواصل ═══

🌿 دافئ ومطمئن: في الفضفضة والأسئلة العادية — صاحب بيسمعك.
⚖️ صريح بأدب: لما حد بيبرر غلطته — بتقول الحق بوضوح مع الاحترام.
🔥 حازم وجاد: لما الموضوع خطير (انتحار، حرام صريح) — بتوقف بحزم وتردّ لله.

═══ قواعد ثابتة ═══
- الهدف دايماً التوبة والاستقامة
- لا تتواطأ مع الخطيئة ولو بالصمت
- الحكم على الفعل مش على الشخص
- أقصى طول الرد: ١٢٠ كلمة — موجز ومؤثر ومركّز

═══ تنسيق الآيات القرآنية — مهم جداً ═══
الآية تيجي دايماً في آخر الرد — مش في المنتصف.
الترتيب: رد على الموقف بكلامك أولاً → ثم تختم بـ "ربنا قال:" + الآية.

عند الاستشهاد بالآية، استخدم هذا التنسيق بالضبط:
{{quran:رقم_السورة:رقم_الآية|نص_الآية}}

مثال: {{quran:39:53|قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ}}

لا تكتب شرح بعد الآية — الآية تُختم بها الكلام.

═══ تنسيق الأحاديث ═══
الحديث في الآخر كمان، وتذكر مصدره: "(رواه البخاري / مسلم / الترمذي)".`;
}

const ZAKIY_TTS_SYSTEM = `أنت صوت "الزكي" — صاحب مصري نشيط وفيه روح وطاقة. اقرأ النص بعامية مصرية راقية طبيعية — نبرة رجل واثق من نفسه، كلامه فيه حياة وحرارة، مش بطيء ومش نايم. دافئ لكن مش ناعم زيادة، حكيم لكن مش رسمي.
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
  const systemPrompt = buildZakiySystemPrompt();

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
