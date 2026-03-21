import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { Home, Calendar, CircleDot, ShieldAlert, BarChart2, HelpCircle, User2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSettings } from "@/context/SettingsContext";

function ZakiIcon({ size = 28 }: { size?: number; active?: boolean }) {
  const color = "#ffffff";
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Crescent moon */}
      <path
        d="M22 7C17.5 7 13 11 13 16.5C13 22 17.5 26 22 26C18.5 25 15.5 21.5 15.5 16.5C15.5 11.5 18.5 8.5 22 7Z"
        fill={color}
        opacity="0.9"
      />
      {/* Large star */}
      <path
        d="M23.5 9L24.3 11.5L27 11.5L24.9 13.1L25.7 15.5L23.5 13.9L21.3 15.5L22.1 13.1L20 11.5L22.7 11.5Z"
        fill={color}
      />
      {/* Small dot stars */}
      <circle cx="19" cy="19" r="1" fill={color} opacity="0.7" />
      <circle cx="11" cy="14" r="0.8" fill={color} opacity="0.5" />
      {/* Neural/circuit lines */}
      <line x1="10" y1="16" x2="13" y2="16" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      <line x1="10" y1="19" x2="12" y2="19" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <circle cx="10" cy="16" r="1" fill={color} opacity="0.5" />
      <circle cx="10" cy="19" r="0.8" fill={color} opacity="0.4" />
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

            {/* SVG notch shape for the nav bar background */}
            <div className="relative">

              {/* Nav bar with SVG-shaped background that has a circular notch */}
              {/* Math: button center = -2px from nav top (button at -top-34, height 64).
                  Arc radius 42, so gap = 42-32 = 10px uniform. Arc center must be at y=-2.
                  Arc endpoints at y = -2 + sqrt(42²-38²) ≈ 16. Smooth bezier from y=0→16 at edges. */}
              <svg
                className="absolute inset-x-0 top-0 w-full pointer-events-none"
                style={{ height: "80px" }}
                viewBox="0 0 400 80"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M0,0 L155,0 Q160,0 162,16 A42,42 0 0,0 238,16 Q240,0 245,0 L400,0 L400,80 L0,80 Z"
                  className="fill-card/95"
                  style={{ filter: "drop-shadow(0 -4px 16px rgba(0,0,0,0.10))" }}
                />
                <path
                  d="M0,0.5 L155,0.5 Q160,0.5 162.5,16 A42,42 0 0,0 237.5,16 Q240,0.5 245,0.5 L400,0.5"
                  fill="none"
                  className="stroke-border/50"
                  strokeWidth="0.8"
                />
              </svg>

              {/* Nav content */}
              <div className="relative flex items-center h-[68px] pb-safe" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
                {/* Left items */}
                {leftItems.map((item) => (
                  <NavItem key={item.href} {...item} />
                ))}

                {/* Center spacer for notch */}
                <div className="w-[88px] flex-shrink-0" />

                {/* Right items */}
                {rightItems.map((item) => (
                  <NavItem key={item.href} {...item} />
                ))}
              </div>

              {/* Raised Zaki button — sits in the notch */}
              <div className="absolute left-1/2 -translate-x-1/2 -top-[34px] z-50">
                <Link href={zakiHref} className="block tap-highlight-transparent">
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.06 }}
                    className="flex flex-col items-center"
                  >
                    {/* Siri-style circle button */}
                    <div className="zaki-btn-siri w-[64px] h-[64px] shadow-2xl">
                      {/* Glass frost overlay sits above the rotating gradient (::after z-index:0) */}
                      <div className="absolute inset-0 rounded-full bg-white/20 dark:bg-black/25 backdrop-blur-[2px] z-10" />
                      {/* Icon on top */}
                      <div className="absolute inset-0 rounded-full flex items-center justify-center z-20">
                        <ZakiIcon size={30} active={true} />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </div>
            </div>

          </nav>
        </>
      )}
    </div>
  );
}
