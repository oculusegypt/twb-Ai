import { useLocation } from "wouter";
import { ArrowRight } from "lucide-react";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  onBack?: () => void;
  right?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, icon, onBack, right, className = "" }: PageHeaderProps) {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.length > 1 ? window.history.back() : setLocation("/");
    }
  };

  return (
    <div
      className={`sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-border/40 ${className}`}
    >
      <div className="flex items-center h-14 px-2 relative">
        {/* Back button — right side (RTL) */}
        <button
          onClick={handleBack}
          className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-muted/70 active:scale-95 transition-all text-muted-foreground hover:text-foreground shrink-0"
          aria-label="رجوع"
        >
          <ArrowRight size={20} />
        </button>

        {/* Centered title */}
        <div className="absolute inset-x-0 flex flex-col items-center justify-center pointer-events-none px-14">
          <div className="flex items-center gap-1.5">
            {icon && <span className="text-primary">{icon}</span>}
            <h1 className="font-bold text-base text-foreground leading-tight">{title}</h1>
          </div>
          {subtitle && (
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">{subtitle}</p>
          )}
        </div>

        {/* Optional right element */}
        <div className="mr-auto shrink-0">{right}</div>
      </div>
    </div>
  );
}
