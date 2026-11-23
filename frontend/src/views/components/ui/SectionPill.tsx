import { cn } from '../../../utils/cn';
import { BRAND_ACCENTS, type SectionAccent } from '../../../models/brand.model';

export interface SectionPillProps {
  label: string;
  /** Cor de identidade da seção (padrão: amarelo da marca) */
  accent?: SectionAccent;
  /** `dark` para seções de fundo azul, `light` para seções de fundo claro */
  tone?: 'dark' | 'light';
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Rótulo de abertura de seção, no mesmo formato das pílulas dos galhos e
 * raízes da árvore da introdução: quem clica num galho chega numa seção que
 * começa com o mesmo rótulo e a mesma cor.
 */
export function SectionPill({
  label,
  accent = BRAND_ACCENTS.amarelo,
  tone = 'dark',
  className,
  style,
}: SectionPillProps) {
  return (
    <span
      style={{ '--accent': tone === 'dark' ? accent.onDark : accent.color, ...style } as React.CSSProperties}
      className={cn(
        'inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-bold tracking-widest uppercase select-none',
        tone === 'dark'
          ? 'border-(--accent)/40 bg-white/10 text-white backdrop-blur-md'
          : 'border-(--accent)/30 bg-(--accent)/10 text-semispe-blue-dark',
        className
      )}
    >
      <span
        className="w-1.5 h-1.5 rounded-full bg-(--accent) shadow-[0_0_8px_var(--accent)]"
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
