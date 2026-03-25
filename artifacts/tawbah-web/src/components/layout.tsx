import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Home, Calendar, CircleDot, ShieldAlert, BarChart2, HelpCircle, User2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSettings } from "@/context/SettingsContext";
import { VoiceOrbOverlay } from "./VoiceOrbOverlay";

const WAVE_BARS = [0.35, 0.65, 1, 0.8, 0.5, 0.9, 0.6, 0.4, 0.75, 0.95, 0.55, 0.7, 0.45, 0.85, 0.6];

function ZakiyNavOrb({ isActive }: { isActive: boolean }) {
  return (
    <div className="relative w-[60px] h-[60px]">
      {/* Soft primary glow */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: "-6px",
          background: "radial-gradient(circle, hsl(var(--primary)/0.14) 0%, transparent 70%)",
          filter: "blur(8px)",
        }}
      />

      {/* Pulse rings */}
      {[0, 1].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full"
          style={{ border: "1px solid hsl(var(--primary)/0.22)" }}
          animate={{ scale: [1, 1.18, 1], opacity: [0.22, 0, 0.22] }}
          transition={{ duration: 5, repeat: Infinity, delay: i * 2.2, ease: "easeInOut" }}
        />
      ))}

      {/* Main orb */}
      <div
        className="absolute inset-0 rounded-full overflow-hidden flex items-center justify-center"
        style={{
          background: "linear-gradient(145deg, hsl(var(--primary)/0.82), hsl(var(--primary)/0.62))",
          boxShadow: isActive
            ? "0 0 0 2px hsl(var(--primary)/0.3), 0 0 14px hsl(var(--primary)/0.2), 0 4px 14px rgba(0,0,0,0.18)"
            : "0 0 0 1.5px hsl(var(--primary)/0.18), 0 0 8px hsl(var(--primary)/0.12), 0 3px 10px rgba(0,0,0,0.14)",
        }}
      >
        {/* Gloss */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 38% 28%, rgba(255,255,255,0.15) 0%, transparent 60%)" }}
        />

        {/* Sound wave bars */}
        <div className="relative z-10 flex items-center gap-[2px]">
          {WAVE_BARS.map((h, i) => (
            <motion.div
              key={i}
              className="rounded-full"
              style={{ width: 2, background: "hsl(var(--primary-foreground)/0.92)", originY: "50%" }}
              animate={{ scaleY: [h * 0.25, h, h * 0.45, h * 0.7, h * 0.25] }}
              transition={{ duration: 2.4 + (i % 5) * 0.25, repeat: Infinity, delay: i * 0.11, ease: "easeInOut" }}
              initial={{ height: Math.round(h * 24) }}
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

  const [voiceOpen, setVoiceOpen] = useState(false);
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
          {/* Help button — moved to LEFT side, raised higher to clear chat controls */}
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

          {/* Voice Orb Overlay */}
          <AnimatePresence>
            {voiceOpen && (
              <VoiceOrbOverlay onClose={() => setVoiceOpen(false)} />
            )}
          </AnimatePresence>

          {/* Floating Bottom Navigation Bar — SVG Notch Pill */}
          <nav className="fixed bottom-3 inset-x-0 z-40 max-w-md mx-auto px-3">
            <div className="relative" style={{ height: 72 }}>

              {/* SVG pill with notch cutout at top-center for the Zaki orb */}
              <svg
                className="absolute inset-0 w-full pointer-events-none"
                viewBox="0 0 400 72"
                preserveAspectRatio="none"
                style={{ height: 72 }}
              >
                <defs>
                  <filter id="nav-shadow" x="-10%" y="-30%" width="120%" height="160%">
                    <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="rgba(0,0,0,0.18)" />
                    <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="rgba(0,0,0,0.10)" />
                  </filter>
                </defs>
                {/* Glass fill */}
                <path
                  d="M28,0 L152,0 Q164,0 164,14 C164,27 180,36 200,36 C220,36 236,27 236,14 Q236,0 248,0 L372,0 Q400,0 400,28 L400,64 Q400,72 372,72 L28,72 Q0,72 0,64 L0,28 Q0,0 28,0 Z"
                  className="fill-card/92"
                  filter="url(#nav-shadow)"
                />
                {/* Shine gradient — encoded inline */}
                <path
                  d="M28,0 L152,0 Q164,0 164,14 C164,27 180,36 200,36 C220,36 236,27 236,14 Q236,0 248,0 L372,0 Q400,0 400,28 L400,34 L0,34 L0,28 Q0,0 28,0 Z"
                  fill="rgba(255,255,255,0.09)"
                />
                {/* Border */}
                <path
                  d="M28,0.5 L152,0.5 Q163.5,0.5 163.5,14 C163.5,27 179.5,36.5 200,36.5 C220.5,36.5 236.5,27 236.5,14 Q236.5,0.5 248,0.5 L372,0.5 Q399.5,0.5 399.5,28 L399.5,64 Q399.5,71.5 372,71.5 L28,71.5 Q0.5,71.5 0.5,64 L0.5,28 Q0.5,0.5 28,0.5"
                  fill="none"
                  className="stroke-border/50"
                  strokeWidth="0.8"
                />
              </svg>

              {/* Nav items row */}
              <div className="absolute inset-0 flex items-center" style={{ bottom: 0 }}>
                {leftItems.map((item) => (
                  <NavItem key={item.href} {...item} />
                ))}
                {/* Center gap reserved for orb */}
                <div className="flex-none" style={{ width: "24%" }} />
                {rightItems.map((item) => (
                  <NavItem key={item.href} {...item} />
                ))}
              </div>

              {/* Zaki orb — sits inside the notch */}
              <div
                className="absolute left-1/2 -translate-x-1/2 z-50"
                style={{ top: -28, filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.22)) drop-shadow(0 2px 6px rgba(0,0,0,0.14))" }}
              >
                <button
                  onClick={() => setVoiceOpen(true)}
                  className="block tap-highlight-transparent focus:outline-none"
                >
                  <motion.div whileTap={{ scale: 0.91 }} whileHover={{ scale: 1.06 }} className="relative">
                    <ZakiyNavOrb isActive={isZakiActive} />
                  </motion.div>
                </button>
              </div>

            </div>
          </nav>
        </>
      )}
    </div>
  );
}
