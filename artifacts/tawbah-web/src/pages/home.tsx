import { Link } from "wouter";
import { ArrowLeft, CheckCircle2, Heart, Activity, CircleDot, HeartHandshake, BookOpen, PenLine, ScrollText, Clock, BarChart2, Sparkles, ListChecks, ImageIcon, Swords, Globe, Users, CalendarDays, Bell, HandHeart } from "lucide-react";
import { motion } from "framer-motion";
import { useAppUserProgress } from "@/hooks/use-app-data";
import { LiveStats } from "@/components/live-stats";

function getIslamicSeason(): { label: string; desc: string; color: string } | null {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  if (month === 3 && day >= 15 && day <= 31) return { label: "آخر رمضان قادم", desc: "استعد لليالي المباركة - حسّن توبتك الآن", color: "from-emerald-500/20 to-teal-500/10" };
  if (month === 6 && day >= 1 && day <= 10) return { label: "العشر من ذي الحجة", desc: "أفضل أيام السنة - أعمالك الصالحة مضاعفة", color: "from-amber-500/20 to-yellow-500/10" };
  if (month === 7 && day === 9) return { label: "يوم عرفة", desc: "يوم تكفير الذنوب - أكثر من الدعاء والاستغفار", color: "from-primary/20 to-primary/5" };
  if (month === 8 && day >= 1 && day <= 15) return { label: "شعبان - شهر رفع الأعمال", desc: "قبل رمضان: صفحة بيضاء لأعمالك", color: "from-purple-500/20 to-violet-500/10" };
  return null;
}

