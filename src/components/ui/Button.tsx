import { motion } from "framer-motion";
import type React from "react";
import type { ReactNode } from "react";

type Variant = "primary" | "ghost" | "subtle";

const base =
  "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition duration-300 ease-luxury focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2";

const variants: Record<Variant, string> = {
  primary: "bg-charcoal text-ivory shadow-soft hover:shadow-card",
  ghost: "border border-slate-200 bg-white text-charcoal hover:bg-slate-50",
  subtle: "bg-charcoal-soft/80 text-ivory hover:bg-charcoal-soft",
};

type ButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
> & {
  children: ReactNode;
  variant?: Variant;
  icon?: ReactNode;
};

export function Button({ children, variant = "primary", icon, ...props }: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`${base} ${variants[variant]}`}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </motion.button>
  );
}

