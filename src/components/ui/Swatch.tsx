import { motion, useReducedMotion } from "framer-motion";

interface SwatchProps {
  imageUrl?: string;
  label: string;
  selected?: boolean;
  glow?: boolean;
}

export function Swatch({ imageUrl, label, selected, glow = false }: SwatchProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      whileHover={!reduce ? { scale: 1.05, y: -2, rotateX: 2 } : undefined}
      className="flex flex-col items-center"
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <motion.div
        className={`w-12 h-12 rounded-full border-2 ring-1 ring-slate-200 overflow-hidden bg-slate-100 ${
          selected ? "border-gold shadow-glow" : "border-white shadow-soft"
        }`}
        animate={
          selected || glow
            ? {
                scale: 1.05,
                boxShadow: "0 0 0 1px rgba(197,164,109,0.25), 0 8px 26px rgba(197,164,109,0.25)",
              }
            : { scale: 1 }
        }
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={label} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[11px] text-slate-500">
            –
          </div>
        )}
      </motion.div>
      <span className="text-[11px] text-slate-600 mt-1 max-w-[56px] truncate">{label}</span>
    </motion.div>
  );
}

