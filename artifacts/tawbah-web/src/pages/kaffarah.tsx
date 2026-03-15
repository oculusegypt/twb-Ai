import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, AlertTriangle, Info } from "lucide-react";
import { useAppUserProgress } from "@/hooks/use-app-data";
import { getSessionId } from "@/lib/session";

type SinCategory = "khilwat" | "mali" | "huquq_nas" | "taqsir_faraid" | "other";

interface KaffarahStep {
  key: string;
  title: string;
  desc: string;
  obligatory: boolean;
  order?: string[];
}

interface KaffarahInfo {
  title: string;
  intro: string;
  warning?: string;
  steps: KaffarahStep[];
}

const KAFFARAH_DATA: Record<SinCategory, KaffarahInfo> = {
  khilwat: {
    title: "كفارة ذنوب الخلوات والنظر",
    intro: "لا كفارة مالية محددة لهذا النوع، لكن التوبة النصوح تستلزم خطوات عملية وروحية.",
    steps: [
      { key: "khilwat_tawba", title: "التوبة الصادقة", desc: "الندم القلبي الحقيقي والعزم على عدم العودة - وهي شرط قبول أي كفارة.", obligatory: true },
      { key: "khilwat_block", title: "سد الذرائع", desc: "حذف كل ما يُعين على الذنب من تطبيقات وروابط ومتابعات. لا توبة بدون هذه الخطوة.", obligatory: true },
      { key: "khilwat_ghusl", title: "الاغتسال من الجنابة", desc: "إن كان الذنب يستوجب الغسل فليُبادر به فوراً.", obligatory: true },
      { key: "khilwat_salat", title: "صلاة ركعتين للتوبة", desc: "صلِّ ركعتين بنية التوبة، واسجد وابكِ بين يدي الله.", obligatory: true },
      { key: "khilwat_sadaqa", title: "الصدقة", desc: "تصدّق بما تيسّر، فالصدقة تطفئ الخطيئة كما يطفئ الماء النار.", obligatory: false },
      { key: "khilwat_sawm", title: "الصيام التطوعي", desc: "صم أياماً تطوعاً، فالصوم يكسر الشهوات ويقوي الإرادة.", obligatory: false },
      { key: "khilwat_quran", title: "ختم أو قراءة القرآن", desc: "أكثر من قراءة القرآن فهو شفاء وتطهير للقلب.", obligatory: false },
    ],
  },
  mali: {
    title: "كفارة الذنب المالي",
    intro: "الكفارة المالية تستلزم رد الحقوق إلى أصحابها، فلا تُقبل التوبة من المظالم المالية إلا بردّها.",
    warning: "تنبيه مهم: لا تُكفَّر الذنوب المالية بالصلاة أو الصيام وحدهما، بل لا بد من رد المال أو التحلل من صاحبه.",
    steps: [
      { key: "mali_tawba", title: "التوبة الصادقة مع الندم", desc: "اندم من أعماق قلبك وعقد العزم الصادق على عدم العودة.", obligatory: true },
      { key: "mali_rad", title: "رد المال إلى صاحبه", desc: "أعد الحقوق المالية كاملة لأصحابها. هذا الركن الأساسي ولا تسقط التوبة بدونه.", obligatory: true },
      { key: "mali_tahallul", title: "طلب التحلل إن تعذّر الرد", desc: "إن تعذّر الرد (مات صاحبه أو جُهل) فتصدّق بالقدر المماثل بنية أن يصل الأجر إليه.", obligatory: true },
      { key: "mali_halal", title: "التزام مصادر الرزق الحلال", desc: "راجع مصادر دخلك كلها واستبعد كل شبهة.", obligatory: true },
      { key: "mali_sadaqa", title: "الصدقة الزائدة", desc: "تصدّق بما يزيد على المبلغ الأصلي طُهرةً لمالك وقلبك.", obligatory: false },
      { key: "mali_kafara_yamin", title: "كفارة اليمين إن كان ثمة حلف", desc: "إن حلفت يميناً على أمر مالي وحنثت: أطعم عشرة مساكين أو اكسُهم أو صم ثلاثة أيام.", obligatory: false },
    ],
  },
  huquq_nas: {
    title: "كفارة حقوق العباد",
    intro: "حقوق العباد لا تسقط بالتوبة وحدها، بل لا بد من ردّها إلى أصحابها أو استحلالهم.",
    warning: "حذار! قال النبي ﷺ: «من كانت له مظلمة لأخيه من عرضه أو شيء فليتحلله منه اليوم قبل أن لا يكون دينار ولا درهم».",
    steps: [
      { key: "huquq_tawba", title: "التوبة الصادقة", desc: "ابك على ما فرّط في حق إخوانك واعزم عزماً قاطعاً.", obligatory: true },
      { key: "huquq_rad_mal", title: "رد الأموال والحقوق المادية", desc: "أعد كل مال أخذته بغير حق أو بظلم أو غش.", obligatory: true },
      { key: "huquq_ithar", title: "الاعتذار وطلب العفو", desc: "تواصل مع من آذيتهم واعتذر بصدق وتواضع واطلب عفوهم.", obligatory: true },
      { key: "huquq_ghiba", title: "إصلاح ما تكلمت به من غيبة أو نميمة", desc: "إن كنت اغتبت شخصاً فأثنِ عليه في المجالس ذاتها التي ذكرته فيها بسوء.", obligatory: true },
      { key: "huquq_dua", title: "الدعاء لمن ظلمته", desc: "ادع لمن آذيتهم بالخير في ظهر الغيب، فهذا من أعظم أسباب رد المظالم.", obligatory: false },
      { key: "huquq_sadaqa", title: "الصدقة بنية رد الأذى", desc: "تصدّق بنية رفع الحيف عن من أسأت إليهم وإن لم تتمكن من إيصالهم.", obligatory: false },
    ],
  },
  taqsir_faraid: {
    title: "كفارة التقصير في الفرائض",
    intro: "لكل فريضة قضاء وكفارة، والأصل في تارك الفريضة العمد أن يتوب ويقضي.",
    steps: [
      { key: "faraid_tawba", title: "التوبة الصادقة فوراً", desc: "لا تؤخر التوبة لحظة، فالتأخير ذنب على ذنب.", obligatory: true },
      { key: "faraid_salat_qada", title: "قضاء الصلوات الفائتة", desc: "ابدأ فوراً بقضاء الصلوات التي تركتها بترتيب. العلماء يختلفون لكن القضاء أحوط وأبرأ للذمة.", obligatory: true },
      { key: "faraid_sawm_qada", title: "قضاء الصيام الفائت", desc: "اقضِ ما أفطرته من رمضان بغير عذر قبل رمضان القادم، ومن أفطر عمداً فعليه الإمساك والقضاء مع الكفارة.", obligatory: true },
      { key: "faraid_zakat", title: "إخراج الزكاة المتراكمة", desc: "احسب ما فاتك من زكوات وأخرجها كاملة وإن كانت كثيرة.", obligatory: true },
      { key: "faraid_kafara_ramadan", title: "كفارة الإفطار العمد في رمضان", desc: "الترتيب: عتق رقبة، أو صيام شهرين متتابعين، أو إطعام ستين مسكيناً.", obligatory: true, order: ["عتق رقبة", "صيام شهرين متتابعين", "إطعام 60 مسكيناً"] },
      { key: "faraid_nafl", title: "التطوع والنوافل لجبر الفرائض", desc: "أكثر من النوافل، فقد ورد أن النوافل تجبر نقص الفرائض يوم القيامة.", obligatory: false },
    ],
  },
  other: {
    title: "كفارة الذنوب الأخرى",
    intro: "الذنوب الواقعة بينك وبين الله لها طريق واحد: التوبة النصوح الصادقة مع الإكثار من الأعمال الصالحة.",
    steps: [
      { key: "other_tawba", title: "أركان التوبة النصوح الثلاثة", desc: "الإقلاع عن الذنب فوراً، الندم القلبي الحقيقي، العزم الصادق على عدم العودة.", obligatory: true },
      { key: "other_salat", title: "صلاة التوبة", desc: "صلِّ ركعتين بخشوع ودموع، وناجِ الله بما في قلبك.", obligatory: true },
      { key: "other_istighfar", title: "الاستغفار الكثير", desc: "قل: «أستغفر الله وأتوب إليه» مئة مرة يومياً على الأقل.", obligatory: true },
      { key: "other_hasanat", title: "اتباع السيئة بالحسنة", desc: "قال تعالى: «إِنَّ الْحَسَنَاتِ يُذْهِبْنَ السَّيِّئَاتِ» - أكثر من الأعمال الصالحة.", obligatory: false },
      { key: "other_sadaqa", title: "الصدقة", desc: "تصدّق بما تيسّر، فالصدقة تطفئ الخطيئة كما يطفئ الماء النار.", obligatory: false },
      { key: "other_kafara_yamin", title: "كفارة اليمين إن كان ثمة يمين", desc: "أطعم عشرة مساكين أو اكسُهم، فإن لم تستطع فصم ثلاثة أيام.", obligatory: false },
    ],
  },
};

