import { createElement } from 'react';
import { cn } from '../../../utils/cn';
import { BRAND_ACCENTS } from '../../../models/brand.model';
import { useInViewOnce } from './useInViewOnce';

export interface RevealCardProps {
  /** Elemento do card (li dentro de listas, article para conteúdo próprio) */
  as?: 'div' | 'li' | 'article';
  /** Posição na lista: cada card entra 80 ms depois do anterior */
  index?: number;
  /** Cor da linha do topo e do contorno no hover (padrão: verde-petróleo, igual em todos os cards) */
  accent?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Card no padrão dos cards de Indicadores, para fundos claros: entra em sequência ao
 * aparecer na tela (`countReveal`) e, no hover ou com o foco dentro, sobe, ganha sombra,
 * destaca o contorno e mostra a linha colorida do topo.
 */
export function RevealCard({
  as = 'div',
  index = 0,
  accent = BRAND_ACCENTS.verdePetroleo.color,
  className,
  children,
}: RevealCardProps) {
  const { ref, hasEntered } = useInViewOnce<HTMLElement>(0.15);

  return createElement(
    as,
    {
      ref,
      className: cn(
        'group/card relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-semispe-blue-dark/10 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:shadow-semispe-blue-dark/10 hover:ring-(--accent)/60 focus-within:ring-(--accent)/60',
        className
      ),
      style: {
        '--accent': accent,
        animation: hasEntered ? `countReveal 0.55s ease-out ${index * 80}ms both` : undefined,
        opacity: hasEntered ? undefined : 0,
      } as React.CSSProperties,
    },
    <span
      className="pointer-events-none absolute inset-x-0 top-0 z-10 h-1 bg-(--accent) opacity-0 transition-opacity duration-300 group-hover/card:opacity-100 group-focus-within/card:opacity-100"
      aria-hidden="true"
    />,
    children
  );
}
