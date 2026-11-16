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
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-6 py-3.5 text-xs font-black tracking-wider uppercase transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-semispe-blue-dark focus-visible:ring-offset-2';

/**
 * Chamada final para a Estrutura. O amarelo-claro é a identidade da Estrutura e
 * fica só nos detalhes (faixa, pílula e hover), não como fundo grande.
 */
export function EstruturaCallout({ content, section, espacosHref, reservaHref }: EstruturaCalloutProps) {
  return (
    <section id="espacos" aria-labelledby="espacos-titulo" className="scroll-mt-20 bg-semispe-surface py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-semispe-blue-dark/10 lg:grid-cols-2">
          <div className="relative aspect-[16/10] lg:aspect-auto lg:min-h-[22rem] bg-semispe-blue-dark">
            <img
              src={content.photo.src}
              alt={content.photo.alt}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>

          <div className="relative p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
            <span className="absolute inset-x-0 top-0 h-1.5 bg-semispe-yellow-light" aria-hidden="true" />

            <span className="self-start inline-flex items-center gap-2 rounded-full bg-semispe-yellow-soft px-3 py-1.5 text-[10px] sm:text-xs font-bold tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-semispe-yellow ring-1 ring-[#806a00]/50" aria-hidden="true" />
              {section.label}
            </span>

            <h2 id="espacos-titulo" className="mt-4 text-3xl sm:text-4xl font-black tracking-tight">
              {content.title}
            </h2>
            <p className="mt-3 text-sm sm:text-base leading-relaxed text-semispe-blue-dark/80">{content.text}</p>

            <div className="mt-8 flex flex-col sm:flex-row sm:flex-wrap gap-3">
              <Link
                to={espacosHref}
                className={`group/cta ${buttonBase} bg-semispe-blue-dark text-white hover:bg-semispe-yellow-light hover:text-semispe-blue-dark`}
              >
                Conheça nossos espaços
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover/cta:translate-x-0.5" aria-hidden="true" />
              </Link>
              <Link
                to={reservaHref}
                className={`${buttonBase} ring-2 ring-inset ring-semispe-blue-dark/80 hover:bg-semispe-yellow-soft`}
              >
                <CalendarCheck className="w-4 h-4" aria-hidden="true" />
                Fazer reserva
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
