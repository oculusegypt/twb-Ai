import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Home, Calendar, BarChart2, User2, X, HelpCircle, CircleDot, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSettings } from "@/context/SettingsContext";

const WAVE_BARS = [0.4, 0.7, 1, 0.75, 0.5, 0.85, 0.55, 0.45, 0.8];

function ZakiyNavCenter({ isActive }: { isActive: boolean }) {
  return (
    <div className="relative w-[46px] h-[46px]">
      {isActive && [0, 1].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-[-3px] rounded-full pointer-events-none"
          style={{ border: "1.5px solid hsl(var(--primary)/0.28)" }}
          animate={{ scale: [1, 1.22, 1], opacity: [0.28, 0, 0.28] }}
          transition={{ duration: 3.5, repeat: Infinity, delay: i * 1.6, ease: "easeInOut" }}
        />
      ))}

      <div
        className="absolute inset-0 rounded-full flex items-center justify-center overflow-hidden"
        style={{
          background: isActive
            ? "linear-gradient(145deg, hsl(var(--primary)), hsl(var(--primary)/0.82))"
            : "linear-gradient(145deg, hsl(var(--primary)/0.88), hsl(var(--primary)/0.68))",
          boxShadow: isActive
            ? "0 0 0 2.5px hsl(var(--primary)/0.18), 0 4px 16px hsl(var(--primary)/0.32), inset 0 1px 0 rgba(255,255,255,0.18)"
            : "0 2px 10px hsl(var(--primary)/0.24), inset 0 1px 0 rgba(255,255,255,0.14)",
        }}
      >
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 35% 28%, rgba(255,255,255,0.18) 0%, transparent 60%)" }}
        />
        <div className="relative z-10 flex items-center gap-[2.5px]">
          {WAVE_BARS.map((h, i) => (
            <motion.div
              key={i}
              className="rounded-full"
              style={{ width: 2, background: "hsl(var(--primary-foreground)/0.92)", originY: "50%" }}
              animate={{ scaleY: [h * 0.28, h, h * 0.48, h * 0.28] }}
              transition={{ duration: 2.2 + (i % 4) * 0.28, repeat: Infinity, delay: i * 0.13, ease: "easeInOut" }}
              initial={{ height: Math.round(h * 20) }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { t, lang } = useSettings();
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [location]);

  const leftItems = [
    { href: "/", label: t.nav.home, icon: Home },
    { href: "/journey", label: "رحلتي", icon: Calendar },
  ];

  const rightItems = [
    { href: "/progress", label: "تقدمي", icon: BarChart2 },
    { href: "/account", label: "حسابي", icon: User2 },
  ];

  const zakiHref = "/zakiy";
  const isZakiActive = location === zakiHref;
  const isSos = location === "/sos";

  const NavItem = ({ href, label, icon: Icon }: { href: string; label: string; icon: typeof Home }) => {
    const isActive = location === href;
    return (
      <Link
        href={href}
        className="relative flex flex-col items-center justify-center flex-1 h-full gap-1 tap-highlight-transparent"
      >
        {isActive && (
          <motion.div
            layoutId="nav-indicator"
            className="absolute top-0 inset-x-2 h-[3px] bg-primary rounded-b-full"
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
          />
        )}
        <Icon
          size={22}
          strokeWidth={isActive ? 2.5 : 1.8}
          className={cn("transition-colors duration-200", isActive ? "text-primary" : "text-muted-foreground")}
        />
        <span className={cn(
          "text-[10px] font-medium transition-colors leading-none",
          isActive ? "text-primary font-semibold" : "text-muted-foreground"
        )}>
          {label}
        </span>
      </Link>
    );
  };

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
          {/* Help button */}
          <div className="fixed bottom-[110px] left-4 z-50 flex flex-col items-center gap-2">
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

          {/* Floating Bottom Navigation Bar */}
          <nav className="fixed bottom-3 inset-x-0 z-40 max-w-md mx-auto px-4">
            <div
              className="relative rounded-[28px] overflow-hidden bg-card/90 backdrop-blur-2xl"
              style={{
                boxShadow: "0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.09), inset 0 1px 0 rgba(255,255,255,0.14)",
                border: "1px solid hsl(var(--border)/0.55)",
              }}
            >
              {/* Top shine */}
              <div
                className="absolute top-0 inset-x-0 h-[45%] pointer-events-none rounded-t-[28px]"
                style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.16) 0%, transparent 100%)" }}
              />

              {/* Nav content */}
              <div className="relative flex items-center h-[62px]" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
                {leftItems.map((item) => (
                  <NavItem key={item.href} {...item} />
                ))}

                {/* Center Zakiy button — full height and width in navbar */}
                <Link
                  href="/zakiy"
                  className="relative flex flex-col items-center justify-center flex-none h-full tap-highlight-transparent group"
                  style={{ width: "22%" }}
                >
                  {isZakiActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute top-0 inset-x-2 h-[3px] bg-primary rounded-b-full"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  <motion.div
                    whileTap={{ scale: 0.92 }}
                    whileHover={{ scale: 1.05 }}
                    className="flex flex-col items-center gap-0.5"
                  >
                    <ZakiyNavCenter isActive={isZakiActive} />
                    <span className={cn(
                      "text-[9px] font-semibold leading-none transition-colors",
                      isZakiActive ? "text-primary" : "text-muted-foreground"
                    )}>
                      الزكي
                    </span>
                  </motion.div>
                </Link>

                {rightItems.map((item) => (
                  <NavItem key={item.href} {...item} />
                ))}
              </div>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
