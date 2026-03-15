import { Link } from "wouter";
import { ArrowLeft, CheckCircle2, Heart, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { useAppUserProgress } from "@/hooks/use-app-data";

export default function Home() {
  const { data: progress, isLoading } = useAppUserProgress();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const hasCovenant = progress?.covenantSigned;
  const dayOneDone = progress?.firstDayTasksCompleted;

  return (
    <div className="flex flex-col flex-1 pb-8">
      <div className="relative h-[240px] w-full rounded-b-[2rem] overflow-hidden shadow-lg">
        <img 
          src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
          alt="Islamic Pattern"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-primary/40 mix-blend-multiply" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center text-primary-foreground p-6 text-center">
          <h1 className="text-3xl font-display font-bold mb-2 tracking-wide text-white drop-shadow-md">
            دليل التوبة النصوح
          </h1>
          <p className="text-sm font-medium text-white/90 max-w-[280px] leading-relaxed drop-shadow">
            "قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَى أَنْفُسِهِمْ لَا تَقْنَطُوا مِنْ رَحْمَةِ اللَّهِ"
          </p>
        </div>
      </div>

      <div className="px-5 -mt-6 relative z-10 flex flex-col gap-5">
        
        {/* Main Action Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-6 shadow-xl shadow-black/5 border border-border"
        >
          {!hasCovenant ? (
            <div className="text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                <Heart size={32} />
              </div>
              <h2 className="text-xl font-bold mb-2">رحلة العودة إلى الله</h2>
              <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                التوبة هي بداية جديدة، صفحة بيضاء بينك وبين ربك. هل أنت مستعد لاتخاذ القرار؟
              </p>
              <Link 
                href="/covenant"
                className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-bold text-base hover:opacity-90 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>ابدأ رحلة التوبة الآن</span>
                <ArrowLeft size={18} />
              </Link>
            </div>
          ) : !dayOneDone ? (
            <div className="text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-accent/20 text-accent rounded-full flex items-center justify-center mb-4">
                <Activity size={32} />
              </div>
              <h2 className="text-xl font-bold mb-2">لقد عاهدت الله</h2>
              <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                بقيت خطوات بسيطة لتأكيد صدق نيتك وبدء صفحة جديدة تماماً.
              </p>
              <Link 
                href="/day-one"
                className="w-full py-3.5 bg-accent text-accent-foreground rounded-xl font-bold text-base hover:opacity-90 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>أكمل مهام اللحظة الأولى</span>
                <CheckCircle2 size={18} />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">خطة الـ 40 يوماً</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    أنت في اليوم <span className="text-primary font-bold">{progress.day40Progress || 1}</span>
                  </p>
                </div>
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <span className="text-xl font-bold">{progress.streakDays || 0}</span>
                  <span className="text-[10px] ml-0.5">يوم</span>
                </div>
              </div>
              
              <Link 
                href="/plan"
                className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-bold text-base hover:opacity-90 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>متابعة مهام اليوم</span>
                <ArrowLeft size={18} />
              </Link>
            </div>
          )}
        </motion.div>

        {/* Secondary Navigation Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/dhikr" className="bg-card p-5 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow active:scale-[0.98] flex flex-col items-center justify-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
              <CircleDot size={24} />
            </div>
            <h3 className="font-bold text-sm">مسبحة الذكر</h3>
          </Link>
          <Link href="/signs" className="bg-card p-5 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow active:scale-[0.98] flex flex-col items-center justify-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <HeartHandshake size={24} />
            </div>
            <h3 className="font-bold text-sm">تباشير القبول</h3>
          </Link>
        </div>

        {/* Relapse Card */}
        <Link href="/relapse" className="bg-card p-5 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow active:scale-[0.98] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-foreground">ضعفت وعدت للذنب؟</h3>
            <p className="text-xs text-muted-foreground mt-1">لا تيأس، اقرأ هذا فوراً</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground">
            <ArrowLeft size={20} />
          </div>
        </Link>
      </div>
    </div>
  );
}
