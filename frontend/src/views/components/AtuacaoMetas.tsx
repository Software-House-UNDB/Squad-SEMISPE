import { GraduationCap, Network, Rocket, Trophy, type LucideIcon } from 'lucide-react';
import { type EcosystemBridge, type Goal, type ProgramArea } from '../../models/quemSomos.model';
import { EcossistemaPonte } from './EcossistemaPonte';

export interface AtuacaoMetasProps {
  bridge: EcosystemBridge;
  programs: readonly ProgramArea[];
  goals: readonly Goal[];
}

const PROGRAM_ICONS: Record<ProgramArea['id'], LucideIcon> = {
  maratonas: Trophy,
  formacao: GraduationCap,
  incubacao: Rocket,
  conexao: Network,
};

/**
 * Card de vidro de uma frente de atuação: a foto aproxima e uma barra embaixo acende
 * na cor da frente quando o mouse passa.
 */
function ProgramCard({ program }: { program: ProgramArea }) {
  const Icon = PROGRAM_ICONS[program.id];

  return (
    <article
      style={{ '--accent': program.accent.onDark } as React.CSSProperties}
      className="group relative h-full flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:bg-white/10"
    >
      <figure className="relative aspect-[16/10] overflow-hidden bg-semispe-navy">
        <img
          src={program.photo.src}
          alt={program.photo.alt}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-semispe-navy/70 to-transparent" aria-hidden="true" />
        <figcaption className="absolute left-3 bottom-3 right-3 flex">
          <span className="truncate rounded-full bg-semispe-navy/80 px-2.5 py-1 text-[10px] sm:text-[11px] font-bold text-white backdrop-blur">
            {program.photo.caption}
          </span>
        </figcaption>
      </figure>

      <div className="flex-1 p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-(--accent)" aria-hidden="true">
            <Icon className="w-4 h-4" />
          </span>
          <h4 className="text-base font-black leading-snug">{program.title}</h4>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-semispe-gelo/90">{program.description}</p>
      </div>

      {/* Barra de baixo que acende na cor da frente no hover */}
      <span
        className="absolute inset-x-0 bottom-0 h-1 bg-(--accent) opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden="true"
      />
    </article>
  );
}

/**
 * Como o Parque atua: a ponte do ecossistema, as frentes de atuação e as metas, numa
 * seção azul-marinho com textura topográfica sutil e cards de vidro.
 */
export function AtuacaoMetas({ bridge, programs, goals }: AtuacaoMetasProps) {
  return (
    <section
      id="atuacao"
      aria-labelledby="atuacao-titulo"
      className="relative scroll-mt-20 overflow-hidden bg-semispe-navy py-16 lg:py-24 text-white"
    >
      <div className="textura-topografica absolute inset-0" aria-hidden="true" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="max-w-3xl">
          <p className="text-[11px] font-black tracking-[0.2em] uppercase text-[#6cc12e]">Atuação e metas</p>
          <h2 id="atuacao-titulo" className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">
            Como o Parque atua
          </h2>
          <p className="mt-4 text-base sm:text-lg leading-relaxed text-semispe-gelo">
            Buscamos promover o fortalecimento do ecossistema de inovação, estimular o empreendedorismo tecnológico e
            desenvolver soluções para os desafios da cidade.
          </p>
        </header>

        {/* O ecossistema como uma ponte sustentada por cinco pilares */}
        <EcossistemaPonte bridge={bridge} />

        {/* Frentes de atuação, cada uma com a foto de um evento real */}
        <h3 className="mt-16 text-xl sm:text-2xl font-black tracking-tight">Frentes de atuação</h3>
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {programs.map((program) => (
            <li key={program.id}>
              <ProgramCard program={program} />
            </li>
          ))}
        </ul>

        {/* Metas anunciadas no lançamento, em números grandes */}
        <div className="mt-16 border-t border-white/10 pt-12">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight">Aonde queremos chegar</h3>
              <p className="mt-1.5 text-sm text-semispe-gelo">Metas anunciadas no lançamento do Parque.</p>
            </div>
            <p className="text-xs font-bold tracking-[0.18em] uppercase text-white/60">Horizonte 2026 – 2029</p>
          </div>

          <dl className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
            {goals.map((goal, index) => (
              <div
                key={goal.id}
                className={`flex flex-col-reverse justify-end lg:pr-8 ${index > 0 ? 'lg:border-l lg:border-white/10 lg:pl-8' : ''}`}
              >
                <dt className="mt-3 text-sm font-bold leading-snug text-semispe-gelo">{goal.label}</dt>
                <dd>
                  <span className="block text-5xl sm:text-6xl font-extrabold tracking-tight">
                    {goal.value}
                    {goal.unit && <span className="ml-1 text-3xl sm:text-4xl text-[#6cc12e]">{goal.unit}</span>}
                  </span>
                  <span className="sr-only"> (meta até 2029)</span>
                  {/* Prazo da meta, sem preenchimento: não há dado de quanto já foi alcançado */}
                  <span
                    className="mt-4 flex items-center gap-2 text-[10px] font-bold tracking-[0.16em] uppercase text-white/60"
                    aria-hidden="true"
                  >
                    2026
                    <span className="relative h-px flex-1 border-t border-dashed border-white/30">
                      <span className="absolute -left-1 -top-[5px] h-2 w-2 rounded-full bg-white/40" />
                      <span className="absolute -right-1 -top-[7px] h-3 w-3 rounded-full bg-[#6cc12e] ring-4 ring-[#6cc12e]/20" />
                    </span>
                    2029
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
