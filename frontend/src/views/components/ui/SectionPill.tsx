import { cn } from '../../../utils/cn';

export interface SectionPillProps {
  label: string;
  /** `dark` para seções de fundo azul, `light` para seções de fundo claro */
  tone?: 'dark' | 'light';
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Rótulo de abertura de seção, no mesmo formato das pílulas dos galhos e
 * raízes da árvore da introdução: quem clica num galho chega numa seção que
 * começa com o mesmo rótulo.
 */
export function SectionPill({ label, tone = 'dark', className, style }: SectionPillProps) {
  return (
    <span
      style={style}
      className={cn(
        'inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-bold tracking-widest uppercase select-none',
        tone === 'dark'
          ? 'border-white/20 bg-white/10 text-white backdrop-blur-md'
          : 'border-semispe-blue/25 bg-semispe-blue/10 text-semispe-blue-dark',
        className
      )}
    >
      <span
        className="w-1.5 h-1.5 rounded-full bg-semispe-yellow shadow-[0_0_8px_#ffdf00]"
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