export default function Kaffarah() {
  const { data: progress } = useAppUserProgress();
  const sinCategory = (progress?.sinCategory || "other") as SinCategory;
  const kaffarah = KAFFARAH_DATA[sinCategory];

  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = getSessionId();
    fetch(`/api/kaffarah?sessionId=${encodeURIComponent(sessionId)}`)
      .then((r) => r.json())
      .then((data: { stepKey: string; completed: boolean }[]) => {
        const map: Record<string, boolean> = {};
        data.forEach((s) => { map[s.stepKey] = s.completed; });
        setCompletedSteps(map);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleStep = async (stepKey: string, current: boolean) => {
    const sessionId = getSessionId();
    const newVal = !current;
    setCompletedSteps((prev) => ({ ...prev, [stepKey]: newVal }));
    await fetch("/api/kaffarah/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, stepKey, completed: newVal }),
    });
  };

  const obligatorySteps = kaffarah.steps.filter((s) => s.obligatory);
  const recommendedSteps = kaffarah.steps.filter((s) => !s.obligatory);
  const completedObl = obligatorySteps.filter((s) => completedSteps[s.key]).length;
  const progressPct = obligatorySteps.length > 0 ? Math.round((completedObl / obligatorySteps.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 pb-8 px-5 pt-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-display font-bold mb-2">{kaffarah.title}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">{kaffarah.intro}</p>

        {kaffarah.warning && (
          <div className="mt-3 flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-xl p-3">
            <AlertTriangle size={16} className="text-destructive mt-0.5 shrink-0" />
            <p className="text-xs text-destructive leading-relaxed">{kaffarah.warning}</p>
          </div>
        )}

        <div className="mt-4 bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold">الواجبات المكتملة</span>
            <span className="text-sm font-bold text-primary">{completedObl}/{obligatorySteps.length}</span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-primary rounded-full"
            />
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-destructive" />
          <h2 className="text-sm font-bold text-foreground">الواجبات (لا تسقط)</h2>
        </div>

        {obligatorySteps.map((step, i) => {
          const done = !!completedSteps[step.key];
          const expanded = expandedStep === step.key;
          return (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`bg-card rounded-xl border transition-all ${done ? "border-primary/30 bg-primary/5" : "border-border"}`}
            >
              <div className="flex items-center gap-3 p-4">
                <button
                  onClick={() => toggleStep(step.key, done)}
                  className="shrink-0 w-7 h-7 flex items-center justify-center"
                >
                  {done
                    ? <CheckCircle2 size={26} className="text-primary" />
                    : <Circle size={26} className="text-muted-foreground/40" />
                  }
                </button>
                <div className="flex-1 text-right">
                  <p className={`font-bold text-sm ${done ? "line-through text-muted-foreground" : ""}`}>{step.title}</p>
                  {step.order && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">بالترتيب: {step.order.join(" ← ")}</p>
                  )}
                </div>
                <button onClick={() => setExpandedStep(expanded ? null : step.key)} className="shrink-0 text-muted-foreground">
                  {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>
              {expanded && (
                <div className="px-4 pb-4 pt-0">
                  <div className="flex items-start gap-2 bg-muted/50 rounded-lg p-3">
                    <Info size={14} className="text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}

        {recommendedSteps.length > 0 && (
          <>
            <div className="flex items-center gap-2 mt-4 mb-1">
              <div className="w-2 h-2 rounded-full bg-secondary" />
              <h2 className="text-sm font-bold text-foreground">المستحبات (تزيد الأجر)</h2>
            </div>

            {recommendedSteps.map((step, i) => {
              const done = !!completedSteps[step.key];
              const expanded = expandedStep === step.key;
              return (
                <motion.div
                  key={step.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (obligatorySteps.length + i) * 0.07 }}
                  className={`bg-card rounded-xl border transition-all ${done ? "border-secondary/30 bg-secondary/5" : "border-border border-dashed"}`}
                >
                  <div className="flex items-center gap-3 p-4">
                    <button
                      onClick={() => toggleStep(step.key, done)}
                      className="shrink-0 w-7 h-7 flex items-center justify-center"
                    >
                      {done
                        ? <CheckCircle2 size={26} className="text-secondary" />
                        : <Circle size={26} className="text-muted-foreground/30" />
                      }
                    </button>
                    <div className="flex-1 text-right">
                      <p className={`font-bold text-sm ${done ? "line-through text-muted-foreground" : ""}`}>{step.title}</p>
                    </div>
                    <button onClick={() => setExpandedStep(expanded ? null : step.key)} className="shrink-0 text-muted-foreground">
                      {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                  {expanded && (
                    <div className="px-4 pb-4 pt-0">
                      <div className="flex items-start gap-2 bg-muted/50 rounded-lg p-3">
                        <Info size={14} className="text-muted-foreground mt-0.5 shrink-0" />
                        <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
