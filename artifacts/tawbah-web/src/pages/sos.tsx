import { Link } from "wouter";
import { ArrowLeft, ShieldAlert, Heart, Droplets } from "lucide-react";
import { motion } from "framer-motion";

export default function Sos() {
  return (
    <div className="fixed inset-0 z-50 bg-destructive/95 backdrop-blur-md flex flex-col p-6 text-destructive-foreground overflow-y-auto max-w-md mx-auto">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse"
        >
          <ShieldAlert size={48} className="text-white" />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl font-display font-bold mb-4 drop-shadow-md">توقف!</h1>
          <p className="text-xl font-medium text-white/90 leading-relaxed drop-shadow">
            الله يراك الآن، وهو أرحم بك من نفسك.
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white/10 p-6 rounded-2xl border border-white/20 mb-8 backdrop-blur-sm"
        >
          <p className="text-lg font-display text-center leading-loose font-bold mb-4">
            "قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَى أَنْفُسِهِمْ لَا تَقْنَطُوا مِنْ رَحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا ۚ إِنَّهُ هُوَ الْغَفُورُ الرَّحِيمُ"
          </p>
          <div className="flex items-center justify-center gap-2 text-white/80 text-sm">
            <Heart size={16} />
            <span>باب التوبة مفتوح، لا تغلقه</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          <button className="w-full py-4 bg-white text-destructive font-bold text-lg rounded-xl shadow-lg hover:bg-white/90 active:scale-95 transition-all flex items-center justify-center gap-3">
            <Droplets size={24} />
            <span>قم الآن وتوضأ</span>
          </button>
          
          <Link href="/" className="w-full py-4 bg-transparent border-2 border-white/30 text-white font-bold text-lg rounded-xl hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-3">
            <span>العودة للرئيسية</span>
            <ArrowLeft size={20} />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
