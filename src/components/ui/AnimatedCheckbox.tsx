import { motion } from "framer-motion";
import type React from "react";

type AnimatedCheckboxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onDrag" | "onDragStart" | "onDragEnd"
> & {
  label?: string;
};

export function AnimatedCheckbox({ label, ...props }: AnimatedCheckboxProps) {
  return (
    <label className="flex items-center gap-2 text-[12px] text-slate-600 cursor-pointer select-none">
      <motion.input
        type="checkbox"
        {...props}
        className="h-3.5 w-3.5 rounded border-slate-300 text-gold focus:ring-gold"
        whileTap={{ scale: 0.9 }}
      />
      {label && <span>{label}</span>}
    </label>
  );
}

