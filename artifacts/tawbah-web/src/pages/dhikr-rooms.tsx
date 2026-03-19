import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Users } from "lucide-react";

interface Room {
  type: string;
  totalCount: number;
  activeNow: number;
}

const ROOM_META: Record<string, { label: string; arabic: string; color: string; bg: string; emoji: string }> = {
  istighfar: {
    label: "أستغفر الله",
    arabic: "أستغفر الله العظيم وأتوب إليه",
    color: "from-emerald-500 to-teal-600",
    bg: "from-emerald-500/10 to-teal-500/5",
    emoji: "🌿",
  },
  tasbih: {
    label: "سبحان الله",
    arabic: "سبحان الله وبحمده سبحان الله العظيم",
    color: "from-blue-500 to-indigo-600",
    bg: "from-blue-500/10 to-indigo-500/5",
    emoji: "💎",
  },
  tahmid: {
    label: "الحمد لله",
    arabic: "الحمد لله رب العالمين",
    color: "from-amber-500 to-yellow-600",
    bg: "from-amber-500/10 to-yellow-500/5",
    emoji: "✨",
  },
  salawat: {
    label: "صلِّ على النبي",
    arabic: "اللهم صلِّ على محمد وعلى آل محمد",
    color: "from-rose-500 to-pink-600",
    bg: "from-rose-500/10 to-pink-500/5",
    emoji: "🌸",
  },
};

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "م";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "ألف";
  return n.toString();
}

function RoomCard({ room }: { room: Room }) {
  const meta = ROOM_META[room.type];
  const [localCount, setLocalCount] = useState(room.totalCount);
  const [burst, setBurst] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setLocalCount(room.totalCount);
  }, [room.totalCount]);

  const tapMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/dhikr-rooms/${room.type}/tap`, {
        method: "POST",
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.totalCount) setLocalCount(data.totalCount);
    },
  });

  const handleTap = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();
      setRipples((prev) => [...prev, { id, x, y }]);
      setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);
    }
    setLocalCount((c) => c + 1);
    setBurst(true);
    setTimeout(() => setBurst(false), 200);
    tapMutation.mutate();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${meta.bg} rounded-3xl p-5 border border-border shadow-sm`}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">{meta.emoji}</span>
            <h3 className="font-bold text-base">{meta.label}</h3>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <Users size={11} className="text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">
              {room.activeNow} يسبّحون الآن
            </span>
          </div>
        </div>
        <div className="text-left">
          <motion.div
            key={localCount}
            initial={{ scale: 1.3, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-2xl font-bold text-primary"
          >
            {formatCount(localCount)}
          </motion.div>
          <p className="text-[10px] text-muted-foreground">إجمالي</p>
        </div>
      </div>

      <p className="text-xs text-center text-muted-foreground mb-4 font-medium leading-relaxed">
        {meta.arabic}
      </p>

      <button
        ref={buttonRef}
        onClick={handleTap}
        className={`w-full py-4 rounded-2xl font-bold text-white text-base relative overflow-hidden
          bg-gradient-to-r ${meta.color}
          active:scale-[0.97] transition-transform shadow-md
          ${burst ? "scale-[0.97]" : ""}
        `}
      >
        <AnimatePresence>
          {ripples.map((r) => (
            <motion.span
              key={r.id}
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 4, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute w-20 h-20 bg-white/30 rounded-full pointer-events-none"
              style={{ left: r.x - 40, top: r.y - 40 }}
            />
          ))}
        </AnimatePresence>
        {meta.label}
      </button>
    </motion.div>
  );
}

export default function DhikrRooms() {
  const { data, isLoading } = useQuery<{ rooms: Room[] }>({
    queryKey: ["dhikr-rooms"],
    queryFn: async () => {
      const res = await fetch("/api/dhikr-rooms");
      return res.json();
    },
    refetchInterval: 5000,
  });

  return (
    <div className="flex flex-col flex-1 pb-8 px-5 pt-6 gap-5">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-2xl font-bold mb-1">غرف الذكر الجماعي</h1>
        <p className="text-sm text-muted-foreground">
          سبّح مع آلاف المسلمين حول العالم — لا يُعرف هويتك
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-4 border border-primary/15 text-center"
      >
        <p className="text-sm font-medium text-primary">
          🌍 كل نقرة تُضاف إلى العداد العالمي المشترك
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          اضغط الزر وذاكر الله مع إخوانك في كل مكان
        </p>
      </motion.div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {data?.rooms.map((room) => (
            <RoomCard key={room.type} room={room} />
          ))}
        </div>
      )}

      <div className="text-center pb-2">
        <p className="text-xs text-muted-foreground leading-relaxed">
          ﴿وَالذَّاكِرِينَ اللَّهَ كَثِيرًا وَالذَّاكِرَاتِ أَعَدَّ اللَّهُ لَهُم مَّغْفِرَةً وَأَجْرًا عَظِيمًا﴾
        </p>
      </div>
    </div>
  );
}
