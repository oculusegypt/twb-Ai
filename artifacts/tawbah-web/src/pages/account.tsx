import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  User2, Settings2, Moon, Sun, Languages, Volume2, BookOpen,
  ChevronDown, Check, BarChart2, Calendar, Clock, Heart,
  ScrollText, PenLine, Bell, ChevronLeft, LogOut, Shield,
} from "lucide-react";
import { useSettings, QURAN_RECITERS } from "@/context/SettingsContext";
import { useAppUserProgress } from "@/hooks/use-app-data";
import { cn } from "@/lib/utils";
import { AnimatePresence } from "framer-motion";

function Toggle({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none",
        checked ? "bg-primary" : "bg-muted-foreground/30"
      )}
      aria-checked={checked}
      role="switch"
    >
      <span
        className={cn(
          "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300",
          checked ? "left-[26px]" : "left-0.5"
        )}
      />
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1 mt-5 mb-2">
      {children}
    </p>
  );
}

function SettingRow({
  icon,
  label,
  description,
  right,
  iconBg = "bg-primary/10",
  iconColor = "text-primary",
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  right: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-border/30 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center ${iconColor} flex-shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="flex-shrink-0">{right}</div>
    </div>
  );
}

function LinkRow({
  icon,
  label,
  description,
  href,
  iconBg = "bg-primary/10",
  iconColor = "text-primary",
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  href: string;
  iconBg?: string;
  iconColor?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 py-3.5 border-b border-border/30 last:border-0 hover:bg-muted/30 rounded-xl px-1 transition-colors group"
    >
      <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center ${iconColor} flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <ChevronLeft size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
    </Link>
  );
}

function getHijriDate() {
  try {
    return new Date().toLocaleDateString("ar-SA-u-ca-islamic", {
      day: "numeric", month: "long", year: "numeric",
    });
  } catch {
    return new Date().toLocaleDateString("ar");
  }
}

