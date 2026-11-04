import { Clock, MapPin } from 'lucide-react';
// O lucide-react tirou os ícones de marcas; o react-icons ainda traz o do Instagram no mesmo traço
import { LuInstagram } from 'react-icons/lu';
import { type OpeningHours, type ParqueAddress, type SocialLink } from '../../models/estrutura.model';

export interface EstruturaInfoProps {
  openingHours: readonly OpeningHours[];
  address: ParqueAddress;
  instagram: SocialLink;
  className?: string;
}

const linkClass =
  'font-bold underline underline-offset-2 decoration-semispe-blue-dark/40 hover:decoration-semispe-blue-dark rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-semispe-blue-dark';

/** Funcionamento, endereço e contato do Parque (no lugar da contagem regressiva do INEP) */
export function EstruturaInfo({ openingHours, address, instagram, className = '' }: EstruturaInfoProps) {
  return (
    <div className={`rounded-2xl bg-semispe-blue-dark/[0.06] p-5 space-y-4 text-sm text-semispe-blue-dark ${className}`}>
      <div className="flex gap-3">
        <Clock className="w-4 h-4 mt-0.5 shrink-0 text-semispe-blue" aria-hidden="true" />
        <div>
          <p className="text-[11px] font-black tracking-wider uppercase">Funcionamento</p>
          {openingHours.map((item) => (
            <p key={item.days} className="mt-1">
              {item.days}: <strong className="font-black">{item.hours}</strong>
            </p>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-semispe-green-dark" aria-hidden="true" />
        <div>
          <p className="text-[11px] font-black tracking-wider uppercase">Endereço</p>
          <p className="mt-1">
            {address.place}, {address.complex}
          </p>
          <p className="text-xs text-semispe-blue-dark/75">{address.street}</p>
          <a href={address.mapUrl} target="_blank" rel="noreferrer" className={`inline-block mt-1.5 text-xs ${linkClass}`}>
            Ver no mapa
          </a>
        </div>
      </div>

      <div className="flex gap-3 items-center">
        <LuInstagram className="w-4 h-4 shrink-0 text-semispe-teal" aria-hidden="true" />
        <a
          href={instagram.url}
          target="_blank"
          rel="noreferrer"
          aria-label={`Instagram da SEMISPE: ${instagram.handle}`}
          className={linkClass}
        >
          {instagram.handle}
        </a>
      </div>
    </div>
  );
}
