import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { Home, Calendar, CircleDot, ShieldAlert, BarChart2, HelpCircle, User2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSettings } from "@/context/SettingsContext";

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

          {/* Bottom Navigation Bar */}
          <nav className="fixed bottom-0 inset-x-0 z-40 max-w-md mx-auto">
            <div className="relative">

              {/*
                SVG notch — uses ONLY cubic bezier curves (no arc/A command) so it
                never distorts regardless of screen width.
                ViewBox 400×80: x scales with screen width (proportional), y is fixed 1:1.
                Notch: center x=200, spans x135→265 (130px), depth 44px.
                Button center sits at nav-top (y=0); button bottom at y=30 → fits inside 42px notch.
              */}
              <svg
                className="absolute inset-x-0 top-0 w-full pointer-events-none"
                style={{ height: "80px" }}
                viewBox="0 0 400 80"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Nav bar fill with smooth bezier notch — notch spans x=135→265 (130px) for even margins */}
                <path
                  d="M0,0 L135,0 C150,0 185,44 200,44 C215,44 250,0 265,0 L400,0 L400,80 L0,80 Z"
                  className="fill-card/95"
                  style={{ filter: "drop-shadow(0 -4px 16px rgba(0,0,0,0.09))" }}
                />
                {/* Border line following the same bezier curve */}
                <path
                  d="M0,0.5 L135,0.5 C150,0.5 185,44.5 200,44.5 C215,44.5 250,0.5 265,0.5 L400,0.5"
                  fill="none"
                  className="stroke-border/50"
                  strokeWidth="0.8"
                />
              </svg>

              {/* Nav content sits on top of the SVG */}
              <div className="relative flex items-center h-[68px] pb-safe" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
                {leftItems.map((item) => (
                  <NavItem key={item.href} {...item} />
                ))}

                {/* Center spacer — 32.5% matches notch width (130/400) */}
                <div className="flex-none" style={{ width: "32.5%" }} />

                {rightItems.map((item) => (
                  <NavItem key={item.href} {...item} />
                ))}
              </div>

              {/* Zaki button — center at nav-top (y=0), sits in the notch */}
              <div className="absolute left-1/2 -translate-x-1/2 -top-[30px] z-50">
                <Link href={zakiHref} className="block tap-highlight-transparent">
                  <motion.div
                    whileTap={{ scale: 0.92 }}
                    whileHover={{ scale: 1.04 }}
                  >
                    <div
                      className="zaki-btn-siri w-[60px] h-[60px]"
                      style={{ boxShadow: "0 6px 24px rgba(0,0,0,0.22)" }}
                    />
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
