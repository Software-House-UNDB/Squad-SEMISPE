import { Link } from 'react-router-dom';
import { ArrowRight, Lightbulb } from 'lucide-react';
import { BRAND_ACCENTS } from '../../models/brand.model';

export interface IdeiasCalloutProps {
  /** Nível do título: h3 dentro de uma seção (home), h2 como bloco próprio (página) */
  headingLevel?: 'h2' | 'h3';
  className?: string;
}

const TOWER_X = [70, 170, 270];

/** Silhueta da ponte do Quem Somos, só como decoração do canto do bloco */
function BridgeSketch() {
  return (
    <svg viewBox="0 0 340 120" className="absolute -right-6 bottom-0 hidden md:block w-[22rem] h-auto opacity-25" aria-hidden="true" focusable="false">
      <g fill="none" stroke="white" strokeLinecap="round">
        {TOWER_X.map((x, i) => (
          <g key={x} stroke={[BRAND_ACCENTS.azul.onDark, BRAND_ACCENTS.amarelo.color, BRAND_ACCENTS.verde.onDark][i]}>
            <line x1={x} y1="14" x2={x} y2="112" strokeWidth="5" />
            {[18, 34, 50].map((spread) => (
              <g key={spread} strokeWidth="1.4">
                <line x1={x} y1={20 + spread / 6} x2={x - spread} y2="74" />
                <line x1={x} y1={20 + spread / 6} x2={x + spread} y2="74" />
              </g>
            ))}
          </g>
        ))}
        <path d="M0 78 Q170 62 340 78" strokeWidth="6" />
      </g>
    </svg>
  );
}

/**
 * Chamada para o Banco de Ideias. Retoma a ponte do Quem Somos: de um lado ficam
 * as ideias, e é por elas que a travessia até as soluções começa.
 */
export function IdeiasCallout({ headingLevel = 'h3', className = '' }: IdeiasCalloutProps) {
  const Heading = headingLevel;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-semispe-blue-dark px-6 py-8 sm:px-10 sm:py-10 text-white ${className}`}
    >
      <BridgeSketch />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between md:pr-40 lg:pr-56">
        <div className="flex items-start gap-4">
          <span className="grid place-items-center w-12 h-12 shrink-0 rounded-full bg-semispe-yellow text-semispe-blue-dark">
            <Lightbulb className="w-6 h-6" aria-hidden="true" />
          </span>
          <div className="max-w-xl">
            <p className="text-[11px] font-black tracking-[0.2em] uppercase text-semispe-yellow">Banco de Ideias</p>
            <Heading className="mt-1.5 text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Toda ponte começa de um lado.
            </Heading>
            <p className="mt-2 text-sm sm:text-base leading-relaxed text-white/85">
              Tem uma ideia para resolver um desafio de São Luís? Envie para o Banco de Ideias: a equipe do Parque avalia
              cada proposta e você acompanha o andamento pela sua conta.
            </p>
          </div>
        </div>

        <Link
          to="/banco-de-ideias"
          className="group/cta self-start md:self-center inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl bg-semispe-yellow px-6 py-3.5 text-xs font-black tracking-wider uppercase text-semispe-blue-dark transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-semispe-blue-dark"
        >
          Envie sua ideia
          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover/cta:translate-x-0.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
