import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowLeft, ChevronDown, AlertTriangle, CheckCircle2,
  BookOpen, Scale, Info, Plus, Check, X,
} from "lucide-react";
import {
  SINS, CATEGORY_META, SIN_CATEGORY_ORDER,
  getSelectedSins, saveSelectedSins,
  type Sin, type SinCategory,
} from "@/lib/sins-data";

type FilterType = "all" | SinCategory;

function SinDetailSheet({ sin, onClose }: { sin: Sin; onClose: () => void }) {
  const [added, setAdded] = useState(() => {
    try {
      const saved = localStorage.getItem("selected_kaffarahs");
      const arr: string[] = saved ? JSON.parse(saved) : [];
      return sin.kaffarahId ? arr.includes(sin.kaffarahId) : false;
    } catch { return false; }
  });

  const meta = CATEGORY_META[sin.category];

  const handleAddKaffarah = () => {
    if (!sin.kaffarahId) return;
    try {
      const saved = localStorage.getItem("selected_kaffarahs");
      const arr: string[] = saved ? JSON.parse(saved) : [];
      if (!arr.includes(sin.kaffarahId)) {
        arr.push(sin.kaffarahId);
        localStorage.setItem("selected_kaffarahs", JSON.stringify(arr));
      }
    } catch {}
    setAdded(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 280 }}
        className="w-full max-w-md bg-card rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm pt-3 pb-3 px-5 border-b border-border/50 z-10">
          <div className="flex justify-center mb-3">
            <div className="w-10 h-1 bg-muted-foreground/20 rounded-full" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{sin.icon}</span>
            <div className="flex-1">
              <h2 className="font-bold text-base">{sin.name}</h2>
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.bg} ${meta.borderColor} ${meta.color}`}>
                {meta.label}
              </span>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{sin.desc}</p>

          <div className="bg-muted/40 rounded-xl p-3.5 border border-border/50">
            <div className="flex items-start gap-2">
              <BookOpen size={13} className="text-primary mt-0.5 shrink-0" />
              <p className="text-[11px] text-muted-foreground leading-relaxed italic">{sin.daleel}</p>
            </div>
          </div>

          {sin.warning && (
            <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-xl p-3.5">
              <AlertTriangle size={14} className="text-destructive mt-0.5 shrink-0" />
              <p className="text-xs text-destructive leading-relaxed">{sin.warning}</p>
            </div>
          )}

          {sin.note && (
            <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-400/20 rounded-xl p-3.5">
              <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">{sin.note}</p>
            </div>
          )}

          <div>
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
              <CheckCircle2 size={15} className="text-primary" />
              شروط التوبة والإصلاح
            </h3>
            <div className="flex flex-col gap-2">
              {sin.conditions.map((cond, i) => (
                <div key={i} className="flex items-start gap-2.5 bg-primary/5 border border-primary/15 rounded-lg px-3 py-2.5">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-xs leading-relaxed">{cond}</p>
                </div>
              ))}
            </div>
          </div>

          {sin.kaffarahId && (
            <div className="bg-gradient-to-l from-red-500/10 to-orange-500/5 border border-red-400/30 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Scale size={15} className="text-red-500" />
                <h3 className="font-bold text-sm text-red-600 dark:text-red-400">{sin.kaffarahLabel}</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                هذا الذنب له كفارة شرعية محددة. يمكنك إضافتها لخطتك ومتابعة تنفيذها.
              </p>
              {added ? (
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-400/30 rounded-xl p-3 text-emerald-600 dark:text-emerald-400">
                  <Check size={16} />
                  <span className="text-sm font-bold">أُضيفت للخطة</span>
                  <Link href="/kaffarah" className="mr-auto text-xs underline underline-offset-2" onClick={onClose}>
                    انتقل للخطة ←
                  </Link>
                </div>
              ) : (
                <button
                  onClick={handleAddKaffarah}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold active:scale-95 transition-all shadow-md shadow-red-500/20"
                >
                  <Plus size={16} />
                  أضف الكفارة لخطتي
                </button>
              )}
            </div>
          )}

          <div className="h-4" />
        </div>
      </motion.div>
    </motion.div>
  );
}

function SinCard({ sin, onClick }: { sin: Sin; onClick: () => void }) {
  const meta = CATEGORY_META[sin.category];
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="w-full flex items-center gap-3.5 bg-card border border-border rounded-xl px-4 py-3.5 text-right active:scale-[0.98] transition-all hover:shadow-sm"
    >
      <span className="text-2xl shrink-0">{sin.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate">{sin.name}</p>
        <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border mt-1 ${meta.bg} ${meta.color} ${meta.borderColor}`}>
          {meta.label}
        </span>
      </div>
      {sin.kaffarahId && <Scale size={13} className="text-red-400 shrink-0" />}
      <ChevronDown size={15} className="text-muted-foreground shrink-0 -rotate-90" />
    </motion.button>
  );
}

export default function SinsList() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedSin, setSelectedSin] = useState<Sin | null>(null);

  const filtered = filter === "all" ? SINS : SINS.filter(s => s.category === filter);

  const counts: Record<FilterType, number> = {
    all: SINS.length,
    with_kaffarah: SINS.filter(s => s.category === "with_kaffarah").length,
    major: SINS.filter(s => s.category === "major").length,
    huquq_ibad: SINS.filter(s => s.category === "huquq_ibad").length,
    common: SINS.filter(s => s.category === "common").length,
  };

  const filterBtns: { key: FilterType; label: string }[] = [
    { key: "all", label: "الكل" },
    { key: "with_kaffarah", label: "لها كفارة" },
    { key: "major", label: "كبائر" },
    { key: "huquq_ibad", label: "حقوق العباد" },
    { key: "common", label: "شائعة" },
  ];

  return (
    <div className="flex flex-col flex-1 pb-8">
      <div className="flex items-center gap-3 px-5 pt-4 mb-1">
        <Link href="/" className="p-2 -ml-2 rounded-xl hover:bg-muted/50 text-muted-foreground">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-display font-bold">قائمة الذنوب الذكية</h1>
          <p className="text-xs text-muted-foreground">اعرف ذنبك وشروط توبته</p>
        </div>
      </div>

      <div className="mx-5 mt-3 mb-4 bg-amber-500/10 border border-amber-400/20 rounded-xl px-4 py-3 flex items-start gap-2">
        <Info size={14} className="text-amber-500 mt-0.5 shrink-0" />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          اضغط على أي ذنب لتعرف شروط التوبة منه. الذنوب ذات الكفارة تُضاف مباشرة لخطتك.
        </p>
      </div>

      <div className="px-5 mb-4 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {filterBtns.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                filter === f.key
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-muted-foreground border-border"
              }`}
            >
              {f.label}
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${filter === f.key ? "bg-white/20" : "bg-muted"}`}>
                {counts[f.key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {filtered.map((sin, i) => (
            <motion.div
              key={sin.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.03 }}
            >
              <SinCard sin={sin} onClick={() => setSelectedSin(sin)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedSin && (
          <SinDetailSheet sin={selectedSin} onClose={() => setSelectedSin(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