export default function Account() {
  const { lang, theme, autoPlayBotAudio, autoPlayQuran, quranReciterId,
    toggleLang, toggleTheme, setAutoPlayBotAudio, setAutoPlayQuran, setQuranReciterId } = useSettings();
  const { data: progress } = useAppUserProgress();
  const [reciterOpen, setReciterOpen] = useState(false);
  const currentReciter = QURAN_RECITERS.find(r => r.id === quranReciterId) ?? QURAN_RECITERS[0]!;

  const dayCount = progress?.day40Progress ?? 0;
  const streak = progress?.streakDays ?? 0;
  const signed = progress?.covenantSigned;
  const phase = progress?.currentPhase ?? "—";

  return (
    <div className="flex flex-col flex-1 pb-8 px-5 pt-5">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-6"
      >
        <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center mb-3">
          <User2 size={38} className="text-primary/60" />
        </div>
        <h1 className="text-lg font-bold">حسابي</h1>
        <p className="text-xs text-muted-foreground mt-0.5">{getHijriDate()}</p>
      </motion.div>

      {/* Stats Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-3 gap-3 mb-5"
      >
        <div className="bg-card border border-border rounded-2xl p-3 text-center">
          <span className="text-2xl font-bold text-primary">{dayCount}</span>
          <p className="text-[10px] text-muted-foreground mt-0.5">يوم في الخطة</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-3 text-center">
          <span className="text-2xl font-bold text-amber-500">{streak}</span>
          <p className="text-[10px] text-muted-foreground mt-0.5">يوم متواصل</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-3 text-center">
          <span className="text-2xl font-bold text-emerald-500">{signed ? "✓" : "—"}</span>
          <p className="text-[10px] text-muted-foreground mt-0.5">العهد مع الله</p>
        </div>
      </motion.div>

      {/* My Info Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="bg-card border border-border rounded-2xl px-4 mb-4"
      >
        <SectionLabel>معلوماتي</SectionLabel>
        <LinkRow href="/progress" icon={<BarChart2 size={18} />} label="خريطة التقدم" description="إحصاءاتك الروحية والمسار اليومي" />
        <LinkRow href="/plan" icon={<Calendar size={18} />} label={`خطة الـ 40 يوماً — اليوم ${dayCount}`} description={`المرحلة: ${phase}`} />
        <LinkRow href="/journal" icon={<PenLine size={18} />} label="يوميات التوبة" description="مساحتك السرية الخاصة" iconBg="bg-violet-500/10" iconColor="text-violet-500" />
        <LinkRow href="/danger-times" icon={<Clock size={18} />} label="أوقات الخطر" description="تذكيرات وقائية ذكية" iconBg="bg-orange-500/10" iconColor="text-orange-500" />
        <LinkRow href="/prayer-times" icon={<Bell size={18} />} label="مواقيت الصلاة" description="تذكيرات قبل كل صلاة" iconBg="bg-indigo-500/10" iconColor="text-indigo-500" />
        <LinkRow href="/kaffarah" icon={<ScrollText size={18} />} label="الكفارات الشرعية" description="خطوات مفصّلة لكل ذنب" iconBg="bg-destructive/10" iconColor="text-destructive" />
      </motion.div>

      {/* Settings Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-2xl px-4 mb-4"
      >
        <SectionLabel>الإعدادات</SectionLabel>

        <SettingRow
          icon={theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          label="الوضع الليلي"
          description={theme === "dark" ? "مفعّل" : "غير مفعّل"}
          right={<Toggle checked={theme === "dark"} onToggle={toggleTheme} />}
        />

        <SettingRow
          icon={<Languages size={17} />}
          label="اللغة"
          description={lang === "ar" ? "العربية" : "English"}
          iconBg="bg-blue-500/10"
          iconColor="text-blue-500"
          right={
            <button
              onClick={toggleLang}
              className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
            >
              {lang === "ar" ? "EN" : "عر"}
            </button>
          }
        />

        <SettingRow
          icon={<Volume2 size={17} />}
          label="صوت المرشد تلقائياً"
          description="يبدأ الصوت فور وصول الرد"
          iconBg="bg-teal-500/10"
          iconColor="text-teal-500"
          right={<Toggle checked={autoPlayBotAudio} onToggle={() => setAutoPlayBotAudio(!autoPlayBotAudio)} />}
        />

        <SettingRow
          icon={<BookOpen size={17} />}
          label="تشغيل الآيات تلقائياً"
          description="تُقرأ الآيات بالتسلسل مع الرد"
          iconBg="bg-emerald-500/10"
          iconColor="text-emerald-500"
          right={<Toggle checked={autoPlayQuran} onToggle={() => setAutoPlayQuran(!autoPlayQuran)} />}
        />

        {/* Reciter selector */}
        <div className="py-3.5">
          <div className="flex items-center gap-3 mb-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 flex-shrink-0">
              <BookOpen size={17} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">قارئ القرآن</p>
              <p className="text-xs text-muted-foreground">{currentReciter.nameAr}</p>
            </div>
          </div>
          <button
            onClick={() => setReciterOpen(v => !v)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-muted/60 hover:bg-muted text-sm font-medium text-foreground transition-colors"
          >
            <span>{currentReciter.nameAr}</span>
            <ChevronDown size={16} className={cn("text-muted-foreground transition-transform", reciterOpen && "rotate-180")} />
          </button>
          <AnimatePresence>
            {reciterOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-1 rounded-xl border border-border/50 overflow-hidden bg-background">
                  {QURAN_RECITERS.map((reciter) => (
                    <button
                      key={reciter.id}
                      onClick={() => { setQuranReciterId(reciter.id); setReciterOpen(false); }}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3 text-sm transition-colors",
                        reciter.id === quranReciterId
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      <span>{reciter.nameAr}</span>
                      {reciter.id === quranReciterId && <Check size={15} />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Reset / Privacy */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="bg-card border border-border rounded-2xl px-4 mb-6"
      >
        <SectionLabel>الخصوصية والبيانات</SectionLabel>
        <div className="flex items-center gap-3 py-3.5">
          <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0">
            <Shield size={17} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">تطبيق مجهول الهوية</p>
            <p className="text-xs text-muted-foreground mt-0.5">لا يتم حفظ اسمك أو بريدك — خصوصيتك محفوظة تماماً</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
