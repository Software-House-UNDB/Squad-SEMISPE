import { ArrowDown, Building2, CalendarDays, MapPin, type LucideIcon } from 'lucide-react';
import graphicTriangulos from '../../assets/graphics/graphic-brand-triangles.svg';
import { type KeyFact, type QuemSomosIntro } from '../../models/quemSomos.model';
import { type NavItem } from '../../models/navigation.model';
import { SectionPill } from './ui/SectionPill';
import { AccentIcon } from './ui/AccentIcon';

export interface QuemSomosHeroProps {
  intro: QuemSomosIntro;
  /** Seção representada (rótulo e cor de identidade da pílula de abertura) */
  section: NavItem;
}

const FACT_ICONS: Record<KeyFact['id'], LucideIcon> = {
  gestao: Building2,
  sede: MapPin,
  lancamento: CalendarDays,
};

/** Abertura da página Quem Somos: o que é o Parque, a história curta e a foto do lançamento */
export function QuemSomosHero({ intro, section }: QuemSomosHeroProps) {
  return (
    <section aria-labelledby="quem-somos-titulo" className="relative overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 lg:pt-16 lg:pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">

        {/* Texto: entra de baixo, como a abertura da home */}
        <div className="lg:col-span-6" style={{ animation: 'fadeInUp 0.7s ease-out both' }}>
          <SectionPill label={section.label} accent={section.accent} tone="light" />

          <h1
            id="quem-somos-titulo"
            className="mt-5 text-4xl sm:text-5xl font-black tracking-tight leading-[1.1]"
          >
            {intro.title} <span className="text-semispe-blue">{intro.titleHighlight}</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg leading-relaxed text-semispe-blue-dark/90">{intro.lead}</p>
          <p className="mt-4 text-sm sm:text-base leading-relaxed text-semispe-blue-dark/75">{intro.history}</p>

          <dl className="mt-8 grid gap-3 sm:grid-cols-3">
            {intro.facts.map((fact) => (
              <div key={fact.id} className="flex items-start gap-3 rounded-2xl bg-semispe-surface p-3.5">
                <AccentIcon icon={FACT_ICONS[fact.id]} accent={fact.accent} size="sm" />
                <div className="min-w-0">
                  <dt className="text-[11px] font-black tracking-wider uppercase text-semispe-blue-dark/75">
                    {fact.label}
                  </dt>
                  <dd className="mt-0.5 text-sm font-bold leading-snug">{fact.value}</dd>
                </div>
              </div>
            ))}
          </dl>

          {/* Atalhos para as seções da página */}
          <nav aria-label="Nesta página" className="mt-8">
            <ul className="flex flex-wrap gap-2">
              {intro.anchors.map((anchor) => (
                <li key={anchor.id}>
                  <a
                    href={`#${anchor.id}`}
                    style={{ '--accent': anchor.accent.onLight, '--dot': anchor.accent.color } as React.CSSProperties}
                    className="group inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-xs font-bold ring-1 ring-semispe-blue-dark/15 transition-colors duration-200 hover:ring-(--accent) hover:text-(--accent) focus:outline-none focus-visible:ring-2 focus-visible:ring-semispe-blue-dark"
                  >
                    <span className="w-2 h-2 rounded-full bg-(--dot)" aria-hidden="true" />
                    {anchor.label}
                    <ArrowDown className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-y-0.5" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Foto do lançamento, no mesmo recorte de cantos da foto da home */}
        <figure className="lg:col-span-6" style={{ animation: 'fadeInRight 0.8s ease-out 0.2s both' }}>
          <div className="relative mx-auto max-w-xl lg:max-w-none">
            {/* Bloco azul-claro deslocado atrás da foto, para dar profundidade */}
            <div
              aria-hidden="true"
              className="absolute inset-0 translate-x-3 -translate-y-3 sm:translate-x-5 sm:-translate-y-5 rounded-tl-[4.5rem] rounded-br-[4rem] bg-semispe-blue/15"
            />
            <div className="relative aspect-[4/3] overflow-hidden rounded-tl-[4.5rem] rounded-br-[4rem] bg-semispe-blue-dark shadow-xl shadow-semispe-blue-dark/15">
              <img
                src={intro.photo.src}
                alt={intro.photo.alt}
                fetchPriority="high"
                className="w-full h-full object-cover"
              />
            </div>
            <img
              src={graphicTriangulos}
              alt=""
              aria-hidden="true"
              className="absolute -bottom-6 -left-4 sm:-left-6 w-20 h-20 sm:w-24 sm:h-24 object-contain pointer-events-none select-none drop-shadow-md"
            />
          </div>
          <figcaption className="mt-4 flex justify-end">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-semispe-surface px-3.5 py-1.5 text-xs font-bold">
              <CalendarDays className="w-3.5 h-3.5 text-semispe-blue" aria-hidden="true" />
              {intro.photo.caption}
            </span>
          </figcaption>
        </figure>

      </div>
    </section>
  );
}