export default function Home() {
  const { data: progress, isLoading } = useAppUserProgress();
  const season = getIslamicSeason();

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
          <img
            src={`${import.meta.env.BASE_URL}images/logo.png`}
            alt="توبة نصوحة"
            className="h-24 w-24 object-cover rounded-full drop-shadow-xl mb-2 ring-4 ring-white/30"
          />
          <p className="text-sm font-medium text-white/90 max-w-[280px] leading-relaxed drop-shadow">
            "قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَى أَنْفُسِهِمْ لَا تَقْنَطُوا مِنْ رَحْمَةِ اللَّهِ"
          </p>
        </div>
      </div>

      <div className="px-5 -mt-6 relative z-10 flex flex-col gap-4">

        {season && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-gradient-to-r ${season.color} rounded-2xl p-4 border border-white/10 shadow-sm`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={16} className="text-primary" />
              <span className="font-bold text-sm text-primary">{season.label}</span>
            </div>
            <p className="text-xs text-muted-foreground">{season.desc}</p>
          </motion.div>
        )}

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

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <Link
            href="/card"
            className="flex items-center gap-4 bg-gradient-to-l from-amber-500/10 to-primary/10 border border-amber-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md shrink-0">
              <ImageIcon size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm">بطاقة توبتي</h3>
              <p className="text-[11px] text-muted-foreground">اصنع بطاقة جميلة وشاركها مع الناس</p>
            </div>
            <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.175 }}
        >
          <Link
            href="/challenge/create"
            className="flex items-center gap-4 bg-gradient-to-l from-emerald-500/10 to-primary/10 border border-emerald-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-md shrink-0">
              <Swords size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm">تحدي التوبة</h3>
              <p className="text-[11px] text-muted-foreground">ابدأ تحدياً وشارك رابطه — ليدعو لك الناس</p>
            </div>
            <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.18 }}
        >
          <Link
            href="/map"
            className="flex items-center gap-4 bg-gradient-to-l from-blue-500/10 to-primary/10 border border-blue-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md shrink-0">
              <Globe size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm">خريطة التوبة العالمية</h3>
              <p className="text-[11px] text-muted-foreground">من أي دول يتوب المسلمون الآن؟</p>
            </div>
            <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.19 }}
        >
          <Link
            href="/journey"
            className="flex items-center gap-4 bg-gradient-to-l from-violet-500/10 to-primary/10 border border-violet-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-md shrink-0">
              <CalendarDays size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm">رحلة ٣٠ يوماً</h3>
              <p className="text-[11px] text-muted-foreground">برنامج تدريجي يومي للتوبة والاستقامة</p>
            </div>
            <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.195 }}
        >
          <Link
            href="/dhikr-rooms"
            className="flex items-center gap-4 bg-gradient-to-l from-teal-500/10 to-primary/10 border border-teal-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-md shrink-0">
              <Users size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm">غرف الذكر الجماعي</h3>
              <p className="text-[11px] text-muted-foreground">سبّح مع آلاف المسلمين الآن</p>
            </div>
            <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.197 }}
        >
          <Link
            href="/ameen"
            className="flex items-center gap-4 bg-gradient-to-l from-rose-500/10 to-pink-500/5 border border-rose-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-md shrink-0">
              <HandHeart size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm">قل آمين 🤲</h3>
              <p className="text-[11px] text-muted-foreground">ادعُ لأخٍ مجهول — وقل آمين لدعائه</p>
            </div>
            <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.185 }}
        >
          <LiveStats />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-xs font-bold text-muted-foreground mb-3 px-1">الأدوات الروحية</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/kaffarah" className="bg-card p-4 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex flex-col gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
                <ScrollText size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">الكفارات الشرعية</h3>
                <p className="text-[11px] text-muted-foreground">خطوات مفصّلة لكل ذنب</p>
              </div>
            </Link>
            <Link href="/rajaa" className="bg-card p-4 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex flex-col gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <BookOpen size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">مكتبة الرجاء</h3>
                <p className="text-[11px] text-muted-foreground">آيات وأحاديث وقصص</p>
              </div>
            </Link>
            <Link href="/dhikr" className="bg-card p-4 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex flex-col gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                <CircleDot size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">مسبحة الذكر</h3>
                <p className="text-[11px] text-muted-foreground">استغفار وتسبيح</p>
              </div>
            </Link>
            <Link href="/signs" className="bg-card p-4 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex flex-col gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center">
                <HeartHandshake size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">تباشير القبول</h3>
                <p className="text-[11px] text-muted-foreground">علامات قبول التوبة</p>
              </div>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-xs font-bold text-muted-foreground mb-3 px-1">أدوات شخصية</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/journal" className="bg-card p-4 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex flex-col gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
                <PenLine size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">يوميات التوبة</h3>
                <p className="text-[11px] text-muted-foreground">مساحة سرية خاصة بك</p>
              </div>
            </Link>
            <Link href="/progress" className="bg-card p-4 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex flex-col gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <BarChart2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">خريطة التقدم</h3>
                <p className="text-[11px] text-muted-foreground">إحصاءاتك الروحية</p>
              </div>
            </Link>
            <Link href="/danger-times" className="bg-card p-4 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex flex-col gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                <Clock size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">أوقات الخطر</h3>
                <p className="text-[11px] text-muted-foreground">تذكيرات وقائية ذكية</p>
              </div>
            </Link>
            <Link href="/relapse" className="bg-card p-4 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex flex-col gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <Heart size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">ضعفت وعدت؟</h3>
                <p className="text-[11px] text-muted-foreground">اقرأ هذا فوراً</p>
              </div>
            </Link>
            <Link href="/hadi-tasks" className="bg-card p-4 rounded-2xl border border-emerald-300/40 shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex flex-col gap-2.5 col-span-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <ListChecks size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">مهام هادي</h3>
                  <p className="text-[11px] text-muted-foreground">نصائح الزكي تتحول لمهام تتابعها خطوة بخطوة</p>
                </div>
              </div>
            </Link>
            <Link href="/secret-dua" className="bg-card p-4 rounded-2xl border border-rose-300/40 shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex flex-col gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <Heart size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">الصديق السري</h3>
                <p className="text-[11px] text-muted-foreground">ادعُ لأخٍ مجهول بلا أسماء</p>
              </div>
            </Link>
            <Link href="/prayer-times" className="bg-card p-4 rounded-2xl border border-indigo-300/40 shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex flex-col gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <Bell size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">مواقيت الصلاة</h3>
                <p className="text-[11px] text-muted-foreground">تذكيرات ذكية قبل كل صلاة</p>
              </div>
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
