import { Eye, Handshake, Landmark, Leaf, Lightbulb, Target, Users, type LucideIcon } from 'lucide-react';
import { type Statement, type ValueItem } from '../../models/quemSomos.model';
import { AccentIcon } from './ui/AccentIcon';
import { useInViewOnce } from './ui/useInViewOnce';

export interface MissaoVisaoValoresProps {
  statements: readonly Statement[];
  values: readonly ValueItem[];
}

const STATEMENT_ICONS: Record<Statement['id'], LucideIcon> = {
  missao: Target,
  visao: Eye,
};

const VALUE_ICONS: Record<ValueItem['id'], LucideIcon> = {
  colaboracao: Handshake,
  inovacao: Lightbulb,
  sustentabilidade: Leaf,
  inclusao: Users,
  patrimonio: Landmark,
};

/** Missão e visão em destaque e os valores logo abaixo, cada item com uma cor do logotipo */
export function MissaoVisaoValores({ statements, values }: MissaoVisaoValoresProps) {
  return (
    <section id="missao" aria-labelledby="missao-titulo" className="scroll-mt-20 bg-semispe-surface py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="max-w-2xl">
          <p className="text-[11px] font-black tracking-[0.2em] uppercase text-semispe-blue-dark/75">
            Missão, visão e valores
          </p>
          <h2 id="missao-titulo" className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">
            O que nos move
          </h2>
        </header>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {statements.map((statement) => (
            <article
              key={statement.id}
              style={{ '--accent': statement.accent.onLight } as React.CSSProperties}
              className="relative overflow-hidden rounded-2xl bg-white p-6 sm:p-8 shadow-sm ring-1 ring-semispe-blue-dark/10"
            >
              <span className="absolute inset-x-0 top-0 h-1 bg-(--accent)" aria-hidden="true" />
              <div className="flex items-center gap-3">
                <AccentIcon icon={STATEMENT_ICONS[statement.id]} accent={statement.accent} />
                <h3 className="text-sm font-black tracking-[0.2em] uppercase text-(--accent)">{statement.title}</h3>
              </div>
              <p className="mt-5 text-lg sm:text-xl font-bold leading-snug">{statement.text}</p>
            </article>
          ))}
        </div>

        <h3 className="mt-14 text-xl sm:text-2xl font-black tracking-tight">Nossos valores</h3>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {values.map((value, index) => (
            <ValueCard key={value.id} value={value} index={index} />
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * Card de valor com a mesma animação dos cards de Indicadores: surge em sequência ao entrar
 * na tela (`countReveal`, 80 ms entre um e outro) e, no hover, sobe e mostra uma linha no topo.
 * Aqui a linha e o contorno usam a cor do logo de cada valor, no lugar do amarelo fixo.
 */
function ValueCard({ value, index }: { value: ValueItem; index: number }) {
  const { ref, hasEntered } = useInViewOnce<HTMLLIElement>(0.15);

  return (
    <li
      ref={ref}
      className="group/valor relative flex flex-col overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-semispe-blue-dark/10 cursor-default transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:shadow-semispe-blue-dark/10 hover:ring-(--accent)/60"
      style={
        {
          '--accent': value.accent.color,
          animation: hasEntered ? `countReveal 0.55s ease-out ${index * 80}ms both` : undefined,
          opacity: hasEntered ? undefined : 0,
        } as React.CSSProperties
      }
    >
      <span
        className="absolute inset-x-0 top-0 h-1 bg-(--accent) opacity-0 transition-opacity duration-300 group-hover/valor:opacity-100"
        aria-hidden="true"
      />
      <AccentIcon icon={VALUE_ICONS[value.id]} accent={value.accent} />
      <h4 className="mt-4 text-base font-black leading-snug">{value.title}</h4>
      <p className="mt-1.5 text-sm leading-relaxed text-semispe-blue-dark/75">{value.description}</p>
    </li>
  );
}
