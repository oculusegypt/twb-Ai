import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Check, Shield } from "lucide-react";
import { useAppCreateCovenant } from "@/hooks/use-app-data";
import type { CreateCovenantRequestSinCategory } from "@workspace/api-client-react";

const CATEGORIES: { id: CreateCovenantRequestSinCategory; label: string; desc: string }[] = [
  { id: "khilwat", label: "ذنب الخلوات والنظر", desc: "ذنوب السر والتعلق بالمحرمات البصرية" },
  { id: "mali", label: "ذنب مالي", desc: "كسب محرم، رشوة، أو تقصير في أداء الحقوق المالية" },
  { id: "huquq_nas", label: "حقوق العباد", desc: "غيبة، نميمة، ظلم، أو إيذاء للآخرين" },
  { id: "taqsir_faraid", label: "تقصير في الفرائض", desc: "ترك الصلاة، التهاون في الصيام أو الزكاة" },
  { id: "other", label: "أخرى", desc: "ذنب آخر بينك وبين الله" },
];

export default function Covenant() {
  const [, setLocation] = useLocation();
  const [selected, setSelected] = useState<CreateCovenantRequestSinCategory | null>(null);
  
  const createCovenant = useAppCreateCovenant();

  const handleSign = () => {
    if (!selected) return;
    createCovenant.mutate({ sinCategory: selected }, {
      onSuccess: () => {
        setLocation("/day-one");
      }
    });
  };

  return (
    <div className="flex-1 flex flex-col p-6 bg-background">
      <div className="mb-8 mt-4 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
          <Shield size={32} />
        </div>
        <h1 className="text-3xl font-display font-bold text-foreground mb-3">المعاهدة مع الله</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          اختر المجال الذي تريد التوبة منه. لست بحاجة لكشف التفاصيل، فالله يعلم السر وأخفى، وهذا التصنيف ليساعدنا في توجيهك.
        </p>
      </div>

      <div className="flex-1 flex flex-col gap-3">
        {CATEGORIES.map((cat, i) => {
          const isSelected = selected === cat.id;
          return (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={cat.id}
              onClick={() => setSelected(cat.id)}
              className={`relative flex items-center p-4 rounded-xl border text-right transition-all duration-300 ${
                isSelected 
                  ? "bg-primary/5 border-primary shadow-sm ring-1 ring-primary/20" 
                  : "bg-card border-border hover:border-primary/40"
              }`}
            >
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center ml-4 shrink-0 transition-colors ${
                isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"
              }`}>
                {isSelected && <Check size={14} strokeWidth={3} />}
              </div>
              <div>
                <h3 className={`font-bold text-sm mb-1 transition-colors ${isSelected ? "text-primary" : "text-foreground"}`}>
                  {cat.label}
                </h3>
                <p className="text-xs text-muted-foreground">{cat.desc}</p>
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-8 pt-6 border-t border-border">
        <button
          onClick={handleSign}
          disabled={!selected || createCovenant.isPending}
          className="w-full py-4 rounded-xl font-bold text-base bg-primary text-primary-foreground shadow-lg shadow-primary/25 disabled:opacity-50 disabled:shadow-none hover:shadow-xl transition-all duration-300 active:scale-[0.98] flex items-center justify-center"
        >
          {createCovenant.isPending ? "جاري التوثيق..." : "أعاهد الله الآن على التوبة النصوح"}
        </button>
      </div>
    </div>
  );
}
