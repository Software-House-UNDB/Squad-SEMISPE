import { ArrowDown, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';
import graphicTriangulos from '../../assets/graphics/graphic-brand-triangles.svg';
import { type QuemSomosIntro } from '../../models/quemSomos.model';
import { type NavItem } from '../../models/navigation.model';
import { SectionPill } from './ui/SectionPill';

export interface QuemSomosHeroProps {
  intro: QuemSomosIntro;
  /** Seção representada (rótulo e cor de identidade da pílula de abertura) */
  section: NavItem;
}

/**
 * Abertura da página Quem Somos: o que é o Parque, a história curta e a foto do lançamento.
 * Fundo areia, que conversa com a arquitetura do Trapiche Santo Ângelo na Praia Grande.
 */
export function QuemSomosHero({ intro, section }: QuemSomosHeroProps) {
  return (
    <section aria-labelledby="quem-somos-titulo" className="relative overflow-hidden bg-semispe-areia">
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
          {/* A história ganha um filete cor de pedra, como nas paredes do Trapiche */}
          <p className="mt-4 border-l-2 border-[#c9b99a] pl-4 text-sm sm:text-base leading-relaxed text-semispe-blue-dark/75">
            {intro.history}
          </p>

          <dl className="mt-8 grid gap-5 border-t border-semispe-blue-dark/10 pt-6 sm:grid-cols-3">
            {intro.facts.map((fact) => (
              <div key={fact.id} className="min-w-0">
                <dt className="text-[11px] font-black tracking-[0.18em] uppercase text-semispe-blue-dark/75">
                  {fact.label}
                </dt>
                <dd className="mt-1 text-sm font-bold leading-snug">{fact.value}</dd>
              </div>
            ))}
          </dl>

          {/* Atalhos para as seções da página */}
          <nav aria-label="Nesta página" className="mt-8">
            <ul className="flex flex-wrap gap-2">
              {intro.anchors.map((anchor) => (
                <li key={anchor.id}>
                  <Link
                    to={`#${anchor.id}`}
                    style={{ '--accent': anchor.accent.onLight, '--dot': anchor.accent.color } as React.CSSProperties}
                    className="group inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-xs font-bold shadow-sm ring-1 ring-semispe-blue-dark/10 transition-colors duration-200 hover:ring-(--accent) hover:text-(--accent) focus:outline-none focus-visible:ring-2 focus-visible:ring-semispe-blue-dark"
                  >
                    <span className="w-2 h-2 rounded-full bg-(--dot)" aria-hidden="true" />
                    {anchor.label}
                    <ArrowDown className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-y-0.5" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Foto do lançamento, no mesmo recorte de cantos da foto da home */}
        <figure className="lg:col-span-6" style={{ animation: 'fadeInRight 0.8s ease-out 0.2s both' }}>
          <div className="relative mx-auto max-w-xl lg:max-w-none">
            {/* Bloco areia deslocado atrás da foto, para dar profundidade */}
            <div
              aria-hidden="true"
              className="absolute inset-0 translate-x-3 -translate-y-3 sm:translate-x-5 sm:-translate-y-5 rounded-tl-[4.5rem] rounded-br-[4rem] bg-semispe-areia-escura"
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
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold shadow-sm">
              <CalendarDays className="w-3.5 h-3.5 text-semispe-blue" aria-hidden="true" />
              {intro.photo.caption}
            </span>
          </figcaption>
        </figure>

      </div>
    </section>
  );
}
