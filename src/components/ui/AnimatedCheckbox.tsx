import { motion } from "framer-motion";
import type React from "react";

type AnimatedCheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function AnimatedCheckbox({ label, ...props }: AnimatedCheckboxProps) {
  return (
    <motion.label
      className="flex items-center gap-2 text-[12px] text-slate-600 cursor-pointer select-none"
      whileTap={{ scale: 0.96 }}
    >
      <input
        type="checkbox"
        {...props}
        className="h-3.5 w-3.5 rounded border-slate-300 text-gold focus:ring-gold"
      />
      {label && <span>{label}</span>}
    </motion.label>
  );
}

