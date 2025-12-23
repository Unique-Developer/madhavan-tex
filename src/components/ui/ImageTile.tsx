import { motion, useReducedMotion } from "framer-motion";

interface ImageTileProps {
  src?: string;
  alt: string;
  className?: string;
}

export function ImageTile({ src, alt, className = "" }: ImageTileProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      whileHover={!reduce ? { y: -3, scale: 1.01 } : undefined}
      className={`relative overflow-hidden rounded-xl bg-slate-100 ${className}`}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
          No image
        </div>
      )}
    </motion.div>
  );
}

