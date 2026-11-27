import { Eye, Handshake, Landmark, Leaf, Lightbulb, Target, Users, type LucideIcon } from 'lucide-react';
import { type Statement, type ValueItem } from '../../models/quemSomos.model';
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

/**
 * Missão e visão em destaque e os valores logo abaixo, em layout editorial: sem caixas,
 * direto sobre o fundo branco, com barras e divisórias finas no lugar dos cards.
 */
export function MissaoVisaoValores({ statements, values }: MissaoVisaoValoresProps) {
  return (
    <section id="missao" aria-labelledby="missao-titulo" className="scroll-mt-20 bg-white py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="max-w-2xl">
          <p className="text-[11px] font-black tracking-[0.2em] uppercase text-semispe-blue-dark/75">
            Missão, visão e valores
          </p>
          <h2 id="missao-titulo" className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">
            O que nos move
          </h2>
        </header>

        <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-16">
          {statements.map((statement) => {
            const Icon = STATEMENT_ICONS[statement.id];
            return (
              <article
                key={statement.id}
                style={{ '--accent': statement.accent.onLight } as React.CSSProperties}
                className="border-t-4 border-(--accent) pt-6"
              >
                <h3 className="flex items-center gap-3 text-sm font-black tracking-[0.2em] uppercase text-(--accent)">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                  {statement.title}
                </h3>
                <p className="mt-4 text-xl sm:text-2xl font-bold leading-snug">{statement.text}</p>
              </article>
            );
          })}
        </div>

        <h3 className="mt-16 text-xl sm:text-2xl font-black tracking-tight">Nossos valores</h3>
        <ul className="mt-6 grid gap-y-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-y-0">
          {values.map((value, index) => (
            <ValueItemView key={value.id} value={value} index={index} isLast={index === values.length - 1} />
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * Um valor no grid editorial: ícone grande, título e texto alinhados à esquerda, com
 * divisória vertical fina entre os itens no computador. Entra em sequência ao aparecer.
 */
function ValueItemView({ value, index, isLast }: { value: ValueItem; index: number; isLast: boolean }) {
  const { ref, hasEntered } = useInViewOnce<HTMLLIElement>(0.15);
  const Icon = VALUE_ICONS[value.id];

  // Espaçamento: no celular em 2 colunas, a da direita ganha recuo; no computador, todos
  // têm recuo dos dois lados, menos o primeiro (sem recuo à esquerda) e o último (sem divisória)
  const spacing = [
    index % 2 === 1 ? 'sm:pl-6' : '',
    index === 0 ? 'lg:pl-0 lg:pr-6' : isLast ? 'lg:pl-6 lg:pr-0' : 'lg:px-6',
    isLast ? '' : 'lg:border-r lg:border-slate-200/80',
  ].join(' ');

  return (
    <li
      ref={ref}
      className={spacing}
      style={{
        animation: hasEntered ? `countReveal 0.55s ease-out ${index * 80}ms both` : undefined,
        opacity: hasEntered ? undefined : 0,
      }}
    >
      <span
        className="grid h-14 w-14 place-items-center rounded-2xl"
        style={{ background: value.accent.tint, color: value.accent.onLight }}
        aria-hidden="true"
      >
        <Icon className="w-7 h-7" />
      </span>
      <h4 className="mt-5 text-base font-black leading-snug">{value.title}</h4>
      <p className="mt-1.5 text-sm leading-relaxed text-semispe-blue-dark/75">{value.description}</p>
    </li>
  );
}
