import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { Home, Calendar, CircleDot, ShieldAlert, BarChart2, HelpCircle, Sparkles, User2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSettings } from "@/context/SettingsContext";
import { SettingsSheet } from "@/components/SettingsSheet";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { t, lang } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const navItems = [
    { href: "/", label: t.nav.home, icon: Home },
    { href: "/plan", label: t.nav.plan, icon: Calendar },
    { href: "/dhikr", label: t.nav.dhikr, icon: CircleDot },
    { href: "/progress", label: "تقدمي", icon: BarChart2 },
    { href: "/account", label: "حسابي", icon: User2 },
  ];

  const isSos = location === "/sos";

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background relative pb-[80px] max-w-md mx-auto shadow-2xl shadow-black/5 overflow-hidden ring-1 ring-border/50">
      <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none -z-10" />

      {!isSos && (
        <div className={cn(
          "flex items-center justify-between px-4 pt-3 pb-1 z-50",
          location === "/" ? "absolute top-0 inset-x-0" : "relative"
        )}>
          <button
            onClick={() => setSettingsOpen(true)}
            className={cn(
              "p-2 rounded-full transition-all",
              location === "/"
                ? "bg-black/20 backdrop-blur-sm text-white hover:bg-black/30"
                : "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
            aria-label="الإعدادات"
          >
            {/* Settings icon in header removed — accessed via account page */}
            <span className="sr-only">الإعدادات</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          {location !== "/" && (
            <img
              src="/images/logo.png"
              alt="توبة نصوحة"
              className="h-10 w-10 object-contain rounded-full select-none"
            />
          )}
          <div className="w-9" />
        </div>
      )}

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
          {/* Help button — expands to show SOS + Zakiy */}
          <div className="fixed bottom-[90px] left-4 z-50 flex flex-col items-center gap-2">
            <AnimatePresence>
              {helpOpen && (
                <>
                  {/* Zakiy AI button */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, y: 20 }}
                    transition={{ delay: 0.05 }}
                  >
                    <Link
                      href="/zakiy"
                      onClick={() => setHelpOpen(false)}
                      className="flex items-center gap-2 px-3.5 py-2.5 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all text-xs font-bold whitespace-nowrap"
                    >
                      <Sparkles size={16} strokeWidth={2} />
                      <span>الزكي — المرشد</span>
                    </Link>
                  </motion.div>

                  {/* SOS Emergency button */}
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

            {/* Main help toggle button */}
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

          {/* Backdrop to close help menu */}
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

          <nav className="fixed bottom-0 inset-x-0 bg-card/80 backdrop-blur-xl border-t border-border/50 pb-safe z-40 max-w-md mx-auto">
            <div className="flex justify-between items-center px-3 h-[72px]">
              {navItems.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="relative flex flex-col items-center justify-center w-14 h-full gap-1 tap-highlight-transparent"
                  >
                    <div className={cn(
                      "p-2 rounded-full transition-all duration-300",
                      isActive ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted"
                    )}>
                      <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    <span className={cn(
                      "text-[10px] font-medium transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}>
                      {item.label}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute -bottom-[2px] w-8 h-1 bg-primary rounded-t-full"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>
        </>
      )}

      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
