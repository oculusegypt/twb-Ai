import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Home, Calendar, CircleDot, ShieldAlert, HeartHandshake } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "الرئيسية", icon: Home },
    { href: "/plan", label: "الخطة", icon: Calendar },
    { href: "/dhikr", label: "الذكر", icon: CircleDot },
    { href: "/signs", label: "التباشير", icon: HeartHandshake },
  ];

  // Don't show bottom nav on SOS page to maintain immersion
  const isSos = location === "/sos";

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background relative pb-[80px] max-w-md mx-auto shadow-2xl shadow-black/5 overflow-hidden ring-1 ring-border/50">
      {/* Dynamic Header Pattern */}
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
          {/* Floating SOS Button */}
          <Link 
            href="/sos"
            className="fixed bottom-[90px] left-4 z-50 p-4 bg-destructive text-destructive-foreground rounded-full shadow-lg shadow-destructive/30 hover:scale-105 active:scale-95 transition-all"
            title="زر الطوارئ"
          >
            <ShieldAlert size={28} strokeWidth={2.5} />
          </Link>

          {/* Bottom Navigation */}
          <nav className="fixed bottom-0 inset-x-0 bg-card/80 backdrop-blur-xl border-t border-border/50 pb-safe z-40 max-w-md mx-auto">
            <div className="flex justify-between items-center px-6 h-[72px]">
              {navItems.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className="relative flex flex-col items-center justify-center w-16 h-full gap-1 tap-highlight-transparent"
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
    </div>
  );
}
