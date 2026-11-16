import { type LucideIcon } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { type SectionAccent } from '../../../models/brand.model';

export interface AccentIconProps {
  icon: LucideIcon;
  /** Cor do logotipo: fundo clarinho (`tint`) e ícone no tom legível (`onLight`) */
  accent: SectionAccent;
  size?: 'sm' | 'md';
  className?: string;
}

/** Ícone decorativo num círculo com uma cor do logotipo, para as seções de fundo claro */
export function AccentIcon({ icon: Icon, accent, size = 'md', className }: AccentIconProps) {
  return (
    <span
      aria-hidden="true"
      style={{ background: accent.tint, color: accent.onLight }}
      className={cn(
        'grid place-items-center shrink-0 rounded-full',
        size === 'sm' ? 'w-8 h-8' : 'w-11 h-11',
        className
      )}
    >
      <Icon className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />
    </span>
  );
}
