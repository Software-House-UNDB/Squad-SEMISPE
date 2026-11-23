import { ArrowUpRight, MapPin } from 'lucide-react';
import { PARTNER_CATEGORY_INFO, type Partner } from '../../models/partner.model';
import { PartnerLogo } from './PartnerLogo';
import { RevealCard } from './ui/RevealCard';

export interface PartnerCardProps {
  partner: Partner;
  /** Posição na lista, para a entrada em sequência */
  index: number;
  onOpen: (partner: Partner) => void;
}

/** Card do parceiro na página /parceiros, no padrão dos Indicadores: o card inteiro abre o detalhe */
export function PartnerCard({ partner, index, onOpen }: PartnerCardProps) {
  const category = PARTNER_CATEGORY_INFO[partner.category];

  return (
    <RevealCard
      as="article"
      index={index}
      // O botão do nome não mostra contorno próprio: o foco do teclado aparece no card todo
      className="flex h-full flex-col p-5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-semispe-blue-dark"
    >
      <PartnerLogo partner={partner} className="h-24 w-full rounded-xl text-2xl ring-1 ring-semispe-blue-dark/10" />

      <span
        className="mt-4 self-start rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase"
        style={{ background: category.accent.tint, color: category.accent.onLight }}
      >
        {category.label}
      </span>

      <h3 className="mt-2.5 text-lg font-black leading-snug">
        {/* O botão cobre o card todo (o card inteiro é clicável) */}
        <button
          type="button"
          onClick={() => onOpen(partner)}
          className="text-left cursor-pointer focus:outline-none after:absolute after:inset-0 after:content-['']"
        >
          {partner.name}
        </button>
      </h3>
      {partner.origin && (
        <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-bold text-semispe-blue-dark/75">
          <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
          {partner.origin}
        </p>
      )}
      <p className="mt-2.5 flex-1 text-sm leading-relaxed text-semispe-blue-dark/75">{partner.shortDescription}</p>

      <span
        className="mt-4 inline-flex items-center gap-1 text-xs font-black tracking-wider uppercase text-semispe-blue-dark/80 transition-colors group-hover/card:text-semispe-blue-dark"
        aria-hidden="true"
      >
        Ver detalhes
        <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover/card:-translate-y-0.5 group-hover/card:translate-x-0.5" />
      </span>
    </RevealCard>
  );
}
