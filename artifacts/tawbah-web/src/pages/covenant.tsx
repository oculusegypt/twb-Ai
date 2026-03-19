import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Shield, ArrowLeft, ChevronLeft, AlertTriangle, Info } from "lucide-react";
import { useAppCreateCovenant } from "@/hooks/use-app-data";
import { recordEvent } from "@/components/live-stats";
import {
  SINS, CATEGORY_META, SIN_CATEGORY_ORDER,
  saveSelectedSins, getPrimaryApiCategory,
  type Sin,
} from "@/lib/sins-data";

type Step = "select" | "review";

function SinGroupSection({
  sin, selected, onToggle,
}: { sin: Sin; selected: boolean; onToggle: () => void }) {
  const meta = CATEGORY_META[sin.category];
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-right transition-all duration-200 ${
        selected
          ? `${meta.bg} ${meta.borderColor} ring-1 ring-inset ${meta.borderColor}`
          : "bg-card border-border hover:border-border/80"
      }`}
    >
      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
        selected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"
      }`}>
        {selected && <Check size={13} strokeWidth={3} />}
      </div>
      <span className="text-xl shrink-0">{sin.icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-sm ${selected ? meta.color : "text-foreground"}`}>{sin.name}</p>
        {sin.kaffarahId && (
          <p className="text-[10px] text-red-500 mt-0.5 flex items-center gap-1">
            <AlertTriangle size={9} />
            يستلزم كفارة شرعية
          </p>
        )}
      </div>
    </button>
  );
}

export default function Covenant() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<Step>("select");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const createCovenant = useAppCreateCovenant();

  useEffect(() => {
    try {
      const saved = localStorage.getItem("selected_sins");
      if (saved) {
        const ids: string[] = JSON.parse(saved);
        setSelectedIds(new Set(ids));
      }
    } catch {}
  }, []);

  const toggleSin = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedSins = SINS.filter(s => selectedIds.has(s.id));
  const hasKaffarah = selectedSins.some(s => s.kaffarahId);
  const canProceed = selectedIds.size > 0;

  const handleSign = () => {
    const primaryCategory = getPrimaryApiCategory(selectedSins);
    saveSelectedSins(selectedSins);
    createCovenant.mutate({ sinCategory: primaryCategory }, {
      onSuccess: () => {
        recordEvent("covenant");
        setLocation("/day-one");
      }
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      <AnimatePresence mode="wait">
        {step === "select" ? (
          <motion.div
            key="select"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="flex-1 flex flex-col"
          >
            <div className="px-5 pt-6 pb-4">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 text-primary">
                <Shield size={28} />
              </div>
              <h1 className="text-2xl font-display font-bold mb-2">حدّد ذنبك</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                اختر الذنب أو الذنوب التي تريد التوبة منها. الله يعلم السر وأخفى — هذا التحديد ليبني خطتك الشخصية.
              </p>
            </div>

            <div className="mx-5 mb-4 flex items-center gap-2 bg-blue-500/10 border border-blue-400/20 rounded-xl px-3.5 py-2.5">
              <Info size={13} className="text-blue-500 shrink-0" />
              <p className="text-[11px] text-blue-600 dark:text-blue-400">
                يمكنك اختيار أكثر من ذنب. ستُبنى خطتك بناءً على اختيارك.
              </p>
            </div>

            <div className="flex-1 px-5 pb-6 overflow-y-auto flex flex-col gap-5">
              {SIN_CATEGORY_ORDER.map(cat => {
                const sinsInCat = SINS.filter(s => s.category === cat);
                const meta = CATEGORY_META[cat];
                return (
                  <div key={cat}>
                    <p className={`text-xs font-bold mb-2.5 ${meta.color}`}>{meta.groupLabel}</p>
                    <div className="flex flex-col gap-2">
                      {sinsInCat.map(sin => (
                        <SinGroupSection
                          key={sin.id}
                          sin={sin}
                          selected={selectedIds.has(sin.id)}
                          onToggle={() => toggleSin(sin.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-5 pb-6 pt-3 border-t border-border bg-background">
              {selectedIds.size > 0 && (
                <p className="text-center text-xs text-muted-foreground mb-3">
                  تم اختيار <span className="font-bold text-primary">{selectedIds.size}</span> {selectedIds.size === 1 ? "ذنب" : "ذنوب"}
                </p>
              )}
              <button
                onClick={() => setStep("review")}
                disabled={!canProceed}
                className="w-full py-4 rounded-xl font-bold text-base bg-primary text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-40 disabled:shadow-none active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                التالي — مراجعة وتوقيع
                <ChevronLeft size={18} />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="flex-1 flex flex-col"
          >
            <div className="px-5 pt-6 pb-4">
              <button
                onClick={() => setStep("select")}
                className="flex items-center gap-1.5 text-sm text-muted-foreground mb-5 hover:text-foreground transition-colors"
              >
                <ArrowLeft size={16} />
                تعديل الاختيار
              </button>
              <h1 className="text-2xl font-display font-bold mb-2">المعاهدة مع الله</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                راجع ذنوبك المختارة، ثم أعاهد الله على التوبة الصادقة.
              </p>
            </div>

            <div className="px-5 flex flex-col gap-3 flex-1 overflow-y-auto pb-6">
              <div className="bg-card border border-border rounded-2xl p-4">
                <p className="text-xs font-bold text-muted-foreground mb-3">ذنوبك المختارة:</p>
                <div className="flex flex-col gap-2">
                  {selectedSins.map(sin => {
                    const meta = CATEGORY_META[sin.category];
                    return (
                      <div key={sin.id} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg ${meta.bg} border ${meta.borderColor}`}>
                        <span className="text-lg">{sin.icon}</span>
                        <div className="flex-1">
                          <p className={`text-sm font-bold ${meta.color}`}>{sin.name}</p>
                          <p className="text-[10px] text-muted-foreground">{meta.label}</p>
                        </div>
                        {sin.kaffarahId && (
                          <AlertTriangle size={13} className="text-red-500 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {hasKaffarah && (
                <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-400/30 rounded-xl px-4 py-3">
                  <AlertTriangle size={15} className="text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-red-600 dark:text-red-400 mb-1">تنبيه: ذنوب تستلزم كفارة</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      ستجد خطة الكفارة الشرعية جاهزة في صفحة الكفارات بعد التوقيع مباشرة.
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 text-center">
                <p className="text-sm leading-loose">
                  «أعاهد الله تعالى على التوبة النصوح،<br />
                  والإقلاع عن هذه الذنوب فوراً،<br />
                  والندم عليها من أعماق قلبي،<br />
                  والعزم الصادق على عدم العودة إليها أبداً.»<br />
                  <span className="text-muted-foreground text-xs">بسم الله أبدأ رحلتي</span>
                </p>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-emerald-500/10 border border-emerald-400/30 rounded-xl px-4 py-3"
              >
                <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed text-center">
                  «قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا»
                  <span className="block text-muted-foreground text-[10px] mt-1">الزمر 53</span>
                </p>
              </motion.div>
            </div>

            <div className="px-5 pb-6 pt-3 border-t border-border bg-background">
              <button
                onClick={handleSign}
                disabled={createCovenant.isPending}
                className="w-full py-4 rounded-xl font-bold text-base bg-primary text-primary-foreground shadow-lg shadow-primary/25 disabled:opacity-50 active:scale-[0.98] transition-all"
              >
                {createCovenant.isPending ? "جاري التوثيق..." : "أعاهد الله الآن على التوبة النصوح"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
