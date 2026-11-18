import { useState } from 'react';
import { PARTNER_CATEGORY_INFO, partnerInitials, type Partner } from '../../models/partner.model';
import { cn } from '../../utils/cn';

/**
 * Logo do parceiro sobre fundo branco. Sem logo cadastrado (ou se a imagem falhar),
 * mostra a sigla na cor da categoria.
 */
export function PartnerLogo({ partner, className }: { partner: Partner; className?: string }) {
  const [hasFailed, setHasFailed] = useState(false);
  const accent = PARTNER_CATEGORY_INFO[partner.category].accent;

  if (partner.logoUrl && !hasFailed) {
    return (
      <span className={cn('block overflow-hidden bg-white', className)}>
        {/* Ocupa a caixa toda e se ajusta dentro dela, com um respiro em volta */}
        <img
          src={partner.logoUrl}
          alt={`Logo de ${partner.name}`}
          loading="lazy"
          onError={() => setHasFailed(true)}
          className="h-full w-full object-contain p-3"
        />
      </span>
    );
  }

  const initials = partnerInitials(partner.name);
  return (
    <span
      className={cn('grid place-items-center font-black tracking-tight', className)}
      style={{ background: accent.tint, color: accent.onLight }}
      aria-hidden="true"
    >
      {/* Siglas maiores (UNDB, IFMA) ficam menores para caber no selo */}
      <span style={{ fontSize: initials.length > 2 ? '0.78em' : undefined }}>{initials}</span>
    </span>
  );
}
