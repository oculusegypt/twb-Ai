import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { Home, Calendar, CircleDot, ShieldAlert, BarChart2, HelpCircle, User2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSettings } from "@/context/SettingsContext";

function ZakiAIIcon({ size = 28, active = false }: { size?: number; active?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer glow ring */}
      <circle cx="16" cy="16" r="15" stroke={active ? "#10b981" : "#6366f1"} strokeWidth="0.5" strokeDasharray="2 2" opacity="0.6" />

      {/* Robot head */}
      <rect x="8" y="10" width="16" height="13" rx="4" fill={active ? "#10b981" : "#6366f1"} />

      {/* Antenna */}
      <line x1="16" y1="6" x2="16" y2="10" stroke={active ? "#10b981" : "#6366f1"} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="16" cy="5.5" r="1.8" fill={active ? "#10b981" : "#6366f1"} />

      {/* Eyes */}
      <circle cx="12.5" cy="15" r="2" fill="white" />
      <circle cx="19.5" cy="15" r="2" fill="white" />
      <circle cx="12.5" cy="15" r="1" fill={active ? "#10b981" : "#6366f1"} />
      <circle cx="19.5" cy="15" r="1" fill={active ? "#10b981" : "#6366f1"} />
      {/* Eye shine */}
      <circle cx="13" cy="14.5" r="0.4" fill="white" />
      <circle cx="20" cy="14.5" r="0.4" fill="white" />

      {/* Islamic crescent on forehead */}
      <path
        d="M16 11.5 C14.8 11.5 13.9 12.2 13.9 12.2 C14.5 11.8 15.2 11.6 16 11.6 C17.5 11.6 18.8 12.5 18.8 12.5 C18.2 11.9 17.2 11.5 16 11.5Z"
        fill="white"
        opacity="0.7"
      />

      {/* Star (Islamic motif) */}
      <path d="M16 12.2 L16.3 13 L17.1 13 L16.5 13.5 L16.7 14.3 L16 13.8 L15.3 14.3 L15.5 13.5 L14.9 13 L15.7 13 Z" fill="white" opacity="0.9" />

      {/* Mouth / signal bars */}
      <rect x="12" y="19.5" width="2" height="1.5" rx="0.5" fill="white" opacity="0.8" />
      <rect x="15" y="18.5" width="2" height="2.5" rx="0.5" fill="white" opacity="0.9" />
      <rect x="18" y="19.5" width="2" height="1.5" rx="0.5" fill="white" opacity="0.8" />

      {/* Circuit dots on sides */}
      <circle cx="7" cy="14" r="1" fill={active ? "#10b981" : "#6366f1"} opacity="0.5" />
      <circle cx="25" cy="14" r="1" fill={active ? "#10b981" : "#6366f1"} opacity="0.5" />
      <line x1="8" y1="14" x2="8.5" y2="14" stroke={active ? "#10b981" : "#6366f1"} strokeWidth="1" opacity="0.5" />
      <line x1="23.5" y1="14" x2="24" y2="14" stroke={active ? "#10b981" : "#6366f1"} strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { t, lang } = useSettings();
  const [helpOpen, setHelpOpen] = useState(false);

  const leftItems = [
    { href: "/", label: t.nav.home, icon: Home },
    { href: "/plan", label: t.nav.plan, icon: Calendar },
  ];

  const rightItems = [
    { href: "/progress", label: "تقدمي", icon: BarChart2 },
    { href: "/account", label: "حسابي", icon: User2 },
  ];

  const zakiHref = "/zakiy";
  const isZakiActive = location === zakiHref;

  const isSos = location === "/sos";

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background relative pb-[80px] max-w-md mx-auto shadow-2xl shadow-black/5 overflow-hidden ring-1 ring-border/50">
      <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none -z-10" />

      <main className="flex-1 flex flex-col relative z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex-1 flex flex-col"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {!isSos && (
        <>
          {/* Help button — expands to show SOS + Dhikr */}
          <div className="fixed bottom-[90px] right-4 z-50 flex flex-col items-center gap-2">
            <AnimatePresence>
              {helpOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, y: 20 }}
                    transition={{ delay: 0.05 }}
                  >
                    <Link
                      href="/dhikr"
                      onClick={() => setHelpOpen(false)}
                      className="flex items-center gap-2 px-3.5 py-2.5 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all text-xs font-bold whitespace-nowrap"
                    >
                      <CircleDot size={16} strokeWidth={2} />
                      <span>الذكر</span>
                    </Link>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, y: 20 }}
                    transition={{ delay: 0 }}
                  >
                    <Link
                      href="/sos"
                      onClick={() => setHelpOpen(false)}
                      className="flex items-center gap-2 px-3.5 py-2.5 bg-destructive text-destructive-foreground rounded-full shadow-lg shadow-destructive/30 hover:scale-105 active:scale-95 transition-all text-xs font-bold whitespace-nowrap"
                    >
                      <ShieldAlert size={16} strokeWidth={2.5} />
                      <span>طوارئ</span>
                    </Link>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setHelpOpen(v => !v)}
              className={cn(
                "p-3.5 rounded-full shadow-lg transition-all",
                helpOpen
                  ? "bg-muted text-muted-foreground shadow-black/10"
                  : "bg-card border border-border text-muted-foreground shadow-black/10 hover:text-primary hover:border-primary/40"
              )}
              title={lang === "ar" ? "مساعدة" : "Help"}
            >
              <AnimatePresence mode="wait">
                {helpOpen ? (
                  <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <X size={22} strokeWidth={2.5} />
                  </motion.span>
                ) : (
                  <motion.span key="help" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <HelpCircle size={22} strokeWidth={2} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          {/* Backdrop */}
          <AnimatePresence>
            {helpOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setHelpOpen(false)}
                className="fixed inset-0 z-40"
              />
            )}
          </AnimatePresence>

          {/* Bottom Navigation Bar */}
          <nav className="fixed bottom-0 inset-x-0 z-40 max-w-md mx-auto">
            {/* Nav bar background with curved notch in center */}
            <div className="relative bg-card/95 backdrop-blur-xl border-t border-border/50 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
              <div className="flex items-center h-[68px] px-2">

                {/* Left side items */}
                {leftItems.map((item) => {
                  const isActive = location === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="relative flex flex-col items-center justify-center flex-1 h-full gap-1 tap-highlight-transparent"
                    >
                      <div className={cn(
                        "p-1.5 rounded-full transition-all duration-300",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}>
                        <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                      </div>
                      <span className={cn(
                        "text-[10px] font-medium transition-colors leading-none",
                        isActive ? "text-primary font-semibold" : "text-muted-foreground"
                      )}>
                        {item.label}
                      </span>
                      {isActive && (
                        <motion.div
                          layoutId="nav-indicator"
                          className="absolute top-0 inset-x-3 h-0.5 bg-primary rounded-b-full"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                    </Link>
                  );
                })}

                {/* Center spacer for the raised Zaki button */}
                <div className="w-16 flex-shrink-0" />

                {/* Right side items */}
                {rightItems.map((item) => {
                  const isActive = location === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="relative flex flex-col items-center justify-center flex-1 h-full gap-1 tap-highlight-transparent"
                    >
                      <div className={cn(
                        "p-1.5 rounded-full transition-all duration-300",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}>
                        <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                      </div>
                      <span className={cn(
                        "text-[10px] font-medium transition-colors leading-none",
                        isActive ? "text-primary font-semibold" : "text-muted-foreground"
                      )}>
                        {item.label}
                      </span>
                      {isActive && (
                        <motion.div
                          layoutId="nav-indicator"
                          className="absolute top-0 inset-x-3 h-0.5 bg-primary rounded-b-full"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Raised center Zaki button */}
            <div className="absolute left-1/2 -translate-x-1/2 -top-7 z-50">
              <Link href={zakiHref} className="block tap-highlight-transparent">
                <motion.div
                  whileTap={{ scale: 0.92 }}
                  whileHover={{ scale: 1.05 }}
                  className="relative flex flex-col items-center"
                >
                  {/* Outer ring glow when active */}
                  {isZakiActive && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-0 rounded-full bg-primary/20 blur-md scale-125"
                    />
                  )}

                  {/* The raised circle button */}
                  <div className={cn(
                    "w-[62px] h-[62px] rounded-full flex items-center justify-center shadow-xl transition-all duration-300",
                    isZakiActive
                      ? "bg-gradient-to-br from-emerald-500 to-indigo-600 shadow-emerald-500/40"
                      : "bg-white dark:bg-card shadow-black/20 border-2 border-border/30"
                  )}>
                    <ZakiAIIcon size={30} active={isZakiActive} />
                  </div>

                  {/* Label below */}
                  <span className={cn(
                    "text-[10px] font-semibold mt-1 leading-none transition-colors",
                    isZakiActive ? "text-primary" : "text-muted-foreground"
                  )}>
                    زكي
                  </span>
                </motion.div>
              </Link>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
