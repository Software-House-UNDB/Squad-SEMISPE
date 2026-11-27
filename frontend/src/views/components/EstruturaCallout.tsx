import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck } from 'lucide-react';
import { type QuemSomosContent } from '../../models/quemSomos.model';
import { type NavItem } from '../../models/navigation.model';

export interface EstruturaCalloutProps {
  content: QuemSomosContent['estrutura'];
  /** Seção da Estrutura (rótulo da pílula) */
  section: NavItem;
  espacosHref: string;
  reservaHref: string;
}

const buttonBase =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-7 py-4 text-sm font-semibold tracking-wider uppercase transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-semispe-navy';

/**
 * Chamada final para a Estrutura: a foto do espaço ocupa a seção toda, com degradê
 * azul-marinho para o texto e os botões ficarem legíveis. Sem textura sobre a foto.
 * O botão principal é amarelo, o ponto focal da ação.
 */
export function EstruturaCallout({ content, section, espacosHref, reservaHref }: EstruturaCalloutProps) {
  return (
    <section
      id="espacos"
      aria-labelledby="espacos-titulo"
      className="relative isolate scroll-mt-20 overflow-hidden bg-semispe-navy text-white"
    >
      <img
        src={content.photo.src}
        alt={content.photo.alt}
        loading="lazy"
        className="absolute inset-0 -z-10 h-full w-full object-cover"
      />
      {/* No celular o degradê vem de baixo; no computador, da esquerda, onde fica o texto */}
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-t from-semispe-navy via-semispe-navy/85 to-semispe-navy/30 md:bg-gradient-to-r md:from-semispe-navy md:via-semispe-navy/85 md:to-transparent"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-semispe-yellow/40 bg-white/10 px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-bold tracking-widest uppercase backdrop-blur">
            <span className="w-1.5 h-1.5 rounded-full bg-semispe-yellow" aria-hidden="true" />
            {section.label}
          </span>

          <h2 id="espacos-titulo" className="mt-5 text-3xl sm:text-5xl font-black tracking-tight">
            {content.title}
          </h2>
          <p className="mt-4 text-base sm:text-lg leading-relaxed text-semispe-gelo">{content.text}</p>

          <div className="mt-9 flex flex-col sm:flex-row sm:flex-wrap gap-3">
            <Link
              to={espacosHref}
              className={`group/cta ${buttonBase} bg-semispe-yellow text-semispe-navy shadow-lg shadow-black/20 hover:-translate-y-1 hover:shadow-xl hover:shadow-semispe-yellow/30`}
            >
              Conheça nossos espaços
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover/cta:translate-x-0.5" aria-hidden="true" />
            </Link>
            <Link to={reservaHref} className={`${buttonBase} ring-2 ring-inset ring-white/60 hover:bg-white/10`}>
              <CalendarCheck className="w-4 h-4" aria-hidden="true" />
              Fazer reserva
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
