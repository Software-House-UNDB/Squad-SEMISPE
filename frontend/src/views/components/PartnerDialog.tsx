import { useEffect, useRef } from 'react';
import { MapPin, X } from 'lucide-react';
import { PARTNER_CATEGORY_INFO, type Partner } from '../../models/partner.model';
import { PartnerLogo } from './PartnerLogo';

export interface PartnerDialogProps {
  partner: Partner;
  onClose: () => void;
}

/** Detalhe do parceiro num modal nativo (prende o foco, fecha no Esc e devolve o foco ao card) */
export function PartnerDialog({ partner, onClose }: PartnerDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const category = PARTNER_CATEGORY_INFO[partner.category];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="parceiro-titulo"
      className="m-auto w-[calc(100%-2rem)] max-w-lg max-h-[calc(100svh-2rem)] overflow-y-auto overscroll-contain rounded-2xl bg-white p-0 text-semispe-blue-dark shadow-2xl backdrop:bg-semispe-blue-dark/60 backdrop:backdrop-blur-[2px]"
    >
      <span className="block h-1.5" style={{ background: category.accent.color }} aria-hidden="true" />
      <div className="px-5 pt-5 pb-7 sm:px-7 sm:pt-6">
        <div className="flex items-start justify-between gap-4">
          <PartnerLogo partner={partner} className="h-20 w-44 rounded-2xl text-2xl ring-1 ring-semispe-blue-dark/10" />
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Fechar"
            className="grid place-items-center w-9 h-9 shrink-0 rounded-full transition-colors cursor-pointer hover:bg-semispe-blue-dark/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-semispe-blue-dark"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <p
          className="mt-5 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold tracking-wider uppercase"
          style={{ background: category.accent.tint, color: category.accent.onLight }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: category.accent.color }} aria-hidden="true" />
          {category.label}
        </p>
        <h2 id="parceiro-titulo" className="mt-3 text-2xl font-black tracking-tight leading-tight">
          {partner.name}
        </h2>
        {partner.origin && (
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-semispe-blue-dark/75">
            <MapPin className="w-4 h-4" aria-hidden="true" />
            {partner.origin}
          </p>
        )}
        <p className="mt-4 text-sm sm:text-base leading-relaxed text-semispe-blue-dark/80 whitespace-pre-line">
          {partner.description}
        </p>
      </div>
    </dialog>
  );
}
