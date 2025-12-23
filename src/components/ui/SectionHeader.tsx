import { ReactNode } from "react";

interface SectionHeaderProps {
  overline?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function SectionHeader({ overline, title, description, actions }: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {overline && (
          <p className="text-[11px] uppercase tracking-[0.2em] text-gold font-semibold">{overline}</p>
        )}
        <h2 className="text-xl font-semibold text-charcoal">{title}</h2>
        {description && <p className="text-sm text-slate-600">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

