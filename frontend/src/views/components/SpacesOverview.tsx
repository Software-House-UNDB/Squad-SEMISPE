import { Link } from 'react-router-dom';
import {
  AirVent,
  ArrowRight,
  Camera,
  Mic,
  Presentation,
  Speaker,
  Users,
  Wifi,
  type LucideIcon,
} from 'lucide-react';
import { BRAND_ACCENTS } from '../../models/brand.model';
import { type Space, type SpaceAmenity } from '../../models/space.model';
import { useEstruturaContext } from '../../viewmodels/useEstruturaViewModel';

const AMENITY_ICONS: Record<SpaceAmenity['id'], LucideIcon> = {
  'ar-condicionado': AirVent,
  wifi: Wifi,
  lousa: Presentation,
  som: Speaker,
  microfones: Mic,
};

/** Cada comodidade com uma cor do logotipo: fundo clarinho e o ícone no tom legível */
const AMENITY_COLORS: Record<SpaceAmenity['id'], { tint: string; icon: string }> = {
  'ar-condicionado': { tint: '#e6f0f9', icon: BRAND_ACCENTS.azul.onLight },
  wifi: { tint: '#e7f2de', icon: BRAND_ACCENTS.verde.onLight },
  lousa: { tint: '#fff8d1', icon: BRAND_ACCENTS.amareloClaro.onLight },
  som: { tint: '#dff0ea', icon: BRAND_ACCENTS.verdePetroleo.onLight },
  microfones: { tint: '#eef3d4', icon: BRAND_ACCENTS.verdeOliva.onLight },
};

/**
 * Fundos das artes provisórias, um por espaço em sequência, nas cores do logotipo:
 * tons escuros o bastante para o texto branco passar de 4.5:1
 */
const PLACEHOLDER_GRADIENTS: readonly string[] = [
  'linear-gradient(135deg, #185b94, #1f71b7)',
  'linear-gradient(135deg, #1c5800, #2f7d00)',
  'linear-gradient(135deg, #134d3e, #22755e)',
  'linear-gradient(135deg, #4d5a00, #637400)',
];

/** Arte provisória enquanto o espaço não tem foto */
function PhotoPlaceholder({ background }: { background: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white" style={{ background }}>
      <Camera className="w-8 h-8" aria-hidden="true" />
      <span className="text-[10px] sm:text-[11px] font-bold tracking-widest uppercase">Foto em breve</span>
    </div>
  );
}

function SpaceCard({ space, reservaHref, index }: { space: Space; reservaHref: string; index: number }) {
  const photo = space.photoUrls[0];

  return (
    <article className="group h-full flex flex-col rounded-2xl bg-white overflow-hidden shadow-sm ring-1 ring-semispe-blue-dark/10 transition-shadow duration-300 hover:shadow-lg hover:shadow-semispe-blue-dark/10">
      <div className="relative aspect-[16/10] overflow-hidden bg-semispe-blue-dark">
        {photo ? (
          <img
            src={photo}
            alt={`Foto do espaço ${space.name}`}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <PhotoPlaceholder background={PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length]} />
        )}
        <span className="absolute left-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-black text-semispe-blue-dark shadow-md">
          <Users className="w-3.5 h-3.5" aria-hidden="true" />
          {space.capacity ? `Até ${space.capacity} pessoas` : 'Capacidade a confirmar'}
        </span>
      </div>

      <div className="flex-1 flex flex-col p-5">
        <h3 className="text-lg font-black leading-snug">{space.name}</h3>
        {space.description && (
          <p className="mt-1.5 text-sm text-semispe-blue-dark/75 leading-relaxed">{space.description}</p>
        )}
        {space.equipment.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Equipamentos disponíveis">
            {space.equipment.map((item) => (
              <li key={item} className="rounded-full bg-semispe-surface px-2.5 py-1 text-[11px] font-bold">
                {item}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto pt-5">
          <Link
            to={reservaHref}
            aria-label={`Reservar o espaço ${space.name}`}
            className="group/cta flex w-full items-center justify-center gap-2 rounded-xl bg-semispe-blue-dark px-4 py-3 text-xs font-black tracking-wider uppercase text-white transition-colors duration-200 hover:bg-semispe-yellow-light hover:text-semispe-blue-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-semispe-blue-dark focus-visible:ring-offset-2"
          >
            Reservar este espaço
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover/cta:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

/** "Nossos espaços": comodidades e um cartão por espaço, com a chamada para a reserva */
export function SpacesOverview() {
  const vm = useEstruturaContext();

  return (
    <div className="max-w-6xl">
      <header className="max-w-2xl">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Nossos espaços</h1>
        <p className="mt-3 text-sm sm:text-base text-semispe-blue-dark/75 leading-relaxed">
          Conheça os espaços do Parque Tecnológico no Trapiche Santo Ângelo e escolha o ideal para a sua
          reunião, evento ou atividade.
        </p>
      </header>

      <section aria-labelledby="comodidades" className="mt-8">
        <h2 id="comodidades" className="text-[11px] font-black tracking-[0.2em] uppercase text-semispe-blue-dark/65">
          Comodidades
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {vm.amenities.map((amenity) => {
            const Icon = AMENITY_ICONS[amenity.id];
            const colors = AMENITY_COLORS[amenity.id];
            return (
              <li
                key={amenity.id}
                className="inline-flex items-center gap-2 rounded-full bg-white pl-1.5 pr-3.5 py-1.5 text-xs font-bold shadow-sm ring-1 ring-semispe-blue-dark/10"
              >
                <span
                  className="grid place-items-center w-6 h-6 rounded-full"
                  style={{ background: colors.tint, color: colors.icon }}
                >
                  <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                </span>
                {amenity.label}
              </li>
            );
          })}
        </ul>
      </section>

      <ul className="mt-10 grid gap-5 lg:gap-6 sm:grid-cols-2 min-[85rem]:grid-cols-3">
        {vm.spaces.map((space, index) => (
          <li key={space.id}>
            <SpaceCard space={space} reservaHref={vm.reservaHref(space.id)} index={index} />
          </li>
        ))}
      </ul>
    </div>
  );
}
