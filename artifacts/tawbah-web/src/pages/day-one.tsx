import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Check, ArrowLeft, ShieldCheck } from "lucide-react";
import { useAppUpdateProgress } from "@/hooks/use-app-data";

const TASKS = [
  { id: 0, label: "توضأ الآن", desc: "قم فتوضأ وضوءاً تحسن فيه غسل ذنوبك." },
  { id: 1, label: "صلِّ ركعتين", desc: "صل ركعتين بنية التوبة الخالصة لله." },
  { id: 2, label: "احذف وتخلص", desc: "احذف أي تطبيق، ملف، أو رقم يقودك للذنب." },
  { id: 3, label: "غيّر بيئتك", desc: "اخرج من المكان الذي اعتدت عصيان الله فيه." },
];

export default function DayOne() {
  const [, setLocation] = useLocation();
  const [checked, setChecked] = useState<boolean[]>([false, false, false, false]);
  const updateProgress = useAppUpdateProgress();

  const toggleTask = (index: number) => {
    const newChecked = [...checked];
    newChecked[index] = !newChecked[index];
    setChecked(newChecked);
  };

  const allDone = checked.every(Boolean);

  const handleComplete = () => {
    if (!allDone) return;
    updateProgress.mutate({ firstDayTasksCompleted: true }, {
      onSuccess: () => {
        setLocation("/plan");
      }
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-background p-6">
      <div className="mb-8 mt-4">
        <div className="inline-flex items-center justify-center p-3 bg-accent/15 text-accent rounded-2xl mb-4">
          <ShieldCheck size={32} />
        </div>
        <h1 className="text-3xl font-display font-bold text-foreground mb-3">مهام اللحظة الأولى</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          الصدق يظهر في البدايات. لا تؤجل هذه الخطوات، قم بها الآن لتبدأ صفحة جديدة نقية.
        </p>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        {TASKS.map((task, i) => {
          const isDone = checked[i];
          return (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15 }}
              key={task.id}
              onClick={() => toggleTask(i)}
              className={`relative overflow-hidden p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer flex items-center ${
                isDone 
                  ? "bg-primary/5 border-primary shadow-sm" 
                  : "bg-card border-border hover:border-primary/30"
              }`}
            >
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ml-4 shrink-0 transition-colors duration-300 ${
                isDone ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"
              }`}>
                <Check size={18} strokeWidth={isDone ? 3 : 2} className={isDone ? "opacity-100" : "opacity-0"} />
              </div>
              <div>
                <h3 className={`font-bold text-base transition-colors ${isDone ? "text-primary" : "text-foreground"}`}>
                  {task.label}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{task.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-8 pt-6">
        <button
          onClick={handleComplete}
          disabled={!allDone || updateProgress.isPending}
          className="w-full py-4 rounded-xl font-bold text-base bg-primary text-primary-foreground shadow-lg disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground hover:-translate-y-0.5 transition-all duration-300 active:translate-y-0 flex items-center justify-center gap-2"
        >
          <span>انطلق في رحلة الـ 40 يوماً</span>
          <ArrowLeft size={18} />
        </button>
      </div>
    </div>
  );
}
